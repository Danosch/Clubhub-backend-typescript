// src/features/clubs/pages/MyClubsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, X, Loader2 } from 'lucide-react';
import Button from '../../../components/Button';
import ProcessingBox from '../../../components/ProcessingBox';
import type { Club, Role } from '../types';
import { clubService } from '../services/ClubService';
import { useProfile } from '../../profile/hooks/useProfile';

import { Subject, Preference } from '../../profile/types';

const categories = ['Academic', 'Creative', 'Sports', 'Cultural', 'Technical'];

const formatEnum = (v: string) =>
  v
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MODERATOR: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-green-100 text-green-800',
};

/**
 * Page listing clubs the user has joined, with the ability to leave
 * and a modal to create a new club.
 */
export default function MyClubsPage() {
  const navigate = useNavigate();
  const { user, refresh } = useProfile();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);
    const ids = user.memberships.map(m => m.clubId);
    Promise.all(ids.map(id => clubService.getById(id)))
      .then(results => {
        const valid = results.filter((c): c is Club => Boolean(c));
        setClubs(valid.map(c => ({ ...c, isJoined: true })));
      })
      .catch(err => setError(err?.message ?? 'Failed to load clubs'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLeaveClub = async (id: string) => {
    setError(null);
    try {
      await clubService.leaveClub(id);
      await refresh();
      setClubs(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to leave club');
    }
  };

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: categories[0],
    subject: Subject.NONE,
    interest: Preference.NONE,
    avatar: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Frontend validation: subject and interest are mandatory
    if (form.subject === Subject.NONE || form.interest === Preference.NONE) {
      setSubmitError('Please select both Subject and Interest.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await clubService.createClub({
        name: form.name,
        description: form.description,
        category: form.category,
        subject: form.subject,
        interest: form.interest,
      });
      let avatar = created.avatar;
      if (avatarFile) {
        const updated = await clubService.updateAvatar(created.id, avatarFile);
        avatar = updated.avatar;
        setAvatarFile(null);
      }
      // ensure newly created club appears joined for the creator
      setClubs(prev => [
        ...prev,
        {
          ...created,
          avatar,
          isJoined: true,
          members: created.members || 1,
        },
      ]);
      await refresh();
      setShowModal(false);
      setForm({
        name: '',
        description: '',
        category: categories[0],
        subject: Subject.NONE,
        interest: Preference.NONE,
        avatar: '',
      });
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Clubs</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" />
          Create Club
        </Button>
      </div>

      {/* Joined Clubs List */}
      {clubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map(club => {
            const role = user?.memberships.find(m => m.clubId === club.id)?.role;
            return (
              <div
                key={club.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/clubs/${club.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {club.avatar ? (
                      <img
                        src={club.avatar}
                        alt={club.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">🏷️</div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{club.name}</h3>
                      <p className="text-sm text-gray-600">{club.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{club.members}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{club.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-600">Joined</span>
                      {role && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role as Role]}`}>
                          {formatEnum(role)}
                        </span>
                      )}
                    </div>
                    <Button
                      className="text-sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleLeaveClub(club.id);
                      }}
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          You haven’t joined any clubs yet.
        </div>
      )}

      {/* Create Club Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            {/* Close */}
            <button
              onClick={() => {
                setShowModal(false);
                setAvatarFile(null);
                setForm({
                  name: '',
                  description: '',
                  category: categories[0],
                  subject: Subject.NONE,
                  interest: Preference.NONE,
                  avatar: '',
                });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" /> New Club
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Avatar</label>
                <div className="flex items-center gap-2">
                  {form.avatar && (
                    <img
                      src={form.avatar}
                      alt="preview"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value={Subject.NONE}>Select subject</option>
                  {Object.values(Subject)
                    .filter(s => s !== Subject.NONE)
                    .map(s => (
                      <option key={s} value={s}>{formatEnum(s)}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Interest</label>
                <select
                  name="interest"
                  value={form.interest}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value={Preference.NONE}>Select interest</option>
                  {Object.values(Preference)
                    .filter(p => p !== Preference.NONE)
                    .map(p => (
                      <option key={p} value={p}>{formatEnum(p)}</option>
                    ))}
                </select>
              </div>

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setAvatarFile(null);
                    setForm({
                      name: '',
                      description: '',
                      category: categories[0],
                      subject: Subject.NONE,
                      interest: Preference.NONE,
                      avatar: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    submitting || form.subject === Subject.NONE || form.interest === Preference.NONE
                  }
                  className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submitting && <ProcessingBox message="Creating club..." />}
    </div>
  );
}
