import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { profileService } from '../services/ProfileService';
import type { User } from '../types';

/** Read-only view of another user's profile. */
export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    profileService
      .getById(userId)
      .then(u => { if (active) setUser(u); })
      .catch(() => {});
    return () => { active = false; };
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  const formatEnum = (v: string) =>
    v.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex flex-col items-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">Description</h3>
              <p className="text-gray-700">
                {user.description || (
                  <span className="italic text-gray-400">No description.</span>
                )}
              </p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">Subject</h3>
              <p className="text-gray-700">{user.subject ? formatEnum(user.subject) : '-'}</p>
            </div>
            {user.preferences && user.preferences.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900">Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {user.preferences.map(p => (
                    <span key={p} className="px-2 py-1 text-sm bg-gray-200 rounded">
                      {formatEnum(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
