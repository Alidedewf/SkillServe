import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProfile.module.css';
import { FiArrowLeft, FiCamera, FiCheck } from 'react-icons/fi';
import { fetchUserProfile, updateUserProfile } from '../../services/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    avatar_url: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchUserProfile();
        setFormData({
          name: data.name || '',
          avatar_url: data.avatar_url || '',
        });
        setAvatarPreview(
          data.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=b6e3f4,c0aede`
        );
      } catch (err) {
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'avatar_url' && value.trim()) {
      setAvatarPreview(value.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Имя не может быть пустым');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateUserProfile({
        name: formData.name.trim(),
        avatar_url: formData.avatar_url.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/profile')} className={styles.backButton}>
            <FiArrowLeft size={24} color="#fff" />
          </button>
          <h1 className={styles.title}>Редактировать профиль</h1>
        </div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/profile')} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h1 className={styles.title}>Редактировать профиль</h1>
      </div>

      <div className={styles.avatarSection}>
        <div className={styles.avatarContainer}>
          <img
            src={avatarPreview}
            alt="Аватар"
            className={styles.avatar}
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback&backgroundColor=b6e3f4`;
            }}
          />
          <div className={styles.avatarHint}>
            <FiCamera size={14} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Имя</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ваше имя"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="avatar_url">Ссылка на аватар (URL)</label>
          <input
            type="url"
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleInputChange}
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {success && (
          <div className={styles.successMsg}>
            <FiCheck size={16} /> Сохранено!
          </div>
        )}

        <button type="submit" className={styles.submitButton} disabled={saving || success}>
          {saving ? 'Сохранение...' : success ? 'Сохранено ✓' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
