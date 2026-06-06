const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const getHeaders = () => {
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

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, ...customOptions } = options;

  const requestHeaders = {
    ...getHeaders(),
    ...headers
  };

  // Если тело запроса - FormData, то Content-Type не нужен (браузер сам выставит multipart/form-data и boundary)
  if (body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    ...customOptions
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Ошибка запроса (${res.status})`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || 'OK' };
  }
};
