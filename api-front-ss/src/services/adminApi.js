import { apiRequest } from './apiClient';

// ─── Auth & Helpers ──────────────────────────────────────────────────────────
// Сам JWT живёт в httpOnly-cookie и недоступен JS (защита от XSS). В localStorage
// под ключом 'auth' храним ТОЛЬКО несекретные claims (id, role, exp) — нужны
// исключительно для клиентских route-гвардов. Доступа к API они не дают:
// реальная авторизация выполняется по cookie на стороне сервера.

const AUTH_KEY = 'auth';

export const setAuth = (user, expiresAt) => {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ id: user.id, role: user.role, exp: expiresAt })
  );
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('active_restaurant_id');
  localStorage.removeItem('active_restaurant_name');
};

// Имя decodeToken сохранено для обратной совместимости с гвардами,
// но теперь читает claims из localStorage, а не декодирует JWT.
export const decodeToken = () => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('[auth] Не удалось прочитать claims:', err);
    return null;
  }
};

export const adminLogin = async (email, password) => {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email, password },
  });

  const role = String(data.user?.role).toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Доступ запрещен. Вы не являетесь администратором.');
  }

  setAuth(data.user, data.expiresAt);
  return { role: role.toLowerCase() };
};

export const adminLogout = async () => {
  clearAuth(); // синхронно чистим клиентское состояние (до сетевого запроса)
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('[auth] Запрос logout не прошёл:', err.message);
  }
};

export const isAdminAuthenticated = () => {
  const decoded = decodeToken();
  if (!decoded) return false;

  const role = String(decoded.role).toUpperCase();
  const exp = decoded.exp;

  // exp в JWT идёт в секундах, а Date.now() в мс
  const isExpired = exp ? (exp * 1000 < Date.now()) : false;

  return (role === 'ADMIN' || role === 'SUPER_ADMIN') && !isExpired;
};

export const isSuperAdminAuthenticated = () => {
  const decoded = decodeToken();
  if (!decoded) return false;

  const role = String(decoded.role).toUpperCase();
  const exp = decoded.exp;

  if (role !== 'SUPER_ADMIN') return false;
  if (exp && Date.now() >= exp * 1000) {
    clearAuth();
    return false;
  }
  return true;
};

export const getCurrentRole = () => {
  const decoded = decodeToken();
  return decoded ? String(decoded.role).toUpperCase() : null;
};

// ─── Users CRUD ──────────────────────────────────────────────────────────────

export const adminGetUsers = () => apiRequest('/admin/users');
export const adminGetUser = (id) => apiRequest(`/admin/users/${id}`);

export const adminCreateUser = (userData) => {
  return apiRequest('/admin/users', {
    method: 'POST',
    body: userData,
  });
};

export const adminUpdateUser = (id, userData) => {
  return apiRequest(`/admin/users/${id}`, {
    method: 'PUT',
    body: userData,
  });
};

export const adminDeleteUser = (id) => {
  return apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
};

// ─── Courses CRUD ─────────────────────────────────────────────────────────────

export const adminGetCourses = () => apiRequest('/admin/courses');

export const adminGetCourse = (id) => {
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
  return apiRequest(`/admin/courses/${id}`);
};

export const adminCreateCourse = (courseData) => {
  return apiRequest('/admin/courses', {
    method: 'POST',
    body: courseData,
  });
};

export const adminUpdateCourse = (id, courseData) => {
  return apiRequest(`/admin/courses/${id}`, {
    method: 'PUT',
    body: courseData,
  });
};

export const adminDeleteCourse = (id) => {
  return apiRequest(`/admin/courses/${id}`, { method: 'DELETE' });
};



// ─── Positions CRUD ──────────────────────────────────────────────────────────

export const adminGetPositions = () => apiRequest('/org/positions');

export const adminCreatePosition = (name, department_id) => {
  return apiRequest('/org/positions', {
    method: 'POST',
    body: { name, department_id: department_id || null },
  });
};

