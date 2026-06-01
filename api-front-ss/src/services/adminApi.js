// ─── Admin API Service (РЕАЛЬНЫЙ БЭКЕНД) ──────────────────────────────────────
// Все функции общаются напрямую с сервером Express + Neon PostgreSQL.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const activeRestaurantId = localStorage.getItem('active_restaurant_id');
  if (activeRestaurantId) {
    headers['X-Restaurant-Id'] = activeRestaurantId;
  }
  return headers;
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

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Доступ запрещен. Вы не являетесь администратором.');
  }

  localStorage.setItem('token', data.token);
  return { token: data.token, role: role.toLowerCase() };
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
    
    return (role === 'ADMIN' || role === 'SUPER_ADMIN') && !isExpired;
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

// ─── ADMIN MENU API ──────────────────────────────────────────────────────────
export const adminGetMenuCategories = async () => {
    const res = await fetch(`${API_URL}/admin/menu/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Ошибка загрузки категорий меню');
    return res.json();
};

export const adminCreateMenuCategory = async (data) => {
    const res = await fetch(`${API_URL}/admin/menu/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ошибка создания категории');
    return res.json();
};

export const adminCreateMenuItem = async (data) => {
    const res = await fetch(`${API_URL}/admin/menu/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ошибка создания блюда');
    return res.json();
};

export const adminUpdateMenuItem = async (id, data) => {
    const res = await fetch(`${API_URL}/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Ошибка обновления блюда');
    return res.json();
};

export const adminDeleteMenuItem = async (id) => {
    const res = await fetch(`${API_URL}/admin/menu/items/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка удаления блюда');
    return res.json();
};

export const adminGetMenuPdf = async () => {
    const res = await fetch(`${API_URL}/admin/menu/pdf`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Ошибка получения PDF меню');
    return res.json();
};

export const adminUploadMenuPdf = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // При загрузке файлов Content-Type не нужен (браузер сам ставит multipart/form-data)
    const headers = getHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${API_URL}/admin/menu/upload-pdf`, {
        method: 'POST',
        headers,
        body: formData
    });
    if (!res.ok) throw new Error('Ошибка загрузки PDF');
    return res.json();
};

export const adminDeleteMenuPdf = async () => {
    const res = await fetch(`${API_URL}/admin/menu/pdf`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка удаления PDF');
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
  const res = await fetch(`${API_URL}/org/positions`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка получения должностей');
  return res.json();
};

export const adminCreatePosition = async (name, department_id) => {
  const res = await fetch(`${API_URL}/org/positions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, department_id: department_id || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания должности');
  }
  return res.json();
};

export const adminUpdatePosition = async (id, data) => {
  const res = await fetch(`${API_URL}/org/positions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка обновления должности');
  }
  return res.json();
};

export const adminDeletePosition = async (id) => {
  const res = await fetch(`${API_URL}/org/positions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка удаления должности');
  return res.json();
};

// ─── Departments CRUD ────────────────────────────────────────────────────────

export const adminGetDepartments = async () => {
  const res = await fetch(`${API_URL}/org/departments`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка получения отделов');
  return res.json();
};

export const adminCreateDepartment = async (name) => {
  const res = await fetch(`${API_URL}/org/departments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания отдела');
  }
  return res.json();
};

export const adminUpdateDepartment = async (id, data) => {
  const res = await fetch(`${API_URL}/org/departments/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка обновления отдела');
  }
  return res.json();
};

export const adminDeleteDepartment = async (id) => {
  const res = await fetch(`${API_URL}/org/departments/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка удаления отдела');
  return res.json();
};

// ─── Restaurants CRUD (SUPER_ADMIN only) ─────────────────────────────────────

export const superAdminGetRestaurants = async () => {
  const res = await fetch(`${API_URL}/restaurants`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка получения ресторанов');
  return res.json();
};

export const superAdminGetRestaurant = async (id) => {
  const res = await fetch(`${API_URL}/restaurants/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ресторан не найден');
  return res.json();
};

export const superAdminCreateRestaurant = async ({ name, adminEmail, adminPassword, adminName }) => {
  const res = await fetch(`${API_URL}/restaurants`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, adminEmail, adminPassword, adminName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка создания ресторана');
  }
  return res.json();
};

export const superAdminUpdateRestaurant = async (id, data) => {
  const res = await fetch(`${API_URL}/restaurants/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка обновления ресторана');
  }
  return res.json();
};

export const superAdminDeleteRestaurant = async (id) => {
  const res = await fetch(`${API_URL}/restaurants/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка удаления ресторана');
  return res.json();
};

// ─── Helper: get current user role from token ────────────────────────────────

export const getCurrentRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return String(decoded.role).toUpperCase();
  } catch {
    return null;
  }
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

// ─── AI Generation ────────────────────────────────────────────────────────────

export const aiGenerateCourse = async ({ topic, lessonsCount, difficulty, category }) => {
  const res = await fetch(`${API_URL}/admin/ai/generate-course`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ topic, lessonsCount, difficulty, category }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка генерации курса');
  }
  return res.json();
};

export const aiGenerateImage = async ({ title, category, type }) => {
  const res = await fetch(`${API_URL}/admin/ai/generate-image`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title, category, type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка генерации изображения');
  }
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const adminGetAchievements = async () => {
  const res = await fetch(`${API_URL}/admin/achievements`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка загрузки достижений');
  return res.json();
};

export const adminCreateAchievement = async (data) => {
  const res = await fetch(`${API_URL}/admin/achievements`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Ошибка создания достижения');
  return res.json();
};

export const adminUpdateAchievement = async (id, data) => {
  const res = await fetch(`${API_URL}/admin/achievements/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Ошибка обновления достижения');
  return res.json();
};

export const adminDeleteAchievement = async (id) => {
  const res = await fetch(`${API_URL}/admin/achievements/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Ошибка удаления достижения');
  return res.json();
};

export const adminGrantAchievement = async (id, user_id) => {
  const res = await fetch(`${API_URL}/admin/achievements/${id}/grant`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ user_id }),
  });
  if (!res.ok) throw new Error('Ошибка выдачи достижения');
  return res.json();
};

export const isSuperAdminAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    let payloadStr = token;
    if (token.includes('.')) {
      payloadStr = token.split('.')[1];
    }
    const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    
    const role = String(decoded.role).toUpperCase();
    const exp = decoded.exp;
    
    if (role !== 'SUPER_ADMIN') return false;
    if (exp && Date.now() >= exp * 1000) {
      localStorage.removeItem('token');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};
