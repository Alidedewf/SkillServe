import React, { useState, useRef } from 'react';
import { FiImage, FiArrowRight, FiX, FiTrash2 } from 'react-icons/fi';
import { adminCreateCourse } from '../../services/adminApi';
import styles from './CourseCreateModal.module.css';

const CourseCreateModal = ({ onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [coverPreview, setCoverPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result);
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = (e) => {
    e.stopPropagation();
    setCoverPreview(null);
    setImageUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleContinue = async () => {
    if (!title.trim()) {
      setError('Введите название курса');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const course = await adminCreateCourse({
        title: title.trim(),
        image_url: imageUrl,
        is_published: false,
      });
      onCreated(course.id);
    } catch (err) {
      console.error('[CourseCreateModal]', err);
      setError(err.message || 'Ошибка при создании курса');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={20} />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Новый курс</h2>
          <p className={styles.subtitle}>
            Укажите название и обложку. Уроки и тесты добавите на следующем шаге.
          </p>
        </div>

        {/* Название курса */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Название курса *</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            placeholder="Например: Стандарты обслуживания гостей"
            autoFocus
          />
        </div>

        {/* Обложка */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Обложка курса</label>
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            onChange={handleCoverChange}
            style={{ display: 'none' }}
          />
          <div
            className={styles.coverArea}
            onClick={() => fileRef.current.click()}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover" className={styles.coverImage} />
                <button className={styles.coverRemoveBtn} onClick={handleRemoveCover}>
                  <FiTrash2 size={14} /> Удалить
                </button>
              </>
            ) : (
              <div className={styles.coverPlaceholder}>
                <FiImage size={32} />
                <span>Нажмите для загрузки (JPG / PNG)</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* Кнопка продолжить */}
        <button
          className={styles.continueBtn}
          onClick={handleContinue}
          disabled={saving}
        >
          {saving ? 'Создание...' : 'Продолжить'}
          {!saving && <FiArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
};

export default CourseCreateModal;
