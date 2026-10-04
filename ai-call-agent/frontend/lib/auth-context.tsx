'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  loginAsRole: (role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
}

const DEFAULT_USER: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@aicallagent.internal',
  fullName: 'Lead Administrator',
  role: 'admin',
  isActive: true,
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  token: null,
  role: 'admin',
  isAuthenticated: true,
  loginWithCredentials: async () => false,
  loginAsRole: () => {},
  logout: () => {},
  switchRole: () => {},
  hasPermission: () => true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_profile');
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch {
          // fallback to default user
        }
      }
    }
  }, []);

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName || data.user.email,
          role: data.user.role || 'admin',
          isActive: true,
        };
        setToken(data.access_token);
        setUser(profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user_profile', JSON.stringify(profile));
        }
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  };

  const loginAsRole = (role: UserRole = 'admin') => {
    const roleNames: Record<string, string> = {
      admin: 'Lead Administrator',
      operator: 'Vikram Mehta (Operator)',
      receptionist: 'Priya Singh (Receptionist)',
      viewer: 'Auditor Guest',
    };
    const profile: UserProfile = {
      id: `usr-${role}-${Date.now().toString().slice(-4)}`,
      email: `${role}@aicallagent.internal`,
      fullName: roleNames[role] || 'System User',
      role,
      isActive: true,
    };
    setUser(profile);
    setToken(`demo-token-${role}`);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(profile));
      localStorage.setItem('access_token', `demo-token-${role}`);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
    }
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile', JSON.stringify(updated));
      }
    } else {
      loginAsRole(role);
    }
  };

  const hasPermission = (permission: string): boolean => {
    const currentRole = user?.role || 'viewer';
    if (currentRole === 'admin') return true;
    if (currentRole === 'operator') {
      return !['users_manage', 'voice_agent_configure', 'system_settings_destructive'].includes(permission);
    }
    if (currentRole === 'receptionist') {
      return ['live_calls_view', 'spam_review_submit', 'transfers_manage', 'voicemail_view', 'callbacks_manage'].includes(permission);
    }
    // viewer / auditor
    return ['overview_view', 'live_calls_view', 'call_history_view', 'analytics_view', 'settings_view'].includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'viewer',
        isAuthenticated: !!user,
        loginWithCredentials,
        loginAsRole,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
