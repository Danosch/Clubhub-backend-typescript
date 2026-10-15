import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { profileService } from '../services/ProfileService';
import { useAuth } from '../../auth/hooks/useAuth';

/** Current user profile and actions available to components. */
type ProfileContextValue = {
  user: User | null;
  updateUser: (user: User) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

/**
 * Loads the current profile while the user has an authenticated session.
 *
 * @param children Components that need access to the profile.
 */
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const { status } = useAuth();

  /** Fetches and stores the latest profile. */
  const refresh = async (): Promise<void> => {
    const profile = await profileService.getCurrent();
    setUser(profile);
  };

  useEffect(() => {
    if (status !== 'authenticated') {
      setUser(null);
      return;
    }

    let active = true;

    void profileService
      .getCurrent()
      .then(profile => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, [status]);

  /**
   * Persists profile changes and updates the context.
   *
   * @param updated Profile data to save.
   */
  const updateUser = async (updated: User): Promise<void> => {
    const saved = await profileService.updateCurrent(updated.id, updated);
    setUser(saved);
  };

  /**
   * Uploads a new avatar and updates the context.
   *
   * @param file Avatar image to upload.
   */
  const updateAvatar = async (file: File): Promise<void> => {
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

/**
 * Reads the current profile context.
 *
 * @returns The profile and its actions.
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}