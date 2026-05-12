import React, { useState } from 'react';
import { FiX, FiCheck, FiTag } from 'react-icons/fi';
import { adminCreatePosition } from '../../services/adminApi';
import styles from './PositionCreateModal.module.css';

const PositionCreateModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await adminCreatePosition(name.trim());
      onCreated();
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании должности');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconBox}><FiTag /></div>
            <h3 className={styles.title}>Новая должность</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Название должности</label>
            <input
              autoFocus
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Шеф-повар"
              required
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.submitBtn} disabled={saving || !name.trim()}>
              {saving ? '...' : <><FiCheck /> Добавить</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PositionCreateModal;
