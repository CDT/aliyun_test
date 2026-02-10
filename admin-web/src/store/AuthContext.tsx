import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';
import { UserProfile } from '../types';
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from './auth-storage';

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (token: string, user: UserProfile) => void;
  signOut: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(Boolean(getStoredToken() && !getStoredUser()));

  const signOut = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const signIn = useCallback((nextToken: string, nextUser: UserProfile) => {
    setStoredToken(nextToken);
    setStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  const refreshMe = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await getMe();
      setStoredUser(profile);
      setToken(currentToken);
      setUser(profile);
    } catch (_error) {
      signOut();
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    if (token && !user) {
      void refreshMe();
      return;
    }

    setLoading(false);
  }, [token, user, refreshMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      signIn,
      signOut,
      refreshMe,
    }),
    [loading, refreshMe, signIn, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
