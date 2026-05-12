import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { adminCreateCourse, adminCreateLesson, adminCreateTest, adminGetPositions } from '../../services/adminApi';
import styles from './CourseCreateModal.module.css';

const STEPS = [
  { key: 'cover',    label: 'Обложка' },
  { key: 'title',    label: 'Заголовок*' },
  { key: 'specialty', label: 'Тема/-ы*' },
  { key: 'tests',    label: 'Тест/-ы*' },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  specialty: '',
  image_url: '',
  is_published: false,
};

const CourseCreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [availablePositions, setAvailablePositions] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState('cover');
  const [coverPreview, setCoverPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    adminGetPositions().then(setAvailablePositions);
  }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(reader.result);
      setForm((f) => ({ ...f, image_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const addSpecialty = (val) => {
    if (val && !specialties.includes(val)) {
      setSpecialties([...specialties, val]);
    }
  };

  const removeSpecialty = (s) => setSpecialties(specialties.filter((x) => x !== s));

  // ─── Lessons & Blocks ──────────────────────────────────────────
  const addLesson = () => {
    setLessons([...lessons, { 
      id: Date.now(), 
      title: '', 
      blocks: [{ id: Date.now() + 1, type: 'text', content: '', order: 1 }] 
    }]);
  };

  const addBlock = (lessonId) => {
    setLessons(lessons.map(l => {
      if (l.id === lessonId) {
        return { 
          ...l, 
          blocks: [...l.blocks, { id: Date.now(), type: 'text', content: '', order: l.blocks.length + 1 }] 
        };
      }
      return l;
    }));
  };

  const updateBlock = (lessonId, blockId, field, value) => {
    setLessons(lessons.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          blocks: l.blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b)
        };
      }
      return l;
    }));
  };

  const removeBlock = (lessonId, blockId) => {
    setLessons(lessons.map(l => {
      if (l.id === lessonId) {
        return { ...l, blocks: l.blocks.filter(b => b.id !== blockId) };
      }
      return l;
    }));
  };

  const removeLesson = (id) => setLessons(lessons.filter((l) => l.id !== id));

  // ─── Tests ──────────────────────────────────────────────────────
  const addTest = () => {
    setTests([...tests, { id: Date.now(), title: '', passing_score: 70, questions: [] }]);
  };

  const updateTest = (id, field, value) => {
    setTests(tests.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTest = (id) => setTests(tests.filter((t) => t.id !== id));

  const handleFinish = async () => {
    if (!form.title.trim()) {
      setActiveStep('title');
      return;
    }
    setSaving(true);
    try {
      const courseData = { ...form, specialty: specialties.join(', '), is_published: true };
      const course = await adminCreateCourse(courseData);

      for (const lesson of lessons) {
        if (lesson.title.trim()) {
          await adminCreateLesson(course.id, {
            title: lesson.title,
            order: lessons.indexOf(lesson) + 1,
            blocks: lesson.blocks.map((b, idx) => ({ type: b.type, content: b.content, order: idx + 1 }))
          });
        }
      }

      for (const test of tests) {
        if (test.title.trim()) {
          await adminCreateTest(course.id, { title: test.title, passing_score: test.passing_score, questions: [] });
        }
      }
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const stepStatus = {
    cover:     !!coverPreview,
    title:     !!form.title.trim(),
    specialty: specialties.length > 0,
    tests:     tests.length > 0,
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <aside className={styles.steps}>
          <div className={styles.stepsLine} />
          {STEPS.map((step) => (
            <button
              key={step.key}
              className={`${styles.step} ${activeStep === step.key ? styles.stepActive : ''}`}
              onClick={() => setActiveStep(step.key)}
            >
              <span className={`${styles.stepDot} ${stepStatus[step.key] ? styles.stepDotDone : ''}`} />
              <span className={styles.stepLabel}>{step.label}</span>
            </button>
          ))}
        </aside>

        <div className={styles.content}>
          <button className={styles.closeBtn} onClick={onClose}><FiX size={16} /> Закрыть</button>

          <div className={styles.section}>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
            {coverPreview ? (
              <div className={styles.coverPreview}>
                <img src={coverPreview} alt="Cover" />
                <button className={styles.coverRemove} onClick={() => { setCoverPreview(null); setForm((f) => ({ ...f, image_url: '' })); }}><FiTrash2 size={14} /> Удалить</button>
              </div>
            ) : (
              <button className={styles.addCoverBtn} onClick={() => { setActiveStep('cover'); fileRef.current.click(); }}><span className={styles.plusIcon}><FiPlus size={20} /></span> Добавить обложку</button>
            )}
          </div>

          <div className={styles.section} onClick={() => setActiveStep('title')}>
            <label className={styles.label}>Заголовок*</label>
            <div className={styles.inputShadowWrap}>
              <textarea className={styles.textarea} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} rows={3} />
            </div>
          </div>

          <div className={styles.section} style={{ position: 'relative' }} onClick={() => setActiveStep('specialty')}>
            <div className={styles.specHeader}><span className={styles.specPill}>Должность</span></div>
            <div className={styles.tagsRow} onClick={() => setShowSpecDropdown(!showSpecDropdown)}>
              {specialties.length === 0 && <span className={styles.placeholder}>Выберите должности...</span>}
              {specialties.map((s) => (
                <span key={s} className={styles.tag}>{s}<button className={styles.tagRemove} onClick={(e) => { e.stopPropagation(); removeSpecialty(s); }}>×</button></span>
              ))}
              <FiChevronDown className={styles.chevron} />
            </div>
            {showSpecDropdown && (
              <div className={styles.dropdown}>
                {availablePositions.map((pos) => (
                  <div key={pos.id} className={`${styles.dropdownItem} ${specialties.includes(pos.name) ? styles.dropdownItemActive : ''}`}
                    onClick={() => { if (!specialties.includes(pos.name)) addSpecialty(pos.name); else removeSpecialty(pos.name); setShowSpecDropdown(false); }}>
                    {pos.name}{specialties.includes(pos.name) && <FiCheck size={14} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <button className={styles.addBtnMain} onClick={addLesson}><FiPlus size={20} /> Добавить урок</button>
            {lessons.map((lesson, lIdx) => (
              <div key={lesson.id} className={styles.lessonContainer}>
                <div className={styles.lessonHeader}>
                  <input className={styles.lessonTitleInput} placeholder="Название урока" value={lesson.title} onChange={(e) => setLessons(lessons.map(l => l.id === lesson.id ? {...l, title: e.target.value} : l))} />
                  <button className={styles.removeBtn} onClick={() => removeLesson(lesson.id)}><FiTrash2 size={16} /></button>
                </div>
                <div className={styles.blocksList}>
                  {lesson.blocks.map((block, bIdx) => (
                    <div key={block.id} className={styles.blockCard}>
                      <div className={styles.blockHeader}>
                        <div className={styles.blockBadge}>{bIdx + 1}</div>
                        <select className={styles.blockTypeSelect} value={block.type} onChange={(e) => updateBlock(lesson.id, block.id, 'type', e.target.value)}>
                          <option value="text">Текст</option>
                          <option value="video">Видео</option>
                        </select>
                        <button className={styles.blockRemove} onClick={() => removeBlock(lesson.id, block.id)}><FiX size={14} /></button>
                      </div>
                      {block.type === 'text' ? (
                        <textarea className={styles.blockTextarea} value={block.content} onChange={(e) => updateBlock(lesson.id, block.id, 'content', e.target.value)} placeholder="Введите текст блока..." />
                      ) : (
                        <div className={styles.videoPlaceholder}>
                          <div className={styles.playIcon}><FiPlus size={24} /></div>
                          <input className={styles.videoUrlInput} placeholder="Ссылка на видео" value={block.content} onChange={(e) => updateBlock(lesson.id, block.id, 'content', e.target.value)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.lessonFooter}>
                  <button className={styles.addBlockBtn} onClick={() => addBlock(lesson.id)}><FiPlus size={16} /> Добавить блок урока</button>
                  <button className={styles.saveLessonBtn}><FiCheck size={16} /> Сохранить</button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.section} onClick={() => setActiveStep('tests')}>
            <button className={styles.addBtnMain} onClick={addTest}><FiPlus size={20} /> Добавить тест</button>
            {tests.map((test, i) => (
              <div key={test.id} className={styles.lessonRow}>
                <span className={styles.lessonNum}>T{i + 1}</span>
                <input className={styles.lessonInput} placeholder="Название теста" value={test.title} onChange={(e) => updateTest(test.id, 'title', e.target.value)} />
                <button className={styles.removeBtn} onClick={() => removeTest(test.id)}><FiTrash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.finishBtn} onClick={handleFinish} disabled={saving}><FiCheck size={16} /> {saving ? 'Сохранение...' : 'Завершить'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreateModal;
