import { useState } from 'react';
import { User, LoginRequest } from '../types';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      
      if (response.success) {
        setUser({
          username: response.username,
          role: response.role
        });
        console.log('Login successful, user set:', { username: response.username, role: response.role });
        return true;
      } else {
        setError('Login failed');
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError('');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    setError
  };
};

