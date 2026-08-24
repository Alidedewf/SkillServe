import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiUploadCloud, FiX, FiCheckCircle, FiZap, FiAward, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  adminGetMenuCategories,
  adminCreateMenuCategory,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  adminDeleteMenuCategory,
  adminUploadMenuPdf,
  adminConfirmParsedMenu,
  getCurrentRole,
  adminGetMenuAiStatus,
  adminRegenerateMenuCourse,
  adminGenerateTraining
} from '../../services/adminApi';
import { fetchUserProfile } from '../../services/api';
import styles from './AdminMenu.module.css';

// Стадии фоновой AI-генерации (Sales Guide → уроки → тесты → курс)
const GEN_STAGES = [
  { key: 'generating_sales_guide', label: 'Советы по продаже', icon: FiZap },
  { key: 'creating_training', label: 'Уроки по категориям', icon: FiFileText },
  { key: 'creating_quizzes', label: 'Тесты по блюдам', icon: FiCheckCircle },
  { key: 'ready', label: 'Курс готов', icon: FiAward },
];
const GEN_ACTIVE = ['parsing_menu', 'generating_sales_guide', 'creating_training', 'creating_quizzes'];
const genStageIndex = (s) => GEN_STAGES.findIndex((x) => x.key === s);

// Sales Guide: модель (с массивами) <-> форма (строки, массивы по строкам)
const emptySalesGuide = () => ({ sellingPhrase: '', upsell: '', crossSell: '', premiumOffer: '', keyAdvantages: '', guestQuestions: '', guestAnswers: '' });

const salesGuideToForm = (sg) => {
  if (!sg) return emptySalesGuide();
  const join = (a) => (Array.isArray(a) ? a.join('\n') : '');
  return {
    sellingPhrase: sg.sellingPhrase || '',
    upsell: sg.upsell || '',
    crossSell: sg.crossSell || '',
    premiumOffer: sg.premiumOffer || '',
    keyAdvantages: join(sg.keyAdvantages),
    guestQuestions: join(sg.guestQuestions),
    guestAnswers: join(sg.guestAnswers),
  };
};

const formToSalesGuide = (f) => {
  const lines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const keyAdvantages = lines(f.keyAdvantages);
  const guestQuestions = lines(f.guestQuestions);
  const guestAnswers = lines(f.guestAnswers);
  const has = f.sellingPhrase.trim() || f.upsell.trim() || f.crossSell.trim() || f.premiumOffer.trim() || keyAdvantages.length || guestQuestions.length;
  if (!has) return null; // пусто — очищаем советы
  return {
    sellingPhrase: f.sellingPhrase.trim(),
    upsell: f.upsell.trim(),
    crossSell: f.crossSell.trim(),
    premiumOffer: f.premiumOffer.trim(),
    keyAdvantages, guestQuestions, guestAnswers,
    status: 'ok',
  };
};

const POSITIONS = ['Официант', 'Бармен', 'Менеджер', 'Повар'];

