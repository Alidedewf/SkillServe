import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './TestPage.module.css';
import {startTest, submitTest} from '../../services/api'; // API для старта теста

const TestPage = () => {
    const { courseID, testID } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(300); // 5 минут (300 секунд)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTest = async () => {
            setLoading(true);
            try {
                const fetchedTest = await startTest(courseID, testID);
                setTest(fetchedTest);
                setTimeRemaining(300); // Устанавливаем время теста
            } catch (err) {
                console.error('Ошибка загрузки теста:', err);
                setError('Не удалось загрузить тест');
            } finally {
                setLoading(false);
            }
        };

        loadTest();
    }, [courseID, testID]);

    useEffect(() => {
        if (timeRemaining <= 0) {
            // Если время истекло
            alert('Время теста истекло!');
            navigate(`/course/${courseID}`);
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer); // Чистим таймер при размонтировании
    }, [timeRemaining, navigate, courseID]);

    // Одиночный выбор (SINGLE / TRUE_FALSE / SCENARIO)
    const handleAnswerSelect = (questionID, answerID) => {
        setSelectedAnswers((prev) => ({ ...prev, [questionID]: answerID }));
    };

    // Несколько вариантов (MULTIPLE)
    const handleMultiToggle = (questionID, answerID) => {
        setSelectedAnswers((prev) => {
            const cur = Array.isArray(prev[questionID]) ? prev[questionID] : [];
            const next = cur.includes(answerID) ? cur.filter((id) => id !== answerID) : [...cur, answerID];
            return { ...prev, [questionID]: next };
        });
    };

    // Сопоставление (MATCHING)
    const handleMatchSelect = (questionID, answerID, target) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionID]: { ...(prev[questionID] || {}), [answerID]: target },
        }));
    };

    const TYPE_LABELS = {
        SINGLE: 'Одиночный выбор',
        TRUE_FALSE: 'Верно / Неверно',
        SCENARIO: 'Ситуация',
        MULTIPLE: 'Несколько вариантов',
        MATCHING: 'Сопоставление',
    };

    // Отвечен ли вопрос (с учётом типа)
    const isAnswered = (q) => {
        const v = selectedAnswers[q.id];
        if (q.type === 'MULTIPLE') return Array.isArray(v) && v.length > 0;
        if (q.type === 'MATCHING') return v && Object.keys(v).length === q.answers.length;
        return v !== undefined && v !== null;
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            alert('Вы завершили тест!');
            navigate(`/course/${courseID}/results`);
        }
    };

    const handleFinishTest = async () => {
        try {
            const qById = new Map(test.questions.map((q) => [String(q.id), q]));
            const answers = Object.entries(selectedAnswers).map(([question_id, val]) => {
                const type = qById.get(String(question_id))?.type || 'SINGLE';
                if (type === 'MULTIPLE') {
                    return { question_id, answer_ids: Array.isArray(val) ? val : [] };
                }
                if (type === 'MATCHING') {
                    return { question_id, matches: Object.entries(val || {}).map(([answer_id, target]) => ({ answer_id, target })) };
                }
                return { question_id, answer_id: val };
            });
            const results = await submitTest(courseID, testID, { answers });
            navigate(`/course/${courseID}/test/${testID}/results`, { state: results });
        } catch (error) {
            console.error('Ошибка завершения теста:', error);
            alert('Ошибка отправки теста. Попробуйте еще раз.');
        }
    };

    if (loading) {
        return (
            <div className={`${styles.container} ${styles.skeletonContainer}`}>
                {/* Header skeleton */}
                <div className={styles.headerSkeleton}>
                    <div className={styles.skeletonCircle}></div>
                    <div className={styles.skeletonBar} style={{ width: '40%', height: '18px' }}></div>
                    <div className={styles.skeletonBar} style={{ width: '15%', height: '18px' }}></div>
                </div>

                {/* Card skeleton */}
                <div className={styles.cardSkeleton}>
                    {/* Image placeholder */}
                    <div className={styles.skeletonImage}></div>
                    
                    {/* Type placeholder */}
                    <div className={styles.skeletonBar} style={{ width: '30%', height: '14px', marginBottom: '16px' }}></div>
                    
                    {/* Question text placeholders */}
                    <div className={styles.skeletonBar} style={{ width: '90%', height: '22px', marginBottom: '12px' }}></div>
                    <div className={styles.skeletonBar} style={{ width: '70%', height: '22px', marginBottom: '32px' }}></div>

                    {/* Answer options placeholders */}
                    <div className={styles.answersSkeleton}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={styles.skeletonAnswerOption}>
                                <div className={styles.skeletonCircle} style={{ width: '20px', height: '20px' }}></div>
                                <div className={styles.skeletonBar} style={{ width: '60%', height: '16px' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <p className={styles.error}>{error}</p>;
    }

    const currentQuestion = test.questions[currentQuestionIndex];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(`/course/${courseID}`)} className={styles.closeButton}>
                    ✕
                </button>
                <div className={styles.progress}>
                    Вопрос {currentQuestionIndex + 1}/{test.questions.length}
                </div>
                <div className={styles.timer}>
                    {Math.floor(timeRemaining / 60)}:{timeRemaining % 60 < 10 ? '0' : ''}
                    {timeRemaining % 60}
                </div>
            </div>
    
            <div className={styles.questionCard}>
                {currentQuestion.image_url && (
                    <img
                        src={currentQuestion.image_url}
                        alt="Вопрос"
                        className={styles.questionImage}
                    />
                )}
                <p className={styles.questionType}>
                    {TYPE_LABELS[currentQuestion.type] || TYPE_LABELS.SINGLE}
                    {currentQuestion.type === 'MULTIPLE' && ' · можно выбрать несколько'}
                </p>
                <p className={styles.question}>{currentQuestion.content}</p>
                <div className={styles.answers}>
                    {currentQuestion.type === 'MATCHING' ? (
                        currentQuestion.answers.map((answer) => {
                            const sel = selectedAnswers[currentQuestion.id] || {};
                            return (
                                <div key={answer.id} className={styles.matchRow}>
                                    <span className={styles.matchLeft}>{answer.content}</span>
                                    <select
                                        className={styles.matchSelect}
                                        value={sel[answer.id] || ''}
                                        onChange={(e) => handleMatchSelect(currentQuestion.id, answer.id, e.target.value)}
                                    >
                                        <option value="" disabled>— выберите —</option>
                                        {(currentQuestion.match_targets || []).map((t, i) => (
                                            <option key={i} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })
                    ) : currentQuestion.type === 'MULTIPLE' ? (
                        currentQuestion.answers.map((answer) => {
                            const sel = selectedAnswers[currentQuestion.id];
                            const checked = Array.isArray(sel) && sel.includes(answer.id);
                            return (
                                <label key={answer.id} className={`${styles.answerLabel} ${checked ? styles.selected : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleMultiToggle(currentQuestion.id, answer.id)}
                                        className={styles.radioInput}
                                    />
                                    <span className={styles.customRadio}></span>
                                    <span className={styles.answerText}>{answer.content}</span>
                                </label>
                            );
                        })
                    ) : (
                        currentQuestion.answers.map((answer) => (
                            <label
                                key={answer.id}
                                className={`${styles.answerLabel} ${selectedAnswers[currentQuestion.id] === answer.id ? styles.selected : ''}`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${currentQuestion.id}`}
                                    value={answer.id}
                                    checked={selectedAnswers[currentQuestion.id] === answer.id}
                                    onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                                    className={styles.radioInput}
                                />
                                <span className={styles.customRadio}></span>
                                <span className={styles.answerText}>{answer.content}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>
                
                <div className={styles.actions}>
    {isAnswered(currentQuestion) ? (
        currentQuestionIndex < test.questions.length - 1 ? (
            <button className={styles.nextButton} onClick={handleNextQuestion}>
                Следующий вопрос
            </button>
        ) : (
            <button className={styles.finishButton} onClick={handleFinishTest}>
                Завершить тест
            </button>
        )
    ) : null}
</div>
        </div>
    );    
};

export default TestPage;