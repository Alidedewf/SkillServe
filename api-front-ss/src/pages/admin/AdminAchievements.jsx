import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiX, FiCheck } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  adminGetAchievements, 
  adminCreateAchievement, 
  adminUpdateAchievement, 
  adminDeleteAchievement,
  adminGetCourses
} from '../../services/adminApi';
import { fetchAchievementIcons } from '../../services/api';
import styles from './AdminAchievements.module.css';

const AdminAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    course_id: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [achData, coursesData, iconsData] = await Promise.all([
        adminGetAchievements(),
        adminGetCourses(),
        fetchAchievementIcons()
      ]);
      setAchievements(achData);
      setCourses(coursesData);
      setIcons(iconsData);
      
      // Если иконок много и ни одна не выбрана, ставим первую по умолчанию
      if (iconsData.length > 0 && !formData.image_url) {
        setFormData(prev => ({ ...prev, image_url: iconsData[0].id }));
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [formData.image_url]);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (ach = null) => {
    if (ach) {
      setEditId(ach.id);
      setFormData({
        title: ach.title,
        description: ach.description || '',
        image_url: ach.image_url || (icons.length > 0 ? icons[0].id : ''),
        course_id: ach.course_id ? ach.course_id.toString() : ''
      });
    } else {
      setEditId(null);
      setFormData({ 
        title: '', 
        description: '', 
        image_url: icons.length > 0 ? icons[0].id : '', 
        course_id: '' 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert('Введите название');

    try {
      const payload = {
        ...formData,
        course_id: formData.course_id ? parseInt(formData.course_id) : null
      };

      if (editId) {
        await adminUpdateAchievement(editId, payload);
      } else {
        await adminCreateAchievement(payload);
      }
      closeModal();
      loadData();
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Точно удалить это достижение?')) return;
    try {
      await adminDeleteAchievement(id);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления');
    }
  };

  const resolveImage = (imgId) => {
    const found = icons.find(g => g.id === imgId);
    return found ? found.url : '';
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Достижения</h1>
          <button className={styles.createBtn} onClick={() => openModal()}>
            <FiPlus size={18} /> Создать
          </button>
        </div>

        {loading ? (
          <p className={styles.empty}>Загрузка...</p>
        ) : achievements.length === 0 ? (
          <div className={styles.emptyState}>
            <FiAward size={48} color="#cbd5e1" />
            <p>Нет достижений. Создайте первое!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {achievements.map((ach) => (
              <div key={ach.id} className={styles.card}>
                <div className={styles.cardImgWrap}>
                  <img src={resolveImage(ach.image_url)} alt={ach.title} className={styles.cardImg} />
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{ach.title}</h3>
                  <p className={styles.cardDesc}>{ach.description || 'Нет описания'}</p>
                  
                  <div className={styles.cardMeta}>
                    <span className={styles.badge}>
                      Выдано: {ach._count?.users || 0}
                    </span>
                    {ach.course ? (
                      <span className={styles.courseBadge}>Курс: {ach.course.title}</span>
                    ) : (
                      <span className={styles.globalBadge}>Глобальное</span>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => openModal(ach)}>
                    <FiEdit2 size={16} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(ach.id)}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={closeModal}><FiX size={20} /></button>
            <h2 className={styles.modalTitle}>{editId ? 'Редактировать' : 'Новое достижение'}</h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Название</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Мастер Кухни"
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label>Описание</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Выдается за прохождение базового курса"
                />
              </div>

              <div className={styles.field}>
                <label>Привязка к курсу (авто-выдача)</label>
                <select 
                  value={formData.course_id}
                  onChange={e => setFormData({...formData, course_id: e.target.value})}
                >
                  <option value="">-- Без привязки (Выдавать вручную) --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Иконка (Выберите из галереи)</label>
                <div className={styles.gallery}>
                  {icons.map(item => (
                    <div 
                      key={item.id} 
                      className={`${styles.galleryItem} ${formData.image_url === item.id ? styles.gallerySelected : ''}`}
                      onClick={() => setFormData({...formData, image_url: item.id})}
                    >
                      <img src={item.url} alt="icon" />
                      {formData.image_url === item.id && <div className={styles.checkIcon}><FiCheck size={16}/></div>}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                {editId ? 'Сохранить изменения' : 'Создать'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAchievements;
