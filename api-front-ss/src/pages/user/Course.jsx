import React, { useState, useEffect } from 'react';
import Navbar from '../../components/user/Navbar';
import { FiPlayCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
    fetchInProgressCourses,
    fetchNewCourses,
    fetchArchivedCourses,
    resetArchivedCourse,
} from '../../services/api';
import styles from './CoursePage.module.css';

const CoursesPage = () => {
    const [inProgressCourses, setInProgressCourses] = useState([]);
    const [newCourses, setNewCourses] = useState([]);
    const [archivedCourses, setArchivedCourses] = useState([]);
    const [activeTab, setActiveTab] = useState('in_progress');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const inProgress = (await fetchInProgressCourses()) || [];
                const newCourses = (await fetchNewCourses()) || [];
                const archived = (await fetchArchivedCourses()) || [];

                setInProgressCourses(inProgress);
                setNewCourses(newCourses);
                setArchivedCourses(archived);
            } catch (error) {
                console.error('Ошибка загрузки данных курсов:', error);
            }
        };

        fetchData();
    }, []);

    const handleResetCourse = async (courseId) => {
        try {
            await resetArchivedCourse(courseId);
            alert('Курс был успешно восстановлен!');
            setArchivedCourses((prevCourses) =>
                prevCourses.filter((course) => course.id !== courseId)
            );
        } catch (error) {
            alert(error.message || 'Ошибка восстановления курса');
        }
    };

    const renderCourses = (courses, actionLabel, actionHandler) => {
        if (!Array.isArray(courses) || courses.length === 0) {
            return <p className={styles.noCourses}>Курсы не найдены</p>; // Сообщение, если курсов нет
        }

        return (
            <div className={styles.courseList}>
                {courses.map((course) => (
                    <div key={course.id} className={styles.courseCard}>
                        <div className={styles.courseImage}>
                            <img src={course.image} alt={course.title} className={styles.image} />
                        </div>
                        <div className={styles.courseDetails}>
                            <h3 className={styles.courseTitle}>{course.title}</h3>
                            <span className={styles.progress_span}>{course.progress}%</span>
                            <div className={styles.courseProgressBar}>
                                <div
                                    className={styles.courseProgress}
                                    style={{ width: `${course.progress || 0}%` }}
                                />
                            </div>
                            {actionHandler && (
                                <button
                                    className={styles.courseActionButton}
                                    onClick={() => actionHandler(course.id)}
                                >
                                    <FiPlayCircle size={20} className={styles.icon} />
                                    {actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {activeTab === 'in_progress'
                        ? 'Курсы в процессе'
                        : activeTab === 'new'
                            ? 'Новые курсы'
                            : 'Архивные курсы'}
                </h1>
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
                        Новые курсы
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab === 'archive' ? styles.activeTab : ''
                        }`}
                        onClick={() => setActiveTab('archive')}
                    >
                        Архивные курсы
                    </button>
                </div>
                <footer>        <Navbar />
                </footer>
            </div>

            {activeTab === 'in_progress' &&
                renderCourses(inProgressCourses, 'Продолжить обучение', (courseId) =>
                    navigate(`/course/${courseId}`)
                )}
            {activeTab === 'new' &&
                renderCourses(newCourses, 'Начать обучение', (courseId) =>
                    navigate(`/course/${courseId}`)
                )}
            {activeTab === 'archive' &&
                renderCourses(archivedCourses, 'Запрос на восстановление', handleResetCourse)}
        </div>


    );
};

export default CoursesPage;