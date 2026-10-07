'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Member } from '@/lib/types';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
}

interface RoleContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  currentMember: Member | null;
  allMembers: Member[];
  refreshMembers: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [role, setRoleState] = useState<UserRole>('ADMIN');
  const [selectedMemberId, setSelectedMemberIdState] = useState<string>('m-1');
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setAllMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch members for role context', err);
    }
  };

  const checkSession = async () => {
    try {
      setIsLoadingAuth(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setRoleState(data.user.role);
          if (data.user.memberId) {
            setSelectedMemberIdState(data.user.memberId);
          }
          return;
        }
      }
      
      // Fallback from localStorage if session not found
      const savedRole = localStorage.getItem('vla_user_role') as UserRole;
      if (savedRole) setRoleState(savedRole);
      const savedMemberId = localStorage.getItem('vla_member_id');
      if (savedMemberId) setSelectedMemberIdState(savedMemberId);
    } catch (err) {
      console.error('Failed to verify session', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    checkSession();
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('vla_user_role', newRole);
  };

  const setSelectedMemberId = (id: string) => {
    setSelectedMemberIdState(id);
    localStorage.setItem('vla_member_id', id);
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login gagal' };
      }

      setUser(data.user);
      setRoleState(data.user.role);
      localStorage.setItem('vla_user_role', data.user.role);

      if (data.user.memberId) {
        setSelectedMemberIdState(data.user.memberId);
        localStorage.setItem('vla_member_id', data.user.memberId);
      }

      return { success: true };
    } catch (err) {
      console.error('Login action error', err);
      return { success: false, error: 'Terjadi kesalahan jaringan atau server' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setUser(null);
    setRoleState('ADMIN');
    localStorage.removeItem('vla_user_role');
    localStorage.removeItem('vla_member_id');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const currentMember = allMembers.find((m) => m.id === selectedMemberId) || allMembers[0] || null;

  return (
    <RoleContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        role,
        setRole,
        selectedMemberId,
        setSelectedMemberId,
        currentMember,
        allMembers,
        refreshMembers: fetchMembers,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
}
