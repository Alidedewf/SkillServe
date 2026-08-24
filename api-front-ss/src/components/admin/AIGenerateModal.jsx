import React, { useState } from 'react';
import { FiZap, FiBookOpen, FiCheckCircle, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';
import { aiGenerateCourse, aiGenerateImage, adminCreateCourse } from '../../services/adminApi';
import styles from './AIGenerateModal.module.css';

const DIFFICULTY_OPTIONS = ['Базовый', 'Средний', 'Продвинутый'];
const LESSONS_OPTIONS = [3, 5, 7];
const CATEGORY_OPTIONS = ['Сервис', 'Кухня', 'Продукты', 'Безопасность', 'Интеграция'];

const LOADING_MESSAGES = [
  { text: '🔍 Анализирую тему...', delay: 0 },
  { text: '📝 Создаю уроки...', delay: 3000 },
  { text: '🧠 Составляю тесты...', delay: 7000 },
  { text: '✨ Финальная обработка...', delay: 12000 },
];

const AIGenerateModal = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1); // 1=input, 2=loading, 3=preview

  // Step 1 — inputs
  const [topic, setTopic] = useState('');
  const [lessonsCount, setLessonsCount] = useState(3);
  const [difficulty, setDifficulty] = useState('Базовый');
  const [category, setCategory] = useState('Сервис');
  const [generateImage, setGenerateImage] = useState(true);

  // Step 2 — loading
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0].text);
  const [error, setError] = useState('');

  // Step 3 — preview
  const [courseData, setCourseData] = useState(null);
  const [saving, setSaving] = useState(false);

  // ─── Generate Course ───────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Введите тему курса!');
      return;
    }

    setError('');
    setStep(2);
    setLoadingMsg(LOADING_MESSAGES[0].text);

    // Animated loading messages
    const timers = LOADING_MESSAGES.slice(1).map(msg =>
      setTimeout(() => setLoadingMsg(msg.text), msg.delay)
    );

    try {
      // 1. Generate course structure
      const data = await aiGenerateCourse({ topic, lessonsCount, difficulty, category });
      data.category = category;

      // 2. Try to generate cover image (non-blocking)
      if (generateImage) {
        try {
          setLoadingMsg('🎨 Генерирую обложку курса...');
          const imgResult = await aiGenerateImage({
            title: data.title,
            category,
            type: 'cover',
          });
          if (imgResult.image_url) {
            data.image_url = imgResult.image_url;
          }
        } catch (imgErr) {
          console.warn('[AI] Обложка не сгенерирована:', imgErr.message);
          // Non-critical — continue without image
        }
      }

      setCourseData(data);
      setStep(3);
    } catch (err) {
      console.error('[AI Generate]', err);
      setError(err.message || 'Произошла ошибка при генерации. Попробуйте ещё раз.');
      setStep(1);
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  // ─── Save Course to DB ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!courseData) return;
    setSaving(true);
    try {
      await adminCreateCourse({
        ...courseData,
        is_published: true,
      });
      onCreated();
    } catch (err) {
      console.error('[AI Save]', err);
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Restart ───────────────────────────────────────────────────────
  const handleRestart = () => {
    setCourseData(null);
    setError('');
    setStep(1);
  };

  const totalQuestions = courseData?.tests?.reduce(
    (acc, t) => acc + (t.questions?.length || 0), 0
  ) || 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={20} />
        </button>

        {/* ══════════ STEP 1: INPUT ══════════ */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.headerIcon} style={{ display: 'flex', justifyContent: 'center' }}>
                <FiZap size={36} color="var(--color-purple)" aria-hidden="true" />
              </div>
              <h2 className={styles.title}>Создание курса с помощью ИИ</h2>
              <p className={styles.subtitle}>
                Опишите тему курса, а искусственный интеллект создаст уроки, тесты и обложку за вас
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Тема курса *</label>
              <textarea
                className={styles.topicInput}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Винный этикет для официантов премиум-ресторана"
                rows={3}
              />
            </div>

            <div className={styles.optionsRow}>
              <div className={styles.optionGroup}>
                <label className={styles.label}>Количество уроков</label>
                <div className={styles.chips}>
                  {LESSONS_OPTIONS.map((n) => (
                    <button
                      key={n}
                      className={`${styles.chip} ${lessonsCount === n ? styles.chipActive : ''}`}
                      onClick={() => setLessonsCount(n)}
                    >
                      {n} уроков
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label className={styles.label}>Сложность</label>
                <div className={styles.chips}>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      className={`${styles.chip} ${difficulty === d ? styles.chipActive : ''}`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Категория</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={generateImage}
                onChange={(e) => setGenerateImage(e.target.checked)}
              />
              <span>Сгенерировать обложку курса (AI)</span>
            </label>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button className={styles.generateBtn} onClick={handleGenerate}>
              <FiZap size={18} />
              Сгенерировать курс
            </button>
          </div>
        )}

        {/* ══════════ STEP 2: LOADING ══════════ */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingOrb}>
                <div className={styles.orbInner} />
              </div>
              <p className={styles.loadingText}>{loadingMsg}</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} />
              </div>
              <p className={styles.loadingHint}>
                Обычно это занимает 15-30 секунд
              </p>
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: PREVIEW ══════════ */}
        {step === 3 && courseData && (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <div className={styles.headerIcon} style={{ display: 'flex', justifyContent: 'center' }}>
                <FiCheckCircle size={36} color="var(--color-success)" aria-hidden="true" />
              </div>
              <h2 className={styles.title}>Курс сгенерирован!</h2>
            </div>

            <div className={styles.previewCard}>
              {courseData.image_url && (
                <img
                  src={courseData.image_url}
                  alt="Cover"
                  className={styles.previewCover}
                />
              )}
              <h3 className={styles.previewTitle}>{courseData.title}</h3>
              <p className={styles.previewDesc}>{courseData.description}</p>

              <div className={styles.previewStats}>
                <div className={styles.stat}>
                  <FiBookOpen size={16} />
                  <span>{courseData.lessons?.length || 0} уроков</span>
                </div>
                <div className={styles.stat}>
                  <FiCheckCircle size={16} />
                  <span>{totalQuestions} вопросов в тесте</span>
                </div>
              </div>

              <div className={styles.lessonsList}>
                <p className={styles.lessonsListTitle}>Содержание:</p>
                {courseData.lessons?.map((l, i) => (
                  <div key={l.id || i} className={styles.lessonItem}>
                    <span className={styles.lessonOrder}>{i + 1}</span>
                    <span>{l.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <div className={styles.previewActions}>
              <button className={styles.restartBtn} onClick={handleRestart}>
                <FiRefreshCw size={16} /> Перегенерировать
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave size={16} /> {saving ? 'Сохранение...' : 'Сохранить курс'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIGenerateModal;
