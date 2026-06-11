'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email: string;
  picture: string;
  status: 'pending' | 'active' | 'blocked';
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Se o status estiver ausente (versão antiga) ou para garantir que está atualizado
        try {
          const { default: api } = await import('@/lib/api');
          const response = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          const dbUser = response.data.data;
          const updatedUser: User = { 
            ...parsedUser, 
            name: dbUser.name || parsedUser.name,
            status: dbUser.status,
            isAdmin: dbUser.isAdmin
          };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        } catch (err: any) {
          console.error('Erro ao atualizar usuário na inicialização:', err);
          // Se der 401 ou 403, mantemos o que tem ou tratamos conforme necessário
          if (err.response?.status === 401) logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (newToken: string, googleData: any) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);

    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      
      const dbUser = response.data.data;

      const userObj: User = {
        name: dbUser.name || googleData.name,
        email: dbUser.email || googleData.email,
        picture: googleData.picture,
        status: dbUser.status,
        isAdmin: dbUser.isAdmin
      };

      setUser(userObj);
      localStorage.setItem('auth_user', JSON.stringify(userObj));
    } catch (error: any) {
      console.error('Error during backend login:', error);
      
      const userObj: User = {
        name: googleData.name,
        email: googleData.email,
        picture: googleData.picture,
        status: error.response?.status === 403 ? 'pending' : 'pending',
        isAdmin: false
      };
      setUser(userObj);
      localStorage.setItem('auth_user', JSON.stringify(userObj));
    }
    router.push('/');
  };

  const refreshUserStatus = async () => {
    if (!token) return;
    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get('/users/me');
      const dbUser = response.data.data;
      
      setUser(prev => prev ? { ...prev, status: dbUser.status, isAdmin: dbUser.isAdmin } : null);
      localStorage.setItem('auth_user', JSON.stringify({ ...user, status: dbUser.status, isAdmin: dbUser.isAdmin }));
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, refreshUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
