import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LessonPage.module.css';
import { FiArrowLeft, FiClock, FiBookOpen } from 'react-icons/fi';
import { fetchLesson, completeLesson } from '../../services/api';

const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        if (url.includes('youtube.com/embed/')) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
        if (url.includes('player.vimeo.com/video/')) return url;
        const match = url.match(/vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/|album\/[^/]+\/video\/|showcase\/[^/]+\/video\/)?([0-9]+)/);
        if (match && match[1]) {
            return `https://player.vimeo.com/video/${match[1]}`;
        }
    }
    
    return url;
};

const LessonPage = () => {
    const { courseID, lessonID } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadLesson = async () => {
            setLoading(true);
            try {
                const fetchedLesson = await fetchLesson(courseID, lessonID);
                setLesson(fetchedLesson);
            } catch (err) {
                console.error('Ошибка загрузки урока:', err);
                setError('Не удалось загрузить урок');
            } finally {
                setLoading(false);
            }
        };

        loadLesson();
    }, [courseID, lessonID]);

    const handleBackClick = () => {
        navigate(-1);
    };

    const handleComplete = async () => {
        try {
            await completeLesson(lessonID);
        } catch (err) {
            console.error('Ошибка завершения урока:', err);
        }
        navigate(`/course/${courseID}`);
    };

    // Считаем примерное время чтения (200 слов/мин)
    const getReadingTime = (blocks) => {
        if (!blocks) return 0;
        const totalWords = blocks.reduce((acc, b) => {
            if (b.type === 'text' && b.content) {
                return acc + b.content.split(/\s+/).length;
            }
            return acc;
        }, 0);
        return Math.max(1, Math.ceil(totalWords / 200));
    };

    // Форматируем текст: пустые строки → разделение на абзацы
    const renderTextContent = (content) => {
        if (!content) return null;

        // Разбиваем по двойным переводам строк (абзацы)
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

        return paragraphs.map((paragraph, i) => {
            const trimmed = paragraph.trim();

            // Если строка короткая и без точки на конце — возможно это подзаголовок
            const isHeading = trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith(':');

            if (isHeading && i > 0) {
                return (
                    <h3 key={i} className={styles.subHeading}>
                        {trimmed}
                    </h3>
                );
            }

            // Обычный абзац — разбиваем по одинарным \n
            const lines = trimmed.split('\n').filter(l => l.trim());
            return (
                <p key={i} className={styles.paragraph}>
                    {lines.map((line, j) => (
                        <React.Fragment key={j}>
                            {line.trim()}
                            {j < lines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
            );
        });
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.topBar}>
                    <button onClick={handleBackClick} className={styles.backButton}>
                        <FiArrowLeft size={20} />
                    </button>
                </div>
                <div className={styles.article}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonMeta}></div>
                    <div className={styles.skeletonDivider}></div>
                    <div className={styles.skeletonBlock}>
                        <div className={styles.skeletonLine} style={{width: '95%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '100%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '80%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '88%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '65%'}}></div>
                    </div>
                    <div className={styles.skeletonBlock}>
                        <div className={styles.skeletonLine} style={{width: '90%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '100%'}}></div>
                        <div className={styles.skeletonLine} style={{width: '72%'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <p className={styles.error}>{error}</p>;
    }

    const readingTime = getReadingTime(lesson.blocks);

    return (
        <div className={styles.page}>
            {/* ─── Top Bar ──────────────────────────────── */}
            <div className={styles.topBar}>
                <button onClick={handleBackClick} className={styles.backButton}>
                    <FiArrowLeft size={20} />
                </button>
                <span className={styles.topBarTitle}>Урок</span>
                <div style={{width: 36}}></div> {/* spacer */}
            </div>

            {/* ─── Article ─────────────────────────────── */}
            <article className={styles.article}>
                <h1 className={styles.lessonTitle}>{lesson.title}</h1>

                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <FiClock size={14} />
                        {readingTime} мин чтения
                    </span>
                    <span className={styles.metaItem}>
                        <FiBookOpen size={14} />
                        {lesson.blocks?.length || 0} блоков
                    </span>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.content}>
                    {lesson.blocks && lesson.blocks.map((block, idx) => (
                        <div key={block.order || idx} className={styles.block}>
                            {block.type === 'text' && (
                                <div className={styles.textBlock}>
                                    {renderTextContent(block.content)}
                                </div>
                            )}
                            {block.type === 'video' && (
                                <div className={styles.videoBlock}>
                                    <div className={styles.videoWrapper}>
                                        {block.content.includes('youtube.com') || block.content.includes('youtu.be') || block.content.includes('vimeo.com') ? (
                                            <iframe
                                                src={getEmbedUrl(block.content)}
                                                title="Lesson Video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <video 
                                                controls 
                                                src={block.content} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                                            ></video>
                                        )}
                                    </div>
                                </div>
                            )}
                            {block.type === 'image' && (
                                <div className={styles.imageBlock}>
                                    <img src={block.content} alt="Lesson illustration" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </article>

            {/* ─── Footer ──────────────────────────────── */}
            <div className={styles.footer}>
                <button className={styles.completeButton} onClick={handleComplete}>
                    Завершить урок
                </button>
            </div>
        </div>
    );
};

export default LessonPage;