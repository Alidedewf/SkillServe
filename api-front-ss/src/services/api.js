const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const loginUser = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Неверный email или пароль');
    }
    return res.json();
};

export const fetchHomePage = async (token) => {
    const resProfile = await fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resProfile.ok) throw new Error('Ошибка получения профиля');
    const user = await resProfile.json();

    const resCourses = await fetch(`${API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resCourses.ok) throw new Error('Ошибка получения курсов');
    const courses = await resCourses.json();

    return {
        user: {
            name: user.name,
            progress: { percentage: user.progress || 0 },
            avatar: user.avatar_url
        },
        courses: courses
    };
};

export const resetPasswordRequest = async (email) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка запроса на сброс пароля');
    }
    return res.json();
};

export const verifyCode = async (email, code) => {
    const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Некорректный код подтверждения');
    }
    return res.json();
};

export const changePassword = async (newPassword) => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ password: newPassword })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка изменения пароля');
    }
    return res.json();
};

export const fetchInProgressCourses = async () => {
    const res = await fetch(`${API_URL}/courses/in-progress`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения активных курсов');
    return res.json();
};

export const fetchNewCourses = async () => {
    const res = await fetch(`${API_URL}/courses/new`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения новых курсов');
    return res.json();
};

export const fetchArchivedCourses = async () => {
    const res = await fetch(`${API_URL}/courses/archived`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения архивных курсов');
    return res.json();
};

export const resetArchivedCourse = async (courseId) => {
    const res = await fetch(`${API_URL}/courses/${courseId}/reset`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка сброса прогресса курса');
    return res.json();
};

export const fetchCourseName = async (courseId) => {
    const res = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения названия курса');
    const course = await res.json();
    return { course_name: course.title };
};

export const fetchLessons = async (courseId) => {
    const res = await fetch(`${API_URL}/courses/${courseId}/lessons`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения уроков');
    return res.json();
};

export const fetchTests = async (courseId) => {
    const res = await fetch(`${API_URL}/courses/${courseId}/tests`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения тестов');
    return res.json();
};

export const fetchLessonContent = async (lessonId) => {
    const res = await fetch(`${API_URL}/lessons/${lessonId}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения контента урока');
    return res.json();
};

export const fetchRating = async () => {
    const res = await fetch(`${API_URL}/rating`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения рейтинга');
    return res.json();
};

export const fetchLesson = async (courseID, lessonID) => {
    const res = await fetch(`${API_URL}/lessons/${lessonID}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения урока');
    return res.json();
};

export const completeLesson = async (lessonID) => {
    const res = await fetch(`${API_URL}/lessons/${lessonID}/complete`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка завершения урока');
    return res.json();
};

export const startTest = async (courseID, testID) => {
    const res = await fetch(`${API_URL}/tests/${testID}`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка запуска теста');
    return res.json();
};

export const submitTest = async (courseID, testID, payload) => {
    const res = await fetch(`${API_URL}/tests/${testID}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Ошибка отправки результатов теста');
    return res.json();
};

export const fetchUserProfile = async () => {
    const res = await fetch(`${API_URL}/users/profile`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения профиля');
    return res.json();
};

export const fetchUserNotifications = async () => {
    const res = await fetch(`${API_URL}/users/notifications`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения уведомлений');
    return res.json();
};

export const fetchAchievements = async () => {
    const res = await fetch(`${API_URL}/achievements`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения достижений');
    return res.json();
};

export const fetchMyAchievements = async () => {
    const res = await fetch(`${API_URL}/achievements/my`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения моих достижений');
    return res.json();
};

export const fetchAchievementIcons = async () => {
    const res = await fetch(`${API_URL}/achievements/icons`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения списка иконок');
    return res.json();
};

export const fetchMenu = async () => {
    const res = await fetch(`${API_URL}/menu`, {
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка загрузки меню');
    return res.json();
};