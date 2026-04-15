import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // On mount: restore session & validate the token is still alive
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      // Quick validation: hit an authenticated endpoint to confirm the token is still valid
      axios.get('http://localhost:5000/api/predict/history', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(() => {
        // Token is still valid — restore session
        setUser(JSON.parse(storedUser));
      })
      .catch(() => {
        // Token is stale (e.g. server restarted with ephemeral DB) — clear it
        console.warn('Stored session is invalid. Logging out.');
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [logout]);

  // Global interceptors: Attach token & handle 401
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => Promise.reject(error));

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [logout]);

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
    if (res.data.token) localStorage.setItem('token', res.data.token);
  };

  const register = async (name, email, password) => {
    const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
    setUser(res.data);
    localStorage.setItem('user', JSON.stringify(res.data));
    if (res.data.token) localStorage.setItem('token', res.data.token);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