export const adminUpdatePosition = (id, data) => {
  return apiRequest(`/org/positions/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const adminDeletePosition = (id) => {
  return apiRequest(`/org/positions/${id}`, { method: 'DELETE' });
};

// ─── Departments CRUD ────────────────────────────────────────────────────────

export const adminGetDepartments = () => apiRequest('/org/departments');

export const adminCreateDepartment = (name) => {
  return apiRequest('/org/departments', {
    method: 'POST',
    body: { name },
  });
};

export const adminUpdateDepartment = (id, data) => {
  return apiRequest(`/org/departments/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const adminDeleteDepartment = (id) => {
  return apiRequest(`/org/departments/${id}`, { method: 'DELETE' });
};

export const adminReorderOrgStructure = (data) => {
  return apiRequest('/org/departments/reorder', {
    method: 'PATCH',
    body: data,
  });
};

// ─── Restaurants CRUD (SUPER_ADMIN only) ─────────────────────────────────────

export const superAdminGetRestaurants = () => apiRequest('/restaurants');
export const superAdminGetRestaurant = (id) => apiRequest(`/restaurants/${id}`);

export const superAdminCreateRestaurant = ({ name, adminEmail, adminPassword, adminName }) => {
  return apiRequest('/restaurants', {
    method: 'POST',
    body: { name, adminEmail, adminPassword, adminName },
  });
};

export const superAdminUpdateRestaurant = (id, data) => {
  return apiRequest(`/restaurants/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const superAdminDeleteRestaurant = (id) => {
  return apiRequest(`/restaurants/${id}`, { method: 'DELETE' });
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const adminGetStats = () => apiRequest('/admin/stats');

export const adminGetDashboard = () => apiRequest('/admin/dashboard');

// ─── AI Generation ────────────────────────────────────────────────────────────

export const aiGenerateCourse = ({ topic, lessonsCount, difficulty, category }) => {
  return apiRequest('/admin/ai/generate-course', {
    method: 'POST',
    body: { topic, lessonsCount, difficulty, category },
  });
};

export const aiGenerateImage = ({ title, category, type }) => {
  return apiRequest('/admin/ai/generate-image', {
    method: 'POST',
    body: { title, category, type },
  });
};

// ─── Achievements ─────────────────────────────────────────────────────────────

export const adminGetAchievements = () => apiRequest('/admin/achievements');

export const adminCreateAchievement = (data) => {
  return apiRequest('/admin/achievements', {
    method: 'POST',
    body: data,
  });
};

export const adminUpdateAchievement = (id, data) => {
  return apiRequest(`/admin/achievements/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const adminDeleteAchievement = (id) => {
  return apiRequest(`/admin/achievements/${id}`, { method: 'DELETE' });
};

export const adminGrantAchievement = (id, user_id) => {
  return apiRequest(`/admin/achievements/${id}/grant`, {
    method: 'POST',
    body: { user_id },
  });
};

// ─── ADMIN MENU API ──────────────────────────────────────────────────────────

export const adminGetMenuCategories = () => apiRequest('/admin/menu/categories');

export const adminCreateMenuCategory = (data) => {
  return apiRequest('/admin/menu/categories', {
    method: 'POST',
    body: data,
  });
};

export const adminDeleteMenuCategory = (id) => {
  return apiRequest(`/admin/menu/categories/${id}`, {
    method: 'DELETE',
  });
};

export const adminCreateMenuItem = (data) => {
  return apiRequest('/admin/menu/items', {
    method: 'POST',
    body: data,
  });
};

export const adminUpdateMenuItem = (id, data) => {
  return apiRequest(`/admin/menu/items/${id}`, {
    method: 'PUT',
    body: data,
  });
};

export const adminDeleteMenuItem = (id) => {
  return apiRequest(`/admin/menu/items/${id}`, { method: 'DELETE' });
};

export const adminGetMenuPdf = () => apiRequest('/admin/menu/pdf');

export const adminUploadMenuPdf = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/admin/menu/upload-pdf', {
    method: 'POST',
    body: formData,
  });
};

export const adminConfirmParsedMenu = (menuData) => {
  return apiRequest('/admin/menu/confirm-parsed', {
    method: 'POST',
    body: { menuData },
  });
};

// ─── AI Pipeline (генерация Sales Guide + курс + тесты) ──────────────
export const adminGetMenuAiStatus = () => apiRequest('/admin/menu/ai-status');

export const adminRegenerateDishSalesGuide = (itemId) =>
  apiRequest(`/admin/menu/items/${itemId}/regenerate-sales-guide`, { method: 'POST' });

export const adminRegenerateMenuCourse = () =>
  apiRequest('/admin/menu/regenerate-course', { method: 'POST' });

// Полная генерация обучения по текущему меню (без загрузки PDF)
export const adminGenerateTraining = () =>
  apiRequest('/admin/menu/generate-training', { method: 'POST' });

