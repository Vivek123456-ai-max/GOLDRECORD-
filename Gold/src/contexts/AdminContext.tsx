import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AdminContextType {
  isAdmin: boolean;
  isAdminLoginOpen: boolean;
  openAdminLogin: () => void;
  closeAdminLogin: () => void;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
}

const ADMIN_EMAIL = 'ktvivek12345@gmail.com';
const ADMIN_PASS = 'Vivek12345@';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('is_gold_super_admin') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Global Keybinding Listener: Cmd + Shift + A (Mac) or Ctrl + Shift + A (Win/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

      if (isModifierPressed && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminLoginOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openAdminLogin = () => setIsAdminLoginOpen(true);
  const closeAdminLogin = () => setIsAdminLoginOpen(false);

  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASS) {
      // Also attempt supabase login/signup for backend session if user exists
      try {
        await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
      } catch (e) {
        // Fallback to local admin authorization
      }

      setIsAdmin(true);
      localStorage.setItem('is_gold_super_admin', 'true');
      setIsAdminLoginOpen(false);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid Super Admin credentials' };
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('is_gold_super_admin');
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isAdminLoginOpen,
        openAdminLogin,
        closeAdminLogin,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
