import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser,
  setToken,
  clearToken,
  getIsDemoMode,
} from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('seattlesocial_token');
    if (token) {
      getCurrentUser()
        .then((u) => {
          setUser(u);
          setIsDemoMode(getIsDemoMode());
        })
        .catch(() => {
          clearToken();
          setIsDemoMode(getIsDemoMode());
        })
        .finally(() => setIsLoading(false));
    } else {
      // Probe backend availability even without a token
      getCurrentUser()
        .catch(() => {
          setIsDemoMode(getIsDemoMode());
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await apiLogin(credentials);
    setToken(response.token);
    setUser(response.user);
    setIsDemoMode(getIsDemoMode());
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    setToken(response.token);
    setUser(response.user);
    setIsDemoMode(getIsDemoMode());
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    // Also update demo user in localStorage if in demo mode
    if (getIsDemoMode()) {
      localStorage.setItem(
        'seattlesocial_demo_user',
        JSON.stringify(updatedUser)
      );
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
