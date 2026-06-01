import React, { useState, useEffect } from 'react';
import Navbar from '../../components/user/Navbar';
import { FiPlayCircle, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
    fetchInProgressCourses,
    fetchNewCourses,
    fetchArchivedCourses,
    resetArchivedCourse,
} from '../../services/api';
import styles from './Course.module.css';

const CoursesPage = () => {
    const [inProgressCourses, setInProgressCourses] = useState([]);
    const [newCourses, setNewCourses] = useState([]);
    const [archivedCourses, setArchivedCourses] = useState([]);
    const [activeTab, setActiveTab] = useState('in_progress');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const inProgress = (await fetchInProgressCourses()) || [];
            const newCoursesData = (await fetchNewCourses()) || [];
            const archived = (await fetchArchivedCourses()) || [];

            setInProgressCourses(inProgress);
            setNewCourses(newCoursesData);
            setArchivedCourses(archived);
        } catch (error) {
            console.error('Ошибка загрузки данных курсов:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResetCourse = async (courseId) => {
        if (!window.confirm('Вы уверены, что хотите сбросить прогресс и пройти этот курс заново?')) {
            return;
        }
        try {
            await resetArchivedCourse(courseId);
            alert('Прогресс курса сброшен! Теперь он доступен в разделе «Новые курсы».');
            // Перезагружаем данные
            await fetchData();
            setActiveTab('new');
        } catch (error) {
            alert(error.message || 'Ошибка восстановления курса');
        }
    };

    const renderCourses = (courses, actionLabel, actionHandler, isArchive = false) => {
        if (loading) {
            return (
                <div className={styles.loadingContainer}>
                    {[1, 2].map((i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonHeader}>
                                <div className={styles.skeletonImage}></div>
                                <div className={styles.skeletonTextWrapper}>
                                    <div className={styles.skeletonBar} style={{ width: '40%', height: '12px', marginBottom: '8px' }}></div>
                                    <div className={styles.skeletonBar} style={{ width: '80%', height: '18px', marginBottom: '8px' }}></div>
                                    <div className={styles.skeletonBar} style={{ width: '60%', height: '14px' }}></div>
                                </div>
                            </div>
                            <div className={styles.skeletonProgressSection}>
                                <div className={styles.skeletonBar} style={{ width: '100%', height: '6px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (!Array.isArray(courses) || courses.length === 0) {
            return (
                <div className={styles.noCoursesContainer}>
                    <p className={styles.noCourses}>Курсы не найдены</p>
                </div>
            );
        }

        return (
            <div className={styles.courseList}>
                {courses.map((course) => (
                    <div 
                        key={course.id} 
                        className={styles.courseCard} 
                        onClick={() => navigate(`/course/${course.id}`)}
                    >
                        <div className={styles.courseHeader}>
                            <div className={styles.courseImageWrapper}>
                                {course.image ? (
                                    <img 
                                        src={course.image} 
                                        alt={course.title} 
                                        className={styles.image} 
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #006ffd, #3b9eff)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '26px',
                                        color: '#fff',
                                        fontWeight: 700,
                                    }}>
                                        {(course.category || 'О')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className={styles.courseMeta}>
                                <span className={styles.courseCategory}>
                                    {course.category || 'Общее обучение'}
                                </span>
                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                {course.description && (
                                    <p className={styles.courseDescription}>{course.description}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles.courseProgressSection}>
                            <div className={styles.progressHeader}>
                                <span className={styles.progressLabel}>Прогресс</span>
                                <span className={styles.progressPercentage}>{course.progress || 0}%</span>
                            </div>
                            <div className={styles.courseProgressBar}>
                                <div
                                    className={styles.courseProgress}
                                    style={{ width: `${course.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.courseFooter}>
                            <button
                                className={`${styles.courseActionButton} ${isArchive ? styles.archiveButton : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actionHandler(course.id);
                                }}
                            >
                                {isArchive ? <FiRefreshCw size={16} /> : <FiPlayCircle size={18} />}
                                <span>{actionLabel}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Моё обучение</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab === 'in_progress' ? styles.activeTab : ''
                        }`}
                        onClick={() => setActiveTab('in_progress')}
                    >
                        В процессе
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab === 'new' ? styles.activeTab : ''
                        }`}
                        onClick={() => setActiveTab('new')}
                    >
                        Новые
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab === 'archive' ? styles.activeTab : ''
                        }`}
                        onClick={() => setActiveTab('archive')}
                    >
                        Пройденные
                    </button>
                </div>
            </div>

            <div className={styles.contentSection}>
                {activeTab === 'in_progress' &&
                    renderCourses(inProgressCourses, 'Продолжить обучение', (courseId) =>
                        navigate(`/course/${courseId}`)
                    )}
                {activeTab === 'new' &&
                    renderCourses(newCourses, 'Начать обучение', (courseId) =>
                        navigate(`/course/${courseId}`)
                    )}
                {activeTab === 'archive' &&
                    renderCourses(archivedCourses, 'Пройти заново', handleResetCourse, true)}
            </div>
            
            <Navbar />
        </div>
    );
};

export default CoursesPage;