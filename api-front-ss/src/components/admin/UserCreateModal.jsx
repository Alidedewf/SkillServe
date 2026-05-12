import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { adminCreateUser, adminGetPositions } from '../../services/adminApi';
import styles from './UserCreateModal.module.css';

const DEFAULT_USER = {
  fio: '',
  position: '',
  email: '',
  phone: '',
};

const UserCreateModal = ({ onClose, onCreated }) => {
  const [users, setUsers] = useState([{ ...DEFAULT_USER, id: Date.now() }]);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // id пользователя, у которого открыт список
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetPositions().then(setAvailablePositions);
  }, []);

  const addUser = () => {
    setUsers([...users, { ...DEFAULT_USER, id: Date.now() }]);
  };

  const removeUser = (id) => {
    if (users.length > 1) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const updateUser = (id, field, value) => {
    setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      for (const user of users) {
        if (user.fio.trim() && user.email.trim()) {
          // Разбиваем ФИО на имя и фамилию для базы
          const names = user.fio.split(' ');
          await adminCreateUser({
            first_name: names[0] || '',
            last_name: names.slice(1).join(' ') || '',
            email: user.email,
            phone: user.phone,
            position: user.position,
            role: 'staff',
            is_active: true
          });
        }
      }
      onCreated();
    } catch (err) {
      console.error(err);
      alert('Ошибка при добавлении персонала');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX size={16} /> Закрыть
          </button>

          <button className={styles.addBtnMain} onClick={addUser}>
            <FiPlus size={20} /> Добавить персонал
          </button>

          <div className={styles.usersList}>
            {users.map((user) => (
              <div key={user.id} className={styles.userContainer}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Ф.И.О*</label>
                  <input
                    className={styles.input}
                    value={user.fio}
                    onChange={(e) => updateUser(user.id, 'fio', e.target.value)}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div className={styles.fieldGroup} style={{ position: 'relative' }}>
                  <div className={styles.posRow}>
                    <span className={styles.posLabel}>Должность</span>
                    <div 
                      className={styles.posSelect}
                      onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                    >
                      {user.position || 'Выберите...'}
                      <FiChevronDown />
                    </div>
                  </div>

                  {activeDropdown === user.id && (
                    <div className={styles.dropdown}>
                      {availablePositions.map((pos) => (
                        <div 
                          key={pos.id} 
                          className={styles.dropdownItem}
                          onClick={() => {
                            updateUser(user.id, 'position', pos.name);
                            setActiveDropdown(null);
                          }}
                        >
                          {pos.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Ел. почта</label>
                  <input
                    className={styles.input}
                    value={user.email}
                    onChange={(e) => updateUser(user.id, 'email', e.target.value)}
                    placeholder="test@gmail.com"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Тел. сотовый</label>
                  <input
                    className={styles.input}
                    value={user.phone}
                    onChange={(e) => updateUser(user.id, 'phone', e.target.value)}
                    placeholder="+12345678890"
                  />
                </div>

                <div className={styles.userFooter}>
                  <button className={styles.saveBtn}>
                    <FiCheck size={16} /> Сохранить
                  </button>
                  {users.length > 1 && (
                    <button className={styles.removeBtn} onClick={() => removeUser(user.id)}>
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.finishBtn} onClick={handleFinish} disabled={saving}>
              <FiCheck size={16} /> {saving ? 'Загрузка...' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCreateModal;
