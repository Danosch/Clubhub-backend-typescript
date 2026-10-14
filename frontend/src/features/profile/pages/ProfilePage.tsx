import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import Button from '../../../components/Button';
import { Subject, Preference } from '../types';

/**
 * Authenticated user's profile page with inline editing and avatar upload.
 */
export default function ProfilePage() {
  const { user, updateUser, updateAvatar } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: Subject.NONE as Subject,
    preferences: [] as Preference[],
    avatar: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const prefRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        description: user.description,
        subject: user.subject ?? Subject.NONE,
        preferences: user.preferences || [],
        avatar: user.avatar ?? '',
      });
    }
  }, [user, isEditing]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (prefRef.current && !prefRef.current.contains(e.target as Node)) {
        setPrefOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return <div>Loading...</div>;

  const formatEnum = (v: string) =>
    v
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, subject: e.target.value as Subject }));
  };

  const togglePreference = (pref: Preference) => {
    setForm(f => {
      const exists = f.preferences.includes(pref);
      return {
        ...f,
        preferences: exists
          ? f.preferences.filter(p => p !== pref)
          : [...f.preferences, pref],
      };
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (avatarFile) {
      await updateAvatar(avatarFile);
      setAvatarFile(null);
    }
    await updateUser({
      ...user,
      name: form.name.trim() || user.name,
      description: form.description,
      subject: form.subject,
      preferences: form.preferences,
    });
    setIsEditing(false);
  };

  const subjectOptions = Object.values(Subject).filter(s => s !== Subject.NONE);
  const preferenceOptions = Object.values(Preference).filter(p => p !== Preference.NONE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex flex-col items-center">
            <div className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}>
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              {isEditing && (
                <>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Change
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
            {isEditing && (
              <p className="mt-2 text-xs text-gray-500">Click avatar to change</p>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
              {isEditing ? (
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="text-2xl font-bold border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold">{user.name}</h2>
              )}
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {isEditing ? (
                  <>
                    <Button
                      onClick={save}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">Description</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded px-3 py-2 resize-none"
                />
              ) : (
                <p className="text-gray-700">
                  {user.description || (
                    <span className="italic text-gray-400">No description.</span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">Subject</h3>
              {isEditing ? (
                <select
                  value={form.subject}
                  onChange={handleSubjectChange}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value={Subject.NONE}>Select subject</option>
                  {subjectOptions.map(s => (
                    <option key={s} value={s}>
                      {formatEnum(s)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-700">
                  {user.subject !== Subject.NONE ? (
                    formatEnum(user.subject)
                  ) : (
                    <span className="italic text-gray-400">No subject selected.</span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900">Preferences</h3>
              {isEditing ? (
                <div className="relative" ref={prefRef}>
                  <button
                    type="button"
                    onClick={() => setPrefOpen(o => !o)}
                    className="border rounded px-3 py-2 w-full text-left flex justify-between items-center"
                  >
                    <span>
                      {form.preferences.length
                        ? form.preferences.map(p => formatEnum(p)).join(', ')
                        : 'Select preferences'}
                    </span>
                    <span className="ml-2 text-gray-500">&#9662;</span>
                  </button>
                  {prefOpen && (
                    <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow max-h-60 overflow-auto">
                      {preferenceOptions.map(p => (
                        <label
                          key={p}
                          className="flex items-center px-3 py-1 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={form.preferences.includes(p)}
                            onChange={() => togglePreference(p)}
                          />
                          {formatEnum(p)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.preferences.length > 0 ? (
                    user.preferences.map(p => (
                      <span
                        key={p}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {formatEnum(p)}
                      </span>
                    ))
                  ) : (
                    <span className="italic text-gray-400">
                      No preferences selected.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-6">
              <Stat label="Clubs Joined" value={user.clubsJoined} />
              <Stat label="Events Attended" value={user.eventsAttended} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xl font-bold text-orange-600">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
