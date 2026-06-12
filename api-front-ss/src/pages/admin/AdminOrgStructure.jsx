import React, { useState } from 'react';
import { FiPlus, FiUsers, FiMoreVertical, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import DepartmentModal from '../../components/admin/DepartmentModal';
import PositionCreateModal from '../../components/admin/PositionCreateModal';
import { 
  adminGetDepartments, 
  adminGetPositions, 
  adminReorderOrgStructure,
  adminDeleteDepartment,
  adminDeletePosition
} from '../../services/adminApi';
import styles from './AdminOrgStructure.module.css';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



// ─── SORTABLE NODE COMPONENT ───────────────────────────────────────
const SortableNode = ({ id, node, type, onEdit, onDelete, onAdd }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type, node } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isDepartment = type === 'department';
  const isPosition = type === 'position';

  return (
    <div ref={setNodeRef} style={style} className={styles.nodeWrapper}>
      <div 
        className={`${styles.nodeCard} ${isDepartment ? styles.nodeDept : isPosition ? styles.nodePos : styles.nodeRoot}`}
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className={styles.nodeHeader}>
          <span className={styles.nodeTitle}>{node.name}</span>
          {node.dbId !== null && (
            <div className={styles.menuContainer}>
              <button 
                className={styles.iconBtn} 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              >
                <FiMoreVertical size={14} />
              </button>
              {menuOpen && (
                <div className={styles.dropdownMenu}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(node, type); }}>Редактировать</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(node, type); }} className={styles.deleteText}>Удалить</button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isPosition && (
          <div className={styles.usersCount}>
            <FiUsers size={12} />
            <span>{node.usersCount} сотр.</span>
          </div>
        )}

        {!isPosition && node.dbId !== null && (
          <div className={styles.addBtnContainer}>
            <button 
              className={styles.addBtnMini} 
              title={isDepartment ? "Добавить должность" : "Добавить отдел"}
              onClick={(e) => { e.stopPropagation(); onAdd(node, type); }}
            >
              <FiPlus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DEPARTMENT COMPONENT (WITH NESTED POSITIONS) ───────────────────
const DepartmentNode = ({ department, onEdit, onDelete, onAdd }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const positionIds = department.positions.map(p => p.id);

  return (
    <li>
      <SortableNode 
        id={department.id} 
        node={department} 
        type="department" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onAdd={onAdd}
      />
      
      {department.positions.length > 0 && (
        <button 
          className={styles.expandBtn} 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </button>
      )}

      <AnimatePresence>
        {isExpanded && department.positions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SortableContext items={positionIds} strategy={horizontalListSortingStrategy}>
              {department.positions.map(pos => (
                <li key={pos.id}>
                  <SortableNode 
                    id={pos.id} 
                    node={pos} 
                    type="position" 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                  />
                </li>
              ))}
            </SortableContext>
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────
const AdminOrgStructure = () => {
  const [data, setData] = useState({
    id: 'root',
    name: localStorage.getItem('active_restaurant_name') || 'Ресторан',
    isRoot: true,
    departments: []
  });
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'dept' | 'pos' | null
  const [modalData, setModalData] = useState(null); // null for create, object for edit
  const [modalDeptId, setModalDeptId] = useState(null); // Used when creating position inside a specific dept

  const loadStructure = async () => {
    try {
      setLoading(true);
      const [depts, allPositions] = await Promise.all([
        adminGetDepartments(),
        adminGetPositions()
      ]);

      const formattedDepartments = depts.map(dept => ({
        id: `dept-${dept.id}`,
        dbId: dept.id,
        name: dept.name,
        order: dept.order,
        positions: dept.positions.map(pos => ({
          id: `pos-${pos.id}`,
          dbId: pos.id,
          name: pos.name,
          order: pos.order,
          usersCount: pos._count?.users || 0,
          department_id: pos.department_id,
        }))
      }));

      const unassignedPositions = allPositions.filter(p => !p.department_id);
      if (unassignedPositions.length > 0) {
        formattedDepartments.push({
          id: 'dept-unassigned',
          dbId: null,
          name: 'Без отдела (Новые)',
          order: 999,
          positions: unassignedPositions.map((pos, index) => ({
            id: `pos-${pos.id}`,
            dbId: pos.id,
            name: pos.name,
            order: pos.order || index,
            usersCount: pos._count?.users || 0,
            department_id: null,
          }))
        });
      }

      setData(prev => ({ ...prev, departments: formattedDepartments }));
    } catch (err) {
      console.error('Ошибка загрузки оргструктуры:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadStructure();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const departmentIds = data.departments.map(d => d.id);

  // Helper to find which container a position belongs to
  const findDepartmentOfPosition = (posId) => {
    return data.departments.find(d => d.positions.some(p => p.id === posId));
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(active.data.current?.node);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'position' && overType === 'position') {
      const activeDept = findDepartmentOfPosition(active.id);
      const overDept = findDepartmentOfPosition(over.id);

      if (activeDept && overDept && activeDept.id !== overDept.id) {
        setData(prev => {
          const newDepts = prev.departments.map(d => ({ ...d, positions: [...d.positions] }));
          const activeDeptIdx = newDepts.findIndex(d => d.id === activeDept.id);
          const overDeptIdx = newDepts.findIndex(d => d.id === overDept.id);
          
          const posToMove = newDepts[activeDeptIdx].positions.find(p => p.id === active.id);
          newDepts[activeDeptIdx].positions = newDepts[activeDeptIdx].positions.filter(p => p.id !== active.id);
          
          const overPosIdx = newDepts[overDeptIdx].positions.findIndex(p => p.id === over.id);
          const insertIndex = overPosIdx >= 0 ? overPosIdx : newDepts[overDeptIdx].positions.length;
          newDepts[overDeptIdx].positions.splice(insertIndex, 0, posToMove);
          
          return { ...prev, departments: newDepts };
        });
      }
    } else if (activeType === 'position' && overType === 'department') {
      const activeDept = findDepartmentOfPosition(active.id);
      const overDept = data.departments.find(d => d.id === over.id);

      if (activeDept && overDept && activeDept.id !== overDept.id) {
        setData(prev => {
          const newDepts = prev.departments.map(d => ({ ...d, positions: [...d.positions] }));
          const activeDeptIdx = newDepts.findIndex(d => d.id === activeDept.id);
          const overDeptIdx = newDepts.findIndex(d => d.id === overDept.id);
          
          const posToMove = newDepts[activeDeptIdx].positions.find(p => p.id === active.id);
          newDepts[activeDeptIdx].positions = newDepts[activeDeptIdx].positions.filter(p => p.id !== active.id);
          
          newDepts[overDeptIdx].positions.push(posToMove);
          
          return { ...prev, departments: newDepts };
        });
      }
    }
  };

  const saveStructure = async (newDepts) => {
    try {
      const updates = {
        departments: newDepts
          .filter(d => d.dbId !== null) // Ignore unassigned container
          .map((d, index) => ({ id: d.dbId, order: index })),
        positions: []
      };
      newDepts.forEach((d) => {
        d.positions.forEach((p, index) => {
          updates.positions.push({ id: p.dbId, department_id: d.dbId, order: index });
        });
      });
      await adminReorderOrgStructure(updates);
    } catch (err) {
      console.error('Ошибка сохранения оргструктуры:', err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    setData(prev => {
      let newDepts = prev.departments.map(d => ({ ...d, positions: [...d.positions] }));

      if (over && active.id !== over.id) {
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'department' && overType === 'department') {
          const oldIndex = newDepts.findIndex(d => d.id === active.id);
          const newIndex = newDepts.findIndex(d => d.id === over.id);
          newDepts = arrayMove(newDepts, oldIndex, newIndex);
        } else if (activeType === 'position' && overType === 'position') {
          // Find which dept the active position is CURRENTLY in (because it might have moved in handleDragOver)
          const dept = newDepts.find(d => d.positions.some(p => p.id === active.id));
          if (dept) {
            const deptIdx = newDepts.findIndex(d => d.id === dept.id);
            const oldIndex = newDepts[deptIdx].positions.findIndex(p => p.id === active.id);
            const newIndex = newDepts[deptIdx].positions.findIndex(p => p.id === over.id);
            newDepts[deptIdx].positions = arrayMove(newDepts[deptIdx].positions, oldIndex, newIndex);
          }
        }
      }

      // Always save because handleDragOver might have changed the department assignment
      saveStructure(newDepts);
      return { ...prev, departments: newDepts };
    });
  };

  // CRUD Handlers
  const handleEdit = (node, type) => {
    setModalData(node);
    setModalType(type === 'department' ? 'dept' : 'pos');
    if (type === 'position') setModalDeptId(node.department_id);
  };

  const handleDelete = async (node, type) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${type === 'department' ? 'отдел' : 'должность'} "${node.name}"?`)) return;
    try {
      if (type === 'department') {
        if (node.dbId) await adminDeleteDepartment(node.dbId);
      } else {
        if (node.dbId) await adminDeletePosition(node.dbId);
      }
      loadStructure();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleAdd = (node, type) => {
    setModalData(null);
    if (node.isRoot) {
      setModalType('dept');
    } else if (type === 'department') {
      setModalType('pos');
      setModalDeptId(node.dbId);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Оргструктура</h1>
            <p className={styles.subtitle}>Древовидное представление ресторана (Drag & Drop)</p>
          </div>
          <button className={styles.addDepartmentBtn} onClick={() => { setModalData(null); setModalType('dept'); }}>
            <FiPlus size={18} />
            <span>Новый отдел</span>
          </button>
        </header>

        <div className={styles.treeContainer}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
              Загрузка структуры...
            </div>
          ) : (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
            <div className={styles.tree}>
              <ul>
                <li>
                  <div className={styles.nodeWrapper}>
                    <div className={`${styles.nodeCard} ${styles.nodeRoot}`}>
                      <div className={styles.nodeHeader}>
                        <span className={styles.nodeTitle}>{data.name}</span>
                      </div>
                      <div className={styles.addBtnContainer}>
                        <button 
                          className={styles.addBtnMini} 
                          title="Добавить отдел"
                          onClick={() => { setModalData(null); setModalType('dept'); }}
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {data.departments.length > 0 && (
                    <ul>
                      <SortableContext items={departmentIds} strategy={horizontalListSortingStrategy}>
                        {data.departments.map(dept => (
                          <DepartmentNode 
                            key={dept.id} 
                            department={dept} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdd={handleAdd}
                          />
                        ))}
                      </SortableContext>
                    </ul>
                  )}
                </li>
              </ul>
            </div>

            <DragOverlay>
              {activeId && activeItem ? (
                <div className={`${styles.nodeCard} ${activeItem.usersCount ? styles.nodePos : styles.nodeDept} ${styles.draggingNode}`}>
                  <div className={styles.nodeHeader}>
                    <span className={styles.nodeTitle}>{activeItem.name}</span>
                  </div>
                  {activeItem.usersCount && (
                    <div className={styles.usersCount}>
                      <FiUsers size={12} />
                      <span>{activeItem.usersCount} сотр.</span>
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          )}
        </div>
      </div>

      {modalType === 'dept' && (
        <DepartmentModal 
          initialData={modalData} 
          onClose={() => setModalType(null)} 
          onSaved={() => { setModalType(null); loadStructure(); }} 
        />
      )}

      {modalType === 'pos' && (
        <PositionCreateModal 
          initialData={modalData}
          departmentId={modalDeptId}
          onClose={() => setModalType(null)}
          onCreated={() => { setModalType(null); loadStructure(); }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminOrgStructure;
