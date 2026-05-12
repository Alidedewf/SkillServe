import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './LessonPage.module.css';
import { FiArrowLeft } from 'react-icons/fi';
import { fetchLesson } from '../../services/api'; // Функция для получения данных урока

const LessonPage = () => {
    const { courseID, lessonID } = useParams(); // Получаем ID курса и урока из URL
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadLesson = async () => {
            setLoading(true);
            try {
                const fetchedLesson = await fetchLesson(courseID, lessonID); // Получаем данные урока
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
        navigate(-1); // Возвращаемся на предыдущую страницу
    };

    if (loading) {
        return <p className={styles.loading}>Загрузка...</p>;
    }

    if (error) {
        return <p className={styles.error}>{error}</p>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={handleBackClick} className={styles.backButton}>
                    <FiArrowLeft size={20} />
                    <span>Назад</span>
                </button>
            </div>
            
            <div className={styles.progressHeader}>
                <h1 className={styles.lessonTitle}>{lesson.title}</h1>
            </div>

            <div className={styles.content}>
                {lesson.blocks && lesson.blocks.map((block) => (
                    <div key={block.order} className={styles.block}>
                        {block.type === 'text' && (
                            <div className={styles.textBlock}>
                                {block.content.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        )}
                        {block.type === 'video' && (
                            <div className={styles.videoBlock}>
                                <div className={styles.videoWrapper}>
                                    {block.content.includes('youtube.com') || block.content.includes('vimeo.com') ? (
                                        <iframe
                                            src={block.content}
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

            <div className={styles.footer}>
                <button className={styles.completeButton} onClick={handleBackClick}>
                    Завершить урок
                </button>
            </div>
        </div>
    );
};

export default LessonPage;