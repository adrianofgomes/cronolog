export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  data?: any;
  responseType?: 'json' | 'blob' | 'text';
  silent?: boolean;
}

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login/';
    }
  }
};

async function request(path: string, options: RequestOptions = {}) {
  const { params, data, ...init } = options;
  
  // Build URL with params
  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Set default headers
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Handle body
  let body = init.body;
  if (data) {
    if (data instanceof FormData) {
      body = data;
      // Fetch will automatically set the correct Content-Type for FormData
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      body,
    });

    // Handle 401/403
    if ((response.status === 401 || response.status === 403) && !options.silent) {
      handleUnauthorized();
    }

    // Parse response based on responseType
    const contentType = response.headers.get('content-type');
    let responseData = null;

    if (options.responseType === 'blob') {
      responseData = await response.blob();
    } else if (options.responseType === 'text') {
      responseData = await response.text();
    } else if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    if (!response.ok) {
      // Mock axios error structure for compatibility
      // The backend returns { statusCode, data, error: { type, description } }
      const errorMessage = responseData?.error?.description || responseData?.message || response.statusText;
      const error: any = new Error(errorMessage);
      error.response = {
        status: response.status,
        data: responseData,
      };
      throw error;
    }

    // Mock axios response structure
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      config: options,
    };
  } catch (error: any) {
    if (error.response) throw error;
    
    // Handle network errors
    const networkError: any = new Error(error.message);
    networkError.isNetworkError = true;
    throw networkError;
  }
}

const api = {
  get: (url: string, options: RequestOptions = {}) => request(url, { ...options, method: 'GET' }),
  post: (url: string, data?: any, options: RequestOptions = {}) => request(url, { ...options, method: 'POST', data }),
  put: (url: string, data?: any, options: RequestOptions = {}) => request(url, { ...options, method: 'PUT', data }),
  delete: (url: string, options: RequestOptions = {}) => request(url, { ...options, method: 'DELETE' }),
  patch: (url: string, data?: any, options: RequestOptions = {}) => request(url, { ...options, method: 'PATCH', data }),
};

export default api;
