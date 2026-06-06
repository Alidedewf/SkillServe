import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiBookOpen, FiSettings, FiCheckSquare } from 'react-icons/fi';
import {
  adminGetCourse,
  adminUpdateCourse,
  adminGetPositions,
} from '../../services/adminApi';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './AdminCourseEditor.module.css';

const AdminCourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // General Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Сервис');
  const [image_url, setImageUrl] = useState('');
  const [specialty, setSpecialty] = useState(''); // comma-separated or selected
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [allPositions, setAllPositions] = useState([]);

  // Child Lists
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);

  // Active Lesson/Test in lists
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeTestId, setActiveTestId] = useState(null);

  const fileInputRef = useRef();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load positions
        const positions = await adminGetPositions();
        setAllPositions(positions || []);

        const course = await adminGetCourse(id);
        setTitle(course.title || '');
        setDescription(course.description || '');
        setCategory(course.category || 'Сервис');
        setImageUrl(course.image_url || '');
        setSpecialty(course.specialty || '');
        setLessons(course.lessons || []);
        setTests(course.tests || []);

        // Parse selected positions from specialty
        const specList = course.specialty ? course.specialty.split(',').map(s => s.trim()) : [];
        setSelectedPositions(specList);
      } catch (err) {
        console.error('[AdminCourseEditor Load Error]', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Заголовок курса обязателен!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        image_url,
        specialty: selectedPositions.join(', '),
        lessons,
        tests,
      };

      await adminUpdateCourse(id, payload);
      navigate('/admin/courses');
    } catch (err) {
      console.error('[Save Error]', err);
      alert('Ошибка сохранения!');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ─── Lessons Controls ──────────────────────────────────────────────────────
  const handleAddLesson = () => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: `Новый урок ${lessons.length + 1}`,
      order: lessons.length + 1,
      blocks: [
        {
          id: `block-${Date.now()}`,
          type: 'text',
          content: 'Введите текст урока...',
          order: 1,
        }
      ]
    };
    setLessons([...lessons, newLesson]);
    setActiveLessonId(newLesson.id);
  };

  const handleDeleteLesson = (lessonId) => {
    if (window.confirm('Вы действительно хотите удалить этот урок?')) {
      const updated = lessons.filter(l => l.id !== lessonId);
      setLessons(updated);
      if (activeLessonId === lessonId) {
        setActiveLessonId(updated[0]?.id || null);
      }
    }
  };

  const handleUpdateLessonTitle = (lessonId, newTitle) => {
    setLessons(lessons.map(l => l.id === lessonId ? { ...l, title: newTitle } : l));
  };

  const handleAddBlock = (lessonId, type) => {
    setLessons(lessons.map(l => {
      if (l.id !== lessonId) return l;
      const newBlock = {
        id: `block-${Date.now()}`,
        type,
        content: type === 'text' ? 'Текст блока...' : 'https://www.youtube.com/embed/...',
        order: l.blocks.length + 1,
      };
      return { ...l, blocks: [...l.blocks, newBlock] };
    }));
  };

  const handleUpdateBlockContent = (lessonId, blockId, value) => {
    setLessons(lessons.map(l => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        blocks: l.blocks.map(b => b.id === blockId ? { ...b, content: value } : b)
      };
    }));
  };

  const handleDeleteBlock = (lessonId, blockId) => {
    setLessons(lessons.map(l => {
      if (l.id !== lessonId) return l;
      const updatedBlocks = l.blocks.filter(b => b.id !== blockId);
      // Re-order remaining blocks
      const orderedBlocks = updatedBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
      return { ...l, blocks: orderedBlocks };
    }));
  };

  // ─── Tests Controls ────────────────────────────────────────────────────────
  const handleAddTest = () => {
    const newTest = {
      id: `test-${Date.now()}`,
      title: `Итоговый тест ${tests.length + 1}`,
      passing_score: 70,
      questions: [
        {
          id: `question-${Date.now()}`,
          content: 'Вопрос 1',
          type: 'single',
          answers: [
            { id: `answer-1-${Date.now()}`, content: 'Вариант 1', is_correct: true },
            { id: `answer-2-${Date.now()}`, content: 'Вариант 2', is_correct: false },
          ]
        }
      ]
    };
    setTests([...tests, newTest]);
    setActiveTestId(newTest.id);
  };

  const handleDeleteTest = (testId) => {
    if (window.confirm('Вы действительно хотите удалить этот тест?')) {
      const updated = tests.filter(t => t.id !== testId);
      setTests(updated);
      if (activeTestId === testId) {
        setActiveTestId(updated[0]?.id || null);
      }
    }
  };

  const handleUpdateTestFields = (testId, fields) => {
    setTests(tests.map(t => t.id === testId ? { ...t, ...fields } : t));
  };

  const handleAddQuestion = (testId) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      const newQuestion = {
        id: `question-${Date.now()}`,
        content: 'Новый вопрос',
        type: 'single',
        answers: [
          { id: `ans-${Date.now()}-1`, content: 'Правильный ответ', is_correct: true },
          { id: `ans-${Date.now()}-2`, content: 'Неправильный ответ', is_correct: false },
        ]
      };
      return { ...t, questions: [...t.questions, newQuestion] };
    }));
  };

  const handleDeleteQuestion = (testId, questionId) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return { ...t, questions: t.questions.filter(q => q.id !== questionId) };
    }));
  };

  const handleUpdateQuestionText = (testId, questionId, text) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return {
        ...t,
        questions: t.questions.map(q => q.id === questionId ? { ...q, content: text } : q)
      };
    }));
  };

  const handleAddAnswer = (testId, questionId) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return {
        ...t,
        questions: t.questions.map(q => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            answers: [...q.answers, { id: `ans-${Date.now()}`, content: 'Новый вариант', is_correct: false }]
          };
        })
      };
    }));
  };

  const handleDeleteAnswer = (testId, questionId, answerId) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return {
        ...t,
        questions: t.questions.map(q => {
          if (q.id !== questionId) return q;
          return { ...q, answers: q.answers.filter(a => a.id !== answerId) };
        })
      };
    }));
  };

  const handleUpdateAnswerText = (testId, questionId, answerId, text) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return {
        ...t,
        questions: t.questions.map(q => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            answers: q.answers.map(a => a.id === answerId ? { ...a, content: text } : a)
          };
        })
      };
    }));
  };

  const handleSelectCorrectAnswer = (testId, questionId, answerId) => {
    setTests(tests.map(t => {
      if (t.id !== testId) return t;
      return {
        ...t,
        questions: t.questions.map(q => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            answers: q.answers.map(a => ({ ...a, is_correct: a.id === answerId }))
          };
        })
      };
    }));
  };

  const handlePositionToggle = (posName) => {
    if (selectedPositions.includes(posName)) {
      setSelectedPositions(selectedPositions.filter(p => p !== posName));
    } else {
      setSelectedPositions([...selectedPositions, posName]);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.page}>
          <div className={styles.emptyState}><h3>Загрузка редактора курса...</h3></div>
        </div>
      </AdminLayout>
    );
  }

  const activeLesson = lessons.find(l => l.id === activeLessonId) || lessons[0];
  const activeTest = tests.find(t => t.id === activeTestId) || tests[0];

  return (
    <AdminLayout>
      
      {/* Top sticky bar */}
      <header className={styles.topBar}>
        <div className={styles.titleArea}>
          <button className={styles.backBtn} onClick={() => navigate('/admin/courses')}>
            <FiArrowLeft size={18} /> Назад
          </button>
          <h1 className={styles.courseTitleHeader}>
            Редактирование: {title || 'Курс без названия'}
          </h1>
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          <FiSave size={18} /> {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </header>

      {/* Main Container */}
      <div className={styles.container}>
        
        {/* Sidebar Nav */}
        <nav className={styles.sidebar}>
          <button
            className={`${styles.navItem} ${activeTab === 'general' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FiSettings size={18} /> Общие сведения
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'lessons' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveTab('lessons');
              if (lessons.length > 0 && !activeLessonId) {
                setActiveLessonId(lessons[0].id);
              }
            }}
          >
            <FiBookOpen size={18} /> Уроки ({lessons.length})
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'tests' ? styles.navItemActive : ''}`}
            onClick={() => {
              setActiveTab('tests');
              if (tests.length > 0 && !activeTestId) {
                setActiveTestId(tests[0].id);
              }
            }}
          >
            <FiCheckSquare size={18} /> Тесты ({tests.length})
          </button>
        </nav>

        {/* Content Box */}
        <main className={styles.content}>
          
          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div>
              <h2 className={styles.sectionTitle}>Общие сведения о курсе</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Заголовок курса *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Стандарты вежливого обслуживания"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Описание курса</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите сотрудникам, о чем данный курс и какую пользу он принесет."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Категория курса</label>
                <select
                  className={styles.select}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Сервис">Сервис</option>
                  <option value="Кухня">Кухня</option>
                  <option value="Продукты">Продукты</option>
                  <option value="Безопасность">Безопасность</option>
                  <option value="Интеграция">Интеграция</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Назначить для должностей (Доступность)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {allPositions.map(pos => (
                    <label key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input
                        type="checkbox"
                        style={{ width: '1.1rem', height: '1.1rem', accentColor: '#006ffd' }}
                        checked={selectedPositions.includes(pos.name)}
                        onChange={() => handlePositionToggle(pos.name)}
                      />
                      {pos.name}
                    </label>
                  ))}
                  {allPositions.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Должностей пока не создано</p>}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Обложка курса</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                />
                <div className={styles.coverWrapper} onClick={() => fileInputRef.current.click()}>
                  {image_url ? (
                    <>
                      <img src={image_url} alt="Cover Preview" className={styles.coverImage} />
                      <button
                        className={styles.coverRemoveBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl('');
                        }}
                      >
                        <FiTrash2 size={14} /> Удалить
                      </button>
                    </>
                  ) : (
                    <div className={styles.coverPlaceholder}>
                      <FiPlus size={24} />
                      <span>Нажмите для загрузки обложки (JPG / PNG)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Lessons List & Edit */}
          {activeTab === 'lessons' && (
            <div className={styles.splitView}>
              
              {/* Left Column: Lesson Master Selector */}
              <div className={styles.masterList}>
                <p className={styles.label} style={{ margin: '0 0 0.5rem 0' }}>Список уроков</p>
                {lessons.map((les) => (
                  <div
                    key={les.id}
                    className={`${styles.masterItem} ${activeLesson?.id === les.id ? styles.masterItemActive : ''}`}
                    onClick={() => setActiveLessonId(les.id)}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {les.order}. {les.title}
                    </span>
                    <button
                      className={styles.deleteIconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(les.id);
                      }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}
                <button className={styles.addBtn} onClick={handleAddLesson}>
                  <FiPlus /> Добавить урок
                </button>
              </div>

              {/* Right Column: Lesson Details Editor */}
              <div className={styles.detailArea}>
                {activeLesson ? (
                  <>
                    <div className={styles.detailHeader}>
                      <h3 className={styles.detailTitle}>Настройка урока #{activeLesson.order}</h3>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Название урока</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={activeLesson.title}
                        onChange={(e) => handleUpdateLessonTitle(activeLesson.id, e.target.value)}
                        placeholder="Например: Встреча гостя"
                      />
                    </div>

                    <p className={styles.label} style={{ marginBottom: '0.75rem' }}>Блоки контента</p>
                    <div className={styles.blocksList}>
                      {activeLesson.blocks?.map((block) => (
                        <div key={block.id} className={styles.blockCard}>
                          <div className={styles.blockHeader}>
                            <span className={`${styles.blockTypeBadge} ${block.type === 'video' ? styles.badgeVideo : styles.badgeText}`}>
                              {block.type === 'video' ? 'Видео-урок' : 'Текст'}
                            </span>
                            <button
                              className={styles.deleteIconBtn}
                              onClick={() => handleDeleteBlock(activeLesson.id, block.id)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          
                          <div className={styles.blockRow}>
                            {block.type === 'video' ? (
                              <input
                                type="text"
                                className={styles.input}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(activeLesson.id, block.id, e.target.value)}
                                placeholder="Вставьте ссылку на встраиваемое видео (Youtube Embed)"
                              />
                            ) : (
                              <textarea
                                className={styles.textarea}
                                value={block.content}
                                onChange={(e) => handleUpdateBlockContent(activeLesson.id, block.id, e.target.value)}
                                placeholder="Текст вашего прекрасного урока..."
                                rows={4}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button className={styles.addBtn} style={{ flex: 1 }} onClick={() => handleAddBlock(activeLesson.id, 'text')}>
                        <FiPlus /> Добавить текстовый блок
                      </button>
                      <button className={styles.addBtn} style={{ flex: 1 }} onClick={() => handleAddBlock(activeLesson.id, 'video')}>
                        <FiPlus /> Добавить видео блок
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <FiBookOpen size={48} />
                    <p>Добавьте первый урок, чтобы начать наполнение курса знаниями.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Tests List & Edit */}
          {activeTab === 'tests' && (
            <div className={styles.splitView}>
              
              {/* Left Column: Test Master Selector */}
              <div className={styles.masterList}>
                <p className={styles.label} style={{ margin: '0 0 0.5rem 0' }}>Список тестов</p>
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className={`${styles.masterItem} ${activeTest?.id === test.id ? styles.masterItemActive : ''}`}
                    onClick={() => setActiveTestId(test.id)}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {test.title}
                    </span>
                    <button
                      className={styles.deleteIconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTest(test.id);
                      }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}
                <button className={styles.addBtn} onClick={handleAddTest}>
                  <FiPlus /> Добавить тест
                </button>
              </div>

              {/* Right Column: Test Details Editor */}
              <div className={styles.detailArea}>
                {activeTest ? (
                  <>
                    <div className={styles.detailHeader}>
                      <h3 className={styles.detailTitle}>Настройка теста</h3>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Название теста</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={activeTest.title}
                        onChange={(e) => handleUpdateTestFields(activeTest.id, { title: e.target.value })}
                        placeholder="Например: Финальное тестирование курса"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Минимальный балл для сдачи (%)</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={activeTest.passing_score}
                        onChange={(e) => handleUpdateTestFields(activeTest.id, { passing_score: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={100}
                      />
                    </div>

                    <p className={styles.label} style={{ marginBottom: '1rem' }}>Вопросы теста</p>
                    <div className={styles.questionsList}>
                      {activeTest.questions?.map((question, qIdx) => (
                        <div key={question.id} className={styles.questionCard}>
                          <div className={styles.blockHeader} style={{ marginBottom: '1rem' }}>
                            <span className={styles.label} style={{ margin: 0 }}>Вопрос #{qIdx + 1}</span>
                            <button
                              className={styles.deleteIconBtn}
                              onClick={() => handleDeleteQuestion(activeTest.id, question.id)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>

                          <input
                            type="text"
                            className={styles.input}
                            value={question.content}
                            onChange={(e) => handleUpdateQuestionText(activeTest.id, question.id, e.target.value)}
                            placeholder="Напишите текст вопроса..."
                            style={{ fontWeight: 600 }}
                          />

                          <div className={styles.answersList}>
                            {question.answers?.map((ans, aIdx) => (
                              <div key={ans.id} className={styles.answerRow}>
                                <input
                                  type="radio"
                                  name={`correct-ans-${question.id}`}
                                  className={styles.radioInput}
                                  checked={ans.is_correct}
                                  onChange={() => handleSelectCorrectAnswer(activeTest.id, question.id, ans.id)}
                                />
                                <input
                                  type="text"
                                  className={styles.input}
                                  value={ans.content}
                                  onChange={(e) => handleUpdateAnswerText(activeTest.id, question.id, ans.id, e.target.value)}
                                  placeholder={`Вариант ${aIdx + 1}`}
                                  style={{ borderBottom: ans.is_correct ? '2px solid #10b981' : '1px solid #cbd5e1' }}
                                />
                                <button
                                  className={styles.deleteIconBtn}
                                  onClick={() => handleDeleteAnswer(activeTest.id, question.id, ans.id)}
                                  disabled={question.answers.length <= 2}
                                  style={{ opacity: question.answers.length <= 2 ? 0.3 : 1 }}
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            className={styles.addBtn}
                            style={{ padding: '0.5rem', width: '220px', marginTop: '1rem', fontSize: '0.85rem' }}
                            onClick={() => handleAddAnswer(activeTest.id, question.id)}
                          >
                            <FiPlus /> Добавить вариант ответа
                          </button>
                        </div>
                      ))}
                    </div>

                    <button className={styles.addBtn} style={{ marginTop: '1rem' }} onClick={() => handleAddQuestion(activeTest.id)}>
                      <FiPlus /> Добавить вопрос
                    </button>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <FiCheckSquare size={48} />
                    <p>Добавьте тест, чтобы закрепить знания сотрудников.</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>

      </div>

    </AdminLayout>
  );
};

export default AdminCourseEditor;
