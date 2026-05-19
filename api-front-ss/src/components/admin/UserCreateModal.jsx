import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { adminCreateUser, adminUpdateUser, adminGetPositions } from '../../services/adminApi';
import styles from './UserCreateModal.module.css';

const DEFAULT_USER = {
  fio: '',
  position: '',
  email: '',
  password: '',
  phone: '',
};

const UserCreateModal = ({ onClose, onCreated, editUser }) => {
  const isEditMode = !!editUser;

  const getInitialUser = () => {
    if (editUser) {
      return [{
        id: editUser.id,
        fio: `${editUser.first_name || ''} ${editUser.last_name || ''}`.trim(),
        position: editUser.position || '',
        email: editUser.email || '',
        password: '',
        phone: editUser.phone || '',
      }];
    }
    return [{ ...DEFAULT_USER, id: Date.now() }];
  };

  const [users, setUsers] = useState(getInitialUser);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); 
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
      if (isEditMode) {
        const user = users[0];
        const names = user.fio.split(' ');
        const data = {
          first_name: names[0] || '',
          last_name: names.slice(1).join(' ') || '',
          email: user.email,
          phone: user.phone,
          position: user.position,
        };
        if (user.password) {
          data.password = user.password;
        }
        await adminUpdateUser(editUser.id, data);
      } else {
        for (const user of users) {
          if (user.fio.trim() && user.email.trim()) {
            const names = user.fio.split(' ');
            await adminCreateUser({
              first_name: names[0] || '',
              last_name: names.slice(1).join(' ') || '',
              email: user.email,
              password: user.password,
              phone: user.phone,
              position: user.position,
              role: 'staff',
              is_active: true
            });
          }
        }
      }
      onCreated();
    } catch (err) {
      console.error(err);
      alert(isEditMode ? 'Ошибка обновления сотрудника' : 'Ошибка при добавлении персонала');
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
                  <label className={styles.label}>{isEditMode ? 'Новый пароль' : 'Пароль*'}</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={user.password}
                    onChange={(e) => updateUser(user.id, 'password', e.target.value)}
                    placeholder={isEditMode ? 'Оставьте пустым, если не менять' : 'Минимум 4 символа'}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Тел. сотовый</label>
                  <input
                    className={styles.input}
                    type="tel"
                    value={user.phone}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        const input = e.target;
                        const hasSelection = input.selectionStart !== input.selectionEnd;
                        
                        if (hasSelection) {
                          // Выделен текст — очищаем всё до +7
                          e.preventDefault();
                          updateUser(user.id, 'phone', '+7');
                          return;
                        }
                        
                        // Без выделения — удаляем последнюю цифру
                        e.preventDefault();
                        let digits = user.phone.replace(/\D/g, '');
                        if (digits.startsWith('7')) digits = digits.slice(1);
                        digits = digits.slice(0, -1);
                        if (digits.length === 0) {
                          updateUser(user.id, 'phone', '+7');
                          return;
                        }
                        let f = '+7';
                        if (digits.length > 0) f += ` (${digits.slice(0, 3)}`;
                        if (digits.length >= 3) f += `) ${digits.slice(3, 6)}`;
                        if (digits.length >= 6) f += `-${digits.slice(6, 8)}`;
                        if (digits.length >= 8) f += `-${digits.slice(8, 10)}`;
                        updateUser(user.id, 'phone', f);
                      }
                    }}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      // Убираем код страны (7 или 8) — он всегда есть от +7 префикса
                      if (digits.startsWith('7') || digits.startsWith('8')) {
                        digits = digits.slice(1);
                      }
                      digits = digits.slice(0, 10);
                      // Форматируем: +7 (XXX) XXX-XX-XX
                      let f = '+7';
                      if (digits.length > 0) f += ` (${digits.slice(0, 3)}`;
                      if (digits.length >= 3) f += `) ${digits.slice(3, 6)}`;
                      if (digits.length >= 6) f += `-${digits.slice(6, 8)}`;
                      if (digits.length >= 8) f += `-${digits.slice(8, 10)}`;
                      updateUser(user.id, 'phone', f);
                    }}
                    onFocus={(e) => {
                      if (!e.target.value) updateUser(user.id, 'phone', '+7');
                    }}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div className={styles.userFooter}>
                  {!isEditMode && (
                    <button className={styles.saveBtn} onClick={addUser}>
                      <FiPlus size={16} /> Добавить персонал
                    </button>
                  )}
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
              <FiCheck size={16} /> {saving ? 'Загрузка...' : isEditMode ? 'Сохранить изменения' : 'Завершить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCreateModal;
