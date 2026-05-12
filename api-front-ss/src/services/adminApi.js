// ─── Admin API Service (РЕАЛЬНЫЙ БЭКЕНД) ──────────────────────────────────────
// Все функции общаются напрямую с сервером Express + Neon PostgreSQL.

const API_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const adminLogin = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Неверный email или пароль');
  }

  const data = await res.json();
  const role = String(data.user?.role).toUpperCase();

  if (role !== 'ADMIN') {
    throw new Error('Доступ запрещен. Вы не являетесь администратором.');
  }

  localStorage.setItem('token', data.token);
  return { token: data.token, role: 'admin' };
};

export const adminLogout = () => {
  localStorage.removeItem('token');
};

export const getAdminToken = () => localStorage.getItem('token');

export const isAdminAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    let payloadStr = token;
    if (token.includes('.')) {
      payloadStr = token.split('.')[1];
    }
    // Заменяем base64url символы на стандартный base64
    const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    
    const role = String(decoded.role).toUpperCase();
    const exp = decoded.exp;
    
    // Проверка на истечение токена (exp в JWT идет в секундах, а Date.now() в мс)
    const isExpired = exp ? (exp * 1000 < Date.now()) : false;
    
    return role === 'ADMIN' && !isExpired;
  } catch (err) {
    console.error('[isAdminAuthenticated] Error decoding token:', err);
    return false;
  }
};

// ─── Users CRUD ──────────────────────────────────────────────────────────────

export const adminGetUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка получения сотрудников');
  }
  return res.json();
};

export const adminGetUser = async (id) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Пользователь не найден');
  }
  return res.json();
};

export const adminCreateUser = async (userData) => {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка создания сотрудника');
  }
  return res.json();
};

export const adminUpdateUser = async (id, userData) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка обновления сотрудника');
  }
  return res.json();
};

export const adminDeleteUser = async (id) => {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка удаления сотрудника');
  }
  return res.json();
};

// ─── Courses CRUD ─────────────────────────────────────────────────────────────

export const adminGetCourses = async () => {
  const res = await fetch(`${API_URL}/admin/courses`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка получения курсов');
  }
  return res.json();
};

export const adminGetCourse = async (id) => {
  // Если создается новый курс
  if (id === 'new') {
    return {
      title: '',
      description: '',
      category: 'Сервис',
      image_url: '',
      is_published: true,
      lessons: [],
      tests: []
    };
  }

  const res = await fetch(`${API_URL}/admin/courses/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Курс не найден в БД');
  }
  return res.json();
};

export const adminCreateCourse = async (courseData) => {
  const res = await fetch(`${API_URL}/admin/courses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(courseData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка сохранения нового курса');
  }
  return res.json();
};

export const adminUpdateCourse = async (id, courseData) => {
  const res = await fetch(`${API_URL}/admin/courses/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(courseData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка сохранения изменений');
  }
  return res.json();
};

export const adminDeleteCourse = async (id) => {
  const res = await fetch(`${API_URL}/admin/courses/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка удаления курса');
  }
  return res.json();
};

// ─── Lessons CRUD ─────────────────────────────────────────────────────────────
// Эти методы на фронтенде не используются напрямую в новых версиях (весь курс сохраняется в куче),
// но мы их оставим заглушками для обратной совместимости, если где-то вызовутся.

export const adminCreateLesson = async (courseId, lessonData) => {
  return { ...lessonData, id: Date.now() };
};

export const adminUpdateLesson = async (courseId, lessonId, lessonData) => {
  return { ...lessonData, id: lessonId };
};

export const adminDeleteLesson = async (courseId, lessonId) => {
  return { message: 'OK' };
};

// ─── Tests CRUD ───────────────────────────────────────────────────────────────

export const adminCreateTest = async (courseId, testData) => {
  return { ...testData, id: Date.now() };
};

export const adminUpdateTest = async (courseId, testId, testData) => {
  return { ...testData, id: testId };
};

export const adminDeleteTest = async (courseId, testId) => {
  return { message: 'OK' };
};

// ─── Positions CRUD ──────────────────────────────────────────────────────────

export const adminGetPositions = async () => {
  return [
    { id: 'p1', name: 'Официант' },
    { id: 'p2', name: 'Бармен' },
    { id: 'p3', name: 'Повар' },
    { id: 'p4', name: 'Администратор' },
    { id: 'p5', name: 'Хостес' }
  ];
};

export const adminCreatePosition = async (name) => {
  return { id: Date.now().toString(), name };
};

export const adminDeletePosition = async (id) => {
  return { message: 'OK' };
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const adminGetStats = async () => {
  const res = await fetch(`${API_URL}/admin/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ошибка получения статистики');
  }
  return res.json();
};
