import React, { useState } from 'react';
import { FiX, FiCheck, FiFolder } from 'react-icons/fi';
import { adminCreateDepartment, adminUpdateDepartment } from '../../services/adminApi';
import styles from './PositionCreateModal.module.css';

const DepartmentModal = ({ onClose, onSaved, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (initialData) {
        await adminUpdateDepartment(initialData.dbId, { name: name.trim() });
      } else {
        await adminCreateDepartment(name.trim());
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении отдела');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconBox}><FiFolder /></div>
            <h3 className={styles.title}>{initialData ? 'Редактировать отдел' : 'Новый отдел'}</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Название отдела</label>
            <input
              autoFocus
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кухня"
              required
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.submitBtn} disabled={saving || !name.trim() || name.trim() === initialData?.name}>
              {saving ? '...' : <><FiCheck /> {initialData ? 'Сохранить' : 'Добавить'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;