const AdminMenu = () => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'pdf'
  
  // States for manual menu
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for PDF menu
  const [uploading, setUploading] = useState(false);
  const [previewMenu, setPreviewMenu] = useState(null);
  const [previewEditMode, setPreviewEditMode] = useState(null); // { cIdx, iIdx }

  // Фоновая AI-генерация (Sales Guide + курс + тесты)
  const [gen, setGen] = useState(null); // объект статуса или null
  const pollRef = useRef(null);
  const navigate = useNavigate();

  // Restaurant context
  const [restaurantName, setRestaurantName] = useState('');

  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [itemForm, setItemForm] = useState({
    category_id: '',
    title: '',
    description: '',
    price: '',
    portion: '',
    image_url: '',
    visible_to: [], // empty means all
    salesGuide: emptySalesGuide()
  });

  // Определяем имя ресторана для контекста
  useEffect(() => {
    const role = getCurrentRole();
    if (role === 'SUPER_ADMIN') {
      setRestaurantName(localStorage.getItem('active_restaurant_name') || '');
    } else {
      // Для ADMIN — получаем из профиля
      const loadRestaurant = async () => {
        try {
          // Авторизация по httpOnly-cookie.
          const data = await fetchUserProfile();
          setRestaurantName(data.restaurant?.name || '');
        } catch (err) {
          console.error('[AdminMenu] Ошибка загрузки ресторана:', err);
        }
      };
      loadRestaurant();
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await adminGetMenuCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки данных меню');
    } finally {
      setLoading(false);
    }
  }, [restaurantName]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- AI Pipeline: поллинг статуса генерации ---
  const pollStatus = useCallback(async () => {
    try {
      const s = await adminGetMenuAiStatus();
      setGen(s);
      if (!GEN_ACTIVE.includes(s.stage)) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      // временная ошибка сети/БД — продолжаем опрашивать
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollStatus();
    pollRef.current = setInterval(pollStatus, 2500);
  }, [pollStatus]);

  // Подхватываем уже идущую генерацию (например, после перезагрузки страницы) + очистка.
  // «Протухший» статус (старше 15 мин, висит из-за рестарта сервера) не подхватываем.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await adminGetMenuAiStatus();
        const fresh = s.startedAt && (Date.now() - new Date(s.startedAt).getTime() < 15 * 60 * 1000);
        if (!cancelled && GEN_ACTIVE.includes(s.stage) && fresh) { setGen(s); startPolling(); }
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [startPolling]);

  const handleRegenCourse = async () => {
    try {
      await adminRegenerateMenuCourse();
      setGen({ stage: 'creating_training', totalDishes: gen?.totalDishes || 0, processedDishes: gen?.totalDishes || 0, salesGuidesOk: gen?.salesGuidesOk || 0, salesGuidesFailed: 0, lessons: 0, tests: 0, questions: 0, errors: [] });
      startPolling();
    } catch (e) {
      alert('Не удалось запустить перегенерацию курса');
    }
  };

  // Свернуть панель прогресса и вернуться к загрузке (генерация на сервере не прерывается)
  const dismissGen = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setGen(null);
  };

  // Запуск полной генерации обучения по ТЕКУЩЕМУ меню (без загрузки PDF)
  const handleGenerateTraining = async () => {
    if (categories.length === 0) return alert('Сначала добавьте категории и блюда');
    if (!window.confirm('Запустить генерацию обучения по текущему меню?\nБудут пересозданы «Советы по продаже» и курс «Продажи по меню».')) return;
    try {
      const res = await adminGenerateTraining();
      setActiveTab('pdf'); // панель прогресса живёт во вкладке PDF
      setGen({ stage: 'generating_sales_guide', totalDishes: res.totalDishes || 0, processedDishes: 0, salesGuidesOk: 0, salesGuidesFailed: 0, lessons: 0, tests: 0, questions: 0, errors: [] });
      startPolling();
    } catch (e) {
      alert(e.message || 'Не удалось запустить генерацию');
    }
  };

  // --- Category Handlers ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await adminCreateMenuCategory({ name: catName, order: categories.length });
      setCatName('');
      setIsCatModalOpen(false);
      loadData();
    } catch (err) {
      alert('Ошибка создания категории');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Точно удалить категорию и все ее блюда?')) return;
    try {
      await adminDeleteMenuCategory(id);
      loadData();
    } catch (err) {
      alert('Ошибка удаления категории');
    }
  };

  // --- Item Handlers ---
  const openItemModal = (item = null, catId = '') => {
    if (item) {
      setEditItemId(item.id);
      setItemForm({
        category_id: item.category_id,
        title: item.title,
        description: item.description || '',
        price: item.price || '',
        portion: item.portion || '',
        image_url: item.image_url || '',
        visible_to: item.visible_to || [],
        salesGuide: salesGuideToForm(item.sales_guide)
      });
    } else {
      setEditItemId(null);
      setItemForm({
        category_id: catId || (categories.length > 0 ? categories[0].id : ''),
        title: '',
        description: '',
        price: '',
        portion: '',
        image_url: '',
        visible_to: [],
        salesGuide: emptySalesGuide()
      });
    }
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.title) return alert('Заполните название');

    if (previewEditMode) {
      // Редактирование в режиме превью
      const { cIdx, iIdx } = previewEditMode;
      const newMenu = [...previewMenu];
      newMenu[cIdx].items[iIdx] = {
        ...newMenu[cIdx].items[iIdx],
        title: itemForm.title,
        description: itemForm.description,
        price: itemForm.price,
        portion: itemForm.portion
      };
      setPreviewMenu(newMenu);
      setIsItemModalOpen(false);
      setPreviewEditMode(null);
      return;
    }

    if (!itemForm.category_id) return alert('Выберите категорию');

    const { salesGuide, ...rest } = itemForm;
    const payload = { ...rest, sales_guide: formToSalesGuide(salesGuide) };

    try {
      if (editItemId) {
        await adminUpdateMenuItem(editItemId, payload);
      } else {
        await adminCreateMenuItem(payload);
      }
      setIsItemModalOpen(false);
      loadData();
    } catch (err) {
      alert('Ошибка сохранения блюда');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Точно удалить блюдо?')) return;
    try {
      await adminDeleteMenuItem(id);
      loadData();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const toggleVisibility = (pos) => {
    const current = itemForm.visible_to;
    if (current.includes(pos)) {
      setItemForm({ ...itemForm, visible_to: current.filter(p => p !== pos) });
    } else {
      setItemForm({ ...itemForm, visible_to: [...current, pos] });
    }
  };

  // --- PDF Handlers ---
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('Только PDF файлы');

    setUploading(true);
    try {
      const res = await adminUploadMenuPdf(file);
      setPreviewMenu(res.parsedMenu);
      alert('PDF проанализирован! Пожалуйста, проверьте результаты перед сохранением.');
    } catch (err) {
      alert('Ошибка загрузки или парсинга PDF');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleConfirmPreview = async () => {
    try {
      setLoading(true);
      await adminConfirmParsedMenu(previewMenu);
      alert('Меню сохранено! Чтобы создать обучение по нему, нажмите «Сгенерировать обучение» во вкладке «Ручное меню».');
      setPreviewMenu(null);
      loadData();
      setActiveTab('manual');
    } catch (err) {
      alert('Ошибка при сохранении меню');
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    if (!window.confirm('Отменить результаты ИИ?')) return;
    setPreviewMenu(null);
    setPreviewEditMode(null);
  };

  const openPreviewItemModal = (cIdx, iIdx, item) => {
    setPreviewEditMode({ cIdx, iIdx });
    setItemForm({
      category_id: 'preview', // dummy
      title: item.title || '',
      description: item.description || '',
      price: item.price || '',
      portion: item.portion || '',
      image_url: '',
      visible_to: [],
      salesGuide: emptySalesGuide()
    });
    setIsItemModalOpen(true);
  };

  const handleDeletePreviewItem = (cIdx, iIdx) => {
    if (!window.confirm('Удалить блюдо из черновика?')) return;
    const newMenu = [...previewMenu];
    newMenu[cIdx].items.splice(iIdx, 1);
    setPreviewMenu(newMenu);
  };

  const handleDeletePreviewCategory = (cIdx) => {
    if (!window.confirm('Удалить всю категорию из черновика?')) return;
    const newMenu = [...previewMenu];
    newMenu.splice(cIdx, 1);
    setPreviewMenu(newMenu);
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Управление меню
            {restaurantName && (
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-info)',
                background: 'var(--color-primary-soft)',
                padding: '4px 12px',
                borderRadius: 20,
                marginLeft: 12,
                verticalAlign: 'middle'
              }}>
                {restaurantName}
              </span>
            )}
          </h1>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'manual' ? styles.active : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Ручное меню
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'pdf' ? styles.active : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            PDF Меню
          </button>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : activeTab === 'manual' ? (
          <div className={styles.manualSection}>
            <div className={styles.header}>
              <h3>Категории и блюда</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className={styles.createBtn}
                  style={{ background: 'linear-gradient(135deg, var(--color-purple), var(--color-primary))' }}
                  onClick={handleGenerateTraining}
                  title="Сгенерировать «Советы по продаже» и курс «Продажи по меню» по текущему меню"
                >
                  <FiZap size={18} /> Сгенерировать обучение
                </button>
                <button className={styles.createBtn} onClick={() => setIsCatModalOpen(true)}>
                  <FiPlus size={18} /> Новая категория
                </button>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className={styles.emptyState}>Нет категорий. Создайте первую!</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className={styles.categoryGroup}>
                  <div className={styles.categoryTitle}>
                    {cat.name}
                    <button 
                      className={styles.actionBtn} 
                      style={{display: 'inline-flex', marginLeft: 10, width: 24, height: 24}}
                      onClick={() => openItemModal(null, cat.id)}
                      title="Добавить блюдо в эту категорию"
                    >
                      <FiPlus size={14} />
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.danger}`} 
                      style={{display: 'inline-flex', marginLeft: 6, width: 24, height: 24}}
                      onClick={() => handleDeleteCategory(cat.id)}
                      title="Удалить категорию"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  
                  {cat.items.length === 0 ? (
                    <p style={{color: 'var(--color-text-muted)', fontSize: 14}}>Нет блюд в этой категории</p>
                  ) : (
                    <div className={styles.grid}>
                      {cat.items.map(item => (
                        <div key={item.id} className={styles.card}>
                          {item.image_url && (
                            <div className={styles.cardImgWrap}>
                              <img src={item.image_url} alt={item.title} />
                            </div>
                          )}
                          <div className={styles.cardBody}>
                            <h4 className={styles.cardTitle}>{item.title}</h4>
                            <div className={styles.cardPrice}>
                              {item.price || 'Цена не указана'} 
                              {item.portion && <span style={{fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8}}>{item.portion}</span>}
                            </div>
                            <p className={styles.cardDesc}>{item.description}</p>
                            
                            <div className={styles.badgeWrap}>
                              {(!item.visible_to || item.visible_to.length === 0) ? (
                                <span className={styles.badge}>Видят все</span>
                              ) : (
                                item.visible_to.map(p => (
                                  <span key={p} className={styles.badge}>{p}</span>
                                ))
                              )}
                            </div>
                          </div>
                          <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={() => openItemModal(item)}>
                              <FiEdit2 size={16} />
                            </button>
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeleteItem(item.id)}>
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.pdfSection}>
            {gen && gen.stage !== 'idle' ? (
              <div className={styles.genPanel}>
                <div className={styles.genHead}>
                  <span className={styles.genHeadIcon}><FiZap size={22} /></span>
                  <div>
                    <h3 className={styles.genTitle}>Генерация обучающих материалов</h3>
                    <p className={styles.genSub}>
                      ИИ создаёт «Советы по продаже» и курс «Продажи по меню» (уроки + тесты) на основе вашего меню.
                      Можно закрыть страницу — генерация идёт на сервере.
                    </p>
                  </div>
                </div>

                <div className={styles.genSteps}>
                  {GEN_STAGES.map((st, i) => {
                    const cur = gen.stage === 'failed' ? 99 : genStageIndex(gen.stage);
                    const state = i < cur ? 'done' : i === cur ? 'active' : 'pending';
                    let detail = '';
                    if (st.key === 'generating_sales_guide') {
                      detail = `${gen.processedDishes || 0} / ${gen.totalDishes || 0} блюд`;
                      if (gen.salesGuidesFailed) detail += ` · ошибок: ${gen.salesGuidesFailed}`;
                    } else if (st.key === 'creating_training') {
                      detail = gen.lessons ? `${gen.lessons} уроков` : '';
                    } else if (st.key === 'creating_quizzes') {
                      detail = gen.tests ? `${gen.tests} тестов · ${gen.questions} вопросов` : '';
                    }
                    const Icon = st.icon;
                    return (
                      <div key={st.key} className={`${styles.genStep} ${styles['gen_' + state]}`}>
                        <div className={styles.genStepIcon}>
                          {state === 'done' ? <FiCheckCircle size={20} /> : state === 'active' ? <span className={styles.genSpinner} /> : <Icon size={18} />}
                        </div>
                        <div className={styles.genStepBody}>
                          <span className={styles.genStepLabel}>{st.label}</span>
                          {detail && <span className={styles.genStepDetail}>{detail}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {GEN_ACTIVE.includes(gen.stage) && (
                  <div className={styles.genResult}>
                    <p className={styles.genResultText} style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Это может занять несколько минут (зависит от размера меню). Можно свернуть — генерация продолжится на сервере.
                    </p>
                    <div className={styles.genActions}>
                      <button className={styles.genGhostBtn} onClick={dismissGen}>Свернуть</button>
                      <button className={styles.genGhostBtn} onClick={handleRegenCourse}>Перегенерировать</button>
                    </div>
                  </div>
                )}

                {gen.stage === 'ready' && (
                  <div className={styles.genResult}>
                    <p className={styles.genResultText}>
                      <FiCheckCircle size={16} style={{ color: 'var(--color-success)', verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />
                      Готово! Курс «Продажи по меню»: {gen.lessons} уроков, {gen.tests} тестов ({gen.questions} вопросов).
                      Советы по продаже — для {gen.salesGuidesOk} блюд{gen.salesGuidesFailed ? ` (не удалось: ${gen.salesGuidesFailed})` : ''}.
                    </p>
                    <div className={styles.genActions}>
                      {gen.courseId && (
                        <button className={styles.createBtn} onClick={() => navigate(`/admin/courses/${gen.courseId}`)}>
                          Открыть курс
                        </button>
                      )}
                      <button className={styles.genGhostBtn} onClick={handleRegenCourse}>Перегенерировать</button>
                      <button className={styles.genGhostBtn} onClick={() => { setGen(null); setActiveTab('manual'); }}>Закрыть</button>
                    </div>
                  </div>
                )}

                {gen.stage === 'failed' && (
                  <div className={styles.genResult}>
                    <p className={styles.genResultText} style={{ color: 'var(--color-danger-hover)' }}>
                      <FiAlertTriangle size={16} style={{ verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />
                      Генерация прервалась. {(gen.errors && gen.errors[0]) || ''}
                    </p>
                    <div className={styles.genActions}>
                      <button className={styles.createBtn} onClick={handleRegenCourse}>Повторить</button>
                      <button className={styles.genGhostBtn} onClick={() => { setGen(null); setActiveTab('manual'); }}>Закрыть</button>
                    </div>
                  </div>
                )}
              </div>
            ) : previewMenu ? (
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader} style={{
                  background: 'var(--color-surface-2)',
                  padding: '32px 24px',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '30px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  gap: '20px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <FiZap size={20} style={{ color: 'var(--color-purple)' }} aria-hidden="true" /> Предварительный просмотр от ИИ
                    </h3>
                    <p style={{ margin: '12px auto 0 auto', color: 'var(--color-text-secondary)', fontSize: '15px', maxWidth: '600px', lineHeight: '1.5' }}>
                      ИИ проанализировал PDF и составил черновик меню. Вы можете <b>редактировать</b> и <b>удалять</b> позиции прямо здесь, до сохранения в базу данных.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button onClick={handleCancelPreview} style={{ padding: '12px 28px', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', transition: 'var(--transition)' }}>
                      Отменить
                    </button>
                    <button onClick={handleConfirmPreview} style={{ padding: '12px 28px', background: 'var(--color-success)', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                      Сохранить всё в базу
                    </button>
                  </div>
                </div>

                <div className={styles.previewMenuData}>
                  {previewMenu.map((cat, cIdx) => (
                    <div key={cIdx} className={styles.categoryGroup} style={{
                      background: 'var(--color-surface)',
                      padding: '20px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--color-border-strong)',
                      marginBottom: '20px'
                    }}>
                      <div className={styles.categoryTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{cat.category}</span>
                        <button 
                          className={`${styles.actionBtn} ${styles.danger}`} 
                          style={{display: 'inline-flex', width: 28, height: 28}}
                          onClick={() => handleDeletePreviewCategory(cIdx)}
                          title="Удалить категорию из черновика"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      
                      {(!cat.items || cat.items.length === 0) ? (
                        <p style={{color: 'var(--color-text-muted)', fontSize: 14}}>Нет блюд</p>
                      ) : (
                        <div className={styles.grid}>
                          {cat.items.map((item, iIdx) => (
                            <div key={iIdx} className={styles.card} style={{ borderLeft: '3px solid var(--color-info)' }}>
                              <div className={styles.cardBody}>
                                <h4 className={styles.cardTitle}>{item.title}</h4>
                                <div className={styles.cardPrice}>
                                  {item.price || 'Цена не указана'} 
                                  {item.portion && <span style={{fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8}}>{item.portion}</span>}
                                </div>
                                <p className={styles.cardDesc}>{item.description}</p>
                              </div>
                              <div className={styles.actions} style={{ borderTop: '1px solid var(--color-surface-3)', paddingTop: '10px', marginTop: '10px' }}>
                                <button className={styles.actionBtn} onClick={() => openPreviewItemModal(cIdx, iIdx, item)}>
                                  <FiEdit2 size={16} />
                                </button>
                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeletePreviewItem(cIdx, iIdx)}>
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : uploading ? (
              <div className={styles.skeletonContainer}>
                <div className={styles.skeletonHeader}></div>
                {[1, 2].map((catIdx) => (
                  <div key={catIdx}>
                    <div className={styles.skeletonCategory}></div>
                    <div className={styles.skeletonGrid}>
                      {[1, 2, 3].map((cardIdx) => (
                        <div key={cardIdx} className={styles.skeletonCard}>
                          <div className={`${styles.skeletonLine} ${styles.title}`}></div>
                          <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                          <div className={`${styles.skeletonLine} ${styles.medium}`}></div>
                          <div className={`${styles.skeletonLine} ${styles.medium}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--color-text-secondary)' }}>
                  <FiUploadCloud size={32} style={{ animation: 'pulse 1.5s infinite ease-in-out', color: 'var(--color-info)', marginBottom: 10 }} />
                  <p>ИИ анализирует меню... Пожалуйста, подождите 10-15 секунд.</p>
                </div>
              </div>
            ) : (
              <label className={styles.uploadBox} style={{ cursor: 'pointer' }}>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploading} />
                <div className={styles.uploadContent}>
                  <FiUploadCloud size={48} style={{ color: 'var(--color-info)' }} />
                  <h3>Нажмите чтобы загрузить PDF</h3>
                  <p>Формат: .pdf, размер до 10MB</p>
                </div>
              </label>
            )}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      {isCatModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsCatModalOpen(false)}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setIsCatModalOpen(false)}><FiX size={20}/></button>
            <h2 className={styles.modalTitle}>Новая категория</h2>
            <form onSubmit={handleCreateCategory} className={styles.form}>
              <div className={styles.field}>
                <label>Название (например: Горячее, Бар)</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} autoFocus required />
              </div>
              <button type="submit" className={styles.submitBtn}>Создать</button>
            </form>
          </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsItemModalOpen(false)}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setIsItemModalOpen(false)}><FiX size={20}/></button>
            <h2 className={styles.modalTitle}>{editItemId ? 'Редактировать блюдо' : 'Новое блюдо'}</h2>
            <form onSubmit={handleItemSubmit} className={styles.form}>
              {!previewEditMode && (
                <div className={styles.field}>
                  <label>Категория</label>
                  <select value={itemForm.category_id} onChange={e => setItemForm({...itemForm, category_id: parseInt(e.target.value)})} required>
                    <option value="" disabled>Выберите категорию</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.field}>
                <label>Название</label>
                <input type="text" value={itemForm.title} onChange={e => setItemForm({...itemForm, title: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label>Цена (например: 500 тг)</label>
                <input type="text" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label>Порция (например: 300 г или 1 шт)</label>
                <input type="text" value={itemForm.portion} onChange={e => setItemForm({...itemForm, portion: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label>Описание / Состав</label>
                <textarea value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label>Ссылка на фото (URL)</label>
                <input type="text" value={itemForm.image_url} onChange={e => setItemForm({...itemForm, image_url: e.target.value})} placeholder="https://..." />
              </div>
              
              {!previewEditMode && (
                <div className={styles.field}>
                  <label>Кто может видеть это блюдо?</label>
                  <p style={{fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px 0'}}>Если ничего не выбрано, видят все.</p>
                  <div className={styles.checkboxGroup}>
                    {POSITIONS.map(pos => (
                      <label key={pos} className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={itemForm.visible_to.includes(pos)}
                          onChange={() => toggleVisibility(pos)}
                        />
                        {pos}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!previewEditMode && (
                <details className={styles.field} style={{ marginBottom: 0 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiInfo size={14} aria-hidden="true" /> Советы по продаже (необязательно)
                  </summary>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '8px 0 12px' }}>
                    Заполните вручную или сгенерируйте кнопкой «Сгенерировать обучение». Показывается сотрудникам в меню.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={styles.field}>
                      <label>Как презентовать гостю</label>
                      <textarea value={itemForm.salesGuide.sellingPhrase} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, sellingPhrase: e.target.value } })} />
                    </div>
                    <div className={styles.field}>
                      <label>Допродажа (предложить дороже/больше)</label>
                      <input type="text" value={itemForm.salesGuide.upsell} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, upsell: e.target.value } })} />
                    </div>
                    <div className={styles.field}>
                      <label>Сочетается с</label>
                      <input type="text" value={itemForm.salesGuide.crossSell} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, crossSell: e.target.value } })} />
                    </div>
                    <div className={styles.field}>
                      <label>Премиум-вариант</label>
                      <input type="text" value={itemForm.salesGuide.premiumOffer} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, premiumOffer: e.target.value } })} />
                    </div>
                    <div className={styles.field}>
                      <label>Преимущества (по одному на строку)</label>
                      <textarea value={itemForm.salesGuide.keyAdvantages} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, keyAdvantages: e.target.value } })} placeholder={'Свежие ингредиенты\nБыстрая подача'} />
                    </div>
                    <div className={styles.field}>
                      <label>Частые вопросы гостя (по одному на строку)</label>
                      <textarea value={itemForm.salesGuide.guestQuestions} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, guestQuestions: e.target.value } })} />
                    </div>
                    <div className={styles.field}>
                      <label>Ответы (в том же порядке, по строке)</label>
                      <textarea value={itemForm.salesGuide.guestAnswers} onChange={e => setItemForm({ ...itemForm, salesGuide: { ...itemForm.salesGuide, guestAnswers: e.target.value } })} />
                    </div>
                  </div>
                </details>
              )}

              <button type="submit" className={styles.submitBtn}>
                {editItemId ? 'Сохранить' : 'Добавить'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMenu;
