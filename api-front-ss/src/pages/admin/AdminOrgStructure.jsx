import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  adminGetDepartments,
  adminCreateDepartment,
  adminDeleteDepartment,
  adminGetPositions,
  adminCreatePosition,
  adminDeletePosition,
} from '../../services/adminApi';
import styles from './AdminOrgStructure.module.css';
import { FiPlus, FiTrash2, FiLayers, FiTag, FiChevronRight } from 'react-icons/fi';

const AdminOrgStructure = () => {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // New department/position inputs
  const [newDeptName, setNewDeptName] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const [newPosDeptId, setNewPosDeptId] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [savingPos, setSavingPos] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [depts, pos] = await Promise.all([adminGetDepartments(), adminGetPositions()]);
      setDepartments(depts);
      setPositions(pos);
    } catch (err) {
      console.error('Ошибка загрузки оргструктуры:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    try {
      await adminCreateDepartment(newDeptName.trim());
      setNewDeptName('');
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingDept(false);
    }
  };

  const handleCreatePos = async (e) => {
    e.preventDefault();
    if (!newPosName.trim()) return;
    setSavingPos(true);
    try {
      await adminCreatePosition(newPosName.trim(), newPosDeptId ? parseInt(newPosDeptId) : null);
      setNewPosName('');
      setNewPosDeptId('');
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPos(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Удалить отдел? Должности без отдела не будут удалены.')) return;
    try {
      await adminDeleteDepartment(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePos = async (id) => {
    if (!window.confirm('Удалить должность?')) return;
    try {
      await adminDeletePosition(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Оргструктура">
        <p style={{ padding: '2rem', color: '#94a3b8' }}>Загрузка...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Оргструктура ресторана">
      <div className={styles.page}>
        {/* ─── Departments ─────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FiLayers size={20} />
            <h2 className={styles.sectionTitle}>Отделы</h2>
          </div>

          <div className={styles.list}>
            {departments.length === 0 ? (
              <p className={styles.empty}>Нет отделов</p>
            ) : (
              departments.map((dept) => (
                <div key={dept.id} className={styles.card}>
                  <div className={styles.cardMain}>
                    <span className={styles.cardIcon}>🏢</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{dept.name}</span>
                      {dept.positions && dept.positions.length > 0 && (
                        <span className={styles.cardMeta}>
                          {dept.positions.map(p => p.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteDept(dept.id)}
                    title="Удалить отдел"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <form className={styles.addForm} onSubmit={handleCreateDept}>
            <input
              className={styles.addInput}
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Название отдела"
            />
            <button type="submit" className={styles.addBtn} disabled={savingDept || !newDeptName.trim()}>
              <FiPlus size={16} /> {savingDept ? '...' : 'Добавить'}
            </button>
          </form>
        </section>

        {/* ─── Positions ──────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FiTag size={20} />
            <h2 className={styles.sectionTitle}>Должности</h2>
          </div>

          <div className={styles.list}>
            {positions.length === 0 ? (
              <p className={styles.empty}>Нет должностей</p>
            ) : (
              positions.map((pos) => (
                <div key={pos.id} className={styles.card}>
                  <div className={styles.cardMain}>
                    <span className={styles.cardIcon}>🏷️</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>{pos.name}</span>
                      {pos.department && (
                        <span className={styles.cardMeta}>
                          <FiChevronRight size={12} /> {pos.department.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeletePos(pos.id)}
                    title="Удалить должность"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <form className={styles.addForm} onSubmit={handleCreatePos}>
            <input
              className={styles.addInput}
              value={newPosName}
              onChange={(e) => setNewPosName(e.target.value)}
              placeholder="Название должности"
            />
            <select
              className={styles.addSelect}
              value={newPosDeptId}
              onChange={(e) => setNewPosDeptId(e.target.value)}
            >
              <option value="">Без отдела</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <button type="submit" className={styles.addBtn} disabled={savingPos || !newPosName.trim()}>
              <FiPlus size={16} /> {savingPos ? '...' : 'Добавить'}
            </button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminOrgStructure;
