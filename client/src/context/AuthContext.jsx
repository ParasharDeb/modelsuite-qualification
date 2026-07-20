import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api/axios';
import { SESSION_EXPIRED_EVENT } from '../constants/authEvents';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const stored = localStorage.getItem('user');
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await API.post('/auth/refresh');
        const parsed = JSON.parse(stored);
        parsed.accessToken = data.accessToken;
        localStorage.setItem('user', JSON.stringify(parsed));
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Clear local session even if the server revoke fails.
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
