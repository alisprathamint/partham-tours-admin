import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token and user
    const savedToken = localStorage.getItem('token');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      if (savedRefreshToken) setRefreshToken(savedRefreshToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);

    // Cross-tab sync for token changes
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setToken(null);
          setRefreshToken(null);
          setUser(null);
          window.location.href = '/login';
        } else if (e.newValue !== e.oldValue) {
          // Token refreshed in another tab, sync state without logging out
          setToken(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newToken, newRefreshToken, userData) => {
    localStorage.setItem('token', newToken);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isSales = () => {
    return user?.role === 'SALES';
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isLoading, login, logout, updateUser, isAdmin, isSales }}>
      {children}
    </AuthContext.Provider>
  );
};
