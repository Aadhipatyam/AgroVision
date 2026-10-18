import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from '../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  location: { state: string; district: string };
  farmDetails: { size: string; primaryCrop: string };
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  location: { state: string; district: string };
  farmDetails: { size: string; primaryCrop: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupPayload) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On load, if a token exists, validate it against the backend rather than
  // trusting whatever was last cached client-side.
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<User>('/auth/me');
        setUser(res.user as unknown as User);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(res.token as unknown as string);
    setUser(res.user as unknown as User);
  };

  const signup = async (userData: SignupPayload) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', userData);
    setToken(res.token as unknown as string);
    setUser(res.user as unknown as User);
  };

  const logout = () => {
    // Best-effort server notification; token is cleared client-side regardless
    api.post('/auth/logout').catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
