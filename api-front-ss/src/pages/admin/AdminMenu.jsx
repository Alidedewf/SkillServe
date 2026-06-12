import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiFileText, FiUploadCloud, FiX } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  adminGetMenuCategories,
  adminCreateMenuCategory,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  adminDeleteMenuCategory,
  adminGetMenuPdf,
  adminUploadMenuPdf,
  adminDeleteMenuPdf,
  adminConfirmParsedMenu,
  getCurrentRole
} from '../../services/adminApi';
import styles from './AdminMenu.module.css';

const POSITIONS = ['Официант', 'Бармен', 'Менеджер', 'Повар'];

const AdminMenu = () => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'pdf'
  
  // States for manual menu
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for PDF menu
  const [pdfUrl, setPdfUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewMenu, setPreviewMenu] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewEditMode, setPreviewEditMode] = useState(null); // { cIdx, iIdx }

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
    visible_to: [] // empty means all
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
          const token = localStorage.getItem('token');
          if (!token) return;
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) return;
          const data = await res.json();
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
      const [cats, pdf] = await Promise.all([
        adminGetMenuCategories(),
        adminGetMenuPdf()
      ]);
      setCategories(cats);
      setPdfUrl(pdf.url);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки данных меню');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
        visible_to: item.visible_to || []
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
        visible_to: []
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
    
    try {
      if (editItemId) {
        await adminUpdateMenuItem(editItemId, itemForm);
      } else {
        await adminCreateMenuItem(itemForm);
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
      setPreviewPdfUrl(res.pdfUrl);
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
      await adminConfirmParsedMenu(previewMenu, previewPdfUrl);
      alert('Меню успешно сохранено!');
      setPreviewMenu(null);
      setPreviewPdfUrl(null);
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
    setPreviewPdfUrl(null);
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
      visible_to: []
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

  const handleDeletePdf = async () => {
    if (!window.confirm('Удалить PDF меню?')) return;
    try {
      await adminDeleteMenuPdf();
      setPdfUrl(null);
    } catch (err) {
      alert('Ошибка удаления PDF');
    }
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
                color: '#3b82f6',
                background: '#eff6ff',
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
              <button className={styles.createBtn} onClick={() => setIsCatModalOpen(true)}>
                <FiPlus size={18} /> Новая категория
              </button>
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
                    <p style={{color: '#94a3b8', fontSize: 14}}>Нет блюд в этой категории</p>
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
                              {item.portion && <span style={{fontSize: 12, color: '#64748b', marginLeft: 8}}>{item.portion}</span>}
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
            {previewMenu ? (
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader} style={{ 
                  background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', 
                  padding: '32px 24px', 
                  borderRadius: '16px', 
                  marginBottom: '30px', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  gap: '20px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>✨</span> Предварительный просмотр от ИИ
                    </h3>
                    <p style={{ margin: '12px auto 0 auto', color: '#475569', fontSize: '15px', maxWidth: '600px', lineHeight: '1.5' }}>
                      ИИ проанализировал PDF и составил черновик меню. Вы можете <b>редактировать</b> и <b>удалять</b> позиции прямо здесь, до сохранения в базу данных.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button onClick={handleCancelPreview} style={{ padding: '12px 28px', background: 'rgba(255, 255, 255, 0.7)', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(255, 255, 255, 0.9)'} onMouseOut={e => e.target.style.background = 'rgba(255, 255, 255, 0.7)'}>
                      Отменить
                    </button>
                    <button onClick={handleConfirmPreview} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.02)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>
                      Сохранить всё в базу
                    </button>
                  </div>
                </div>

                <div className={styles.previewMenuData}>
                  {previewMenu.map((cat, cIdx) => (
                    <div key={cIdx} className={styles.categoryGroup} style={{ 
                      background: 'white', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      border: '1px dashed #cbd5e1',
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
                        <p style={{color: '#94a3b8', fontSize: 14}}>Нет блюд</p>
                      ) : (
                        <div className={styles.grid}>
                          {cat.items.map((item, iIdx) => (
                            <div key={iIdx} className={styles.card} style={{ borderLeft: '3px solid #3b82f6' }}>
                              <div className={styles.cardBody}>
                                <h4 className={styles.cardTitle}>{item.title}</h4>
                                <div className={styles.cardPrice}>
                                  {item.price || 'Цена не указана'} 
                                  {item.portion && <span style={{fontSize: 12, color: '#64748b', marginLeft: 8}}>{item.portion}</span>}
                                </div>
                                <p className={styles.cardDesc}>{item.description}</p>
                              </div>
                              <div className={styles.actions} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
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
            ) : pdfUrl ? (
              <div>
                <div className={styles.pdfStatus}>
                  <FiFileText size={24} />
                  <span>Текущее PDF меню загружено: </span>
                  <a href={pdfUrl} target="_blank" rel="noreferrer" className={styles.pdfLink}>Открыть файл</a>
                </div>
                <div style={{marginTop: 20}}>
                  <button className={`${styles.createBtn} ${styles.danger}`} onClick={handleDeletePdf} style={{background: '#ef4444'}}>
                    <FiTrash2 size={18} /> Удалить PDF
                  </button>
                </div>
              </div>
            ) : (
              <label className={styles.uploadBox} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploading} />
                <div className={styles.uploadContent}>
                  <FiUploadCloud size={48} color={uploading ? "#94a3b8" : "#3b82f6"} />
                  <h3>{uploading ? 'ИИ читает меню...' : 'Нажмите чтобы загрузить PDF'}</h3>
                  <p>{uploading ? 'Пожалуйста, подождите около 10-15 секунд' : 'Формат: .pdf, размер до 10MB'}</p>
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
                  <p style={{fontSize: 12, color: '#64748b', margin: '0 0 8px 0'}}>Если ничего не выбрано, видят все.</p>
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
