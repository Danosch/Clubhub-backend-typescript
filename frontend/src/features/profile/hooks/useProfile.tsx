import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { profileService } from '../services/ProfileService';
import { useAuth } from '../../auth/hooks/useAuth';

/** Context value with the current user and profile actions. */
type ProfileContextValue = {
  user: User | null;
  updateUser: (u: User) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Provider that loads the authenticated user's profile and exposes
 * helpers to update the profile and avatar.
 */
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { token } = useAuth();

  /** Fetch and store the latest user profile. */
  const refresh = async () => {
    const u = await profileService.getCurrent();
    setUser(u);
  };

  // fetch user whenever token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let active = true;
    refresh().catch(() => {
      if (active) setUser(null);
    });
    return () => {
      active = false;
    };
  }, [token]);

  // updateUser calls service then updates context
  /** Persist profile changes and update the context value. */
  const updateUser = async (updated: User) => {
    const saved = await profileService.updateCurrent(updated.id, updated);
    setUser(saved);
  };

  // upload new avatar and update context
  /** Upload a new avatar image and update the context value. */
  const updateAvatar = async (file: File) => {
    if (!user) return;
    const saved = await profileService.updateAvatar(user.id, file);
    setUser(saved);
  };

  return (
    <ProfileContext.Provider value={{ user, updateUser, updateAvatar, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
};

/** Hook to access the current profile context. */
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
