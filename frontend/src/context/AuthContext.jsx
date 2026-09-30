'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('pos_token');
    const savedUser = localStorage.getItem('pos_user');

    if (savedToken) setToken(savedToken);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('pos_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await authAPI.login({ username, password });

      if (res.data.success) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;

        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('pos_token', receivedToken);
        localStorage.setItem('pos_user', JSON.stringify(receivedUser));

        return {
          success: true,
          user: receivedUser,
          message: res.data.message
        };
      }

      return {
        success: false,
        message: res.data.message || 'Username atau password salah.'
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login gagal. Periksa koneksi ke server.'
      };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await authAPI.registerPetugas({ username, password });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Pembuatan akun gagal. Silakan coba lagi.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isPetugas: user?.role === 'petugas'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
