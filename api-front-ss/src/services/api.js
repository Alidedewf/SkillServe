import { apiRequest } from './apiClient';

export const loginUser = async (email, password) => {
    return apiRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email, password }
    });
};

// Выход: сбрасываем httpOnly-cookie на сервере и чистим claims в localStorage.
export const logoutUser = async () => {
    localStorage.removeItem('auth');
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
        console.warn('[auth] Запрос logout не прошёл:', err.message);
    }
};

export const fetchHomePage = async () => {
    // Авторизация идёт по httpOnly-cookie (credentials: 'include' в apiClient).
    const [user, courses] = await Promise.all([
        apiRequest('/users/profile'),
        apiRequest('/courses')
    ]);

    return {
        user: {
            name: user.name,
            progress: { percentage: user.progress || 0 },
            avatar: user.avatar_url,
            restaurant: user.restaurant
        },
        courses: courses
    };
};

export const resetPasswordRequest = async (email) => {
    return apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { email }
    });
};

export const verifyCode = async (email, code) => {
    return apiRequest('/auth/verify-code', {
        method: 'POST',
        body: { email, code }
    });
};

export const changePassword = async (newPassword) => {
    return apiRequest('/auth/change-password', {
        method: 'POST',
        body: { password: newPassword }
    });
};

export const fetchInProgressCourses = () => apiRequest('/courses/in-progress');
export const fetchNewCourses = () => apiRequest('/courses/new');
export const fetchArchivedCourses = () => apiRequest('/courses/archived');

export const resetArchivedCourse = (courseId) => {
    return apiRequest(`/courses/${courseId}/reset`, { method: 'POST' });
};

export const fetchCourseName = async (courseId) => {
    const course = await apiRequest(`/courses/${courseId}`);
    return { course_name: course.title };
};

export const fetchLessons = (courseId) => apiRequest(`/courses/${courseId}/lessons`);
export const fetchTests = (courseId) => apiRequest(`/courses/${courseId}/tests`);
export const fetchRating = () => apiRequest('/rating');
export const fetchLesson = (courseID, lessonID) => apiRequest(`/lessons/${lessonID}`);

export const completeLesson = (lessonID) => {
    return apiRequest(`/lessons/${lessonID}/complete`, { method: 'POST' });
};

export const startTest = (courseID, testID) => apiRequest(`/tests/${testID}`);

export const submitTest = (courseID, testID, payload) => {
    return apiRequest(`/tests/${testID}/submit`, {
        method: 'POST',
        body: payload
    });
};

export const fetchUserProfile = () => apiRequest('/users/profile');

export const updateUserProfile = (payload) => {
    return apiRequest('/users/profile', {
        method: 'PATCH',
        body: payload
    });
};

export const fetchUserNotifications = () => apiRequest('/users/notifications');
export const fetchAchievements = () => apiRequest('/achievements');
export const fetchMyAchievements = () => apiRequest('/achievements/my');
export const fetchAchievementIcons = () => apiRequest('/achievements/icons');
export const fetchMenu = () => apiRequest('/menu');