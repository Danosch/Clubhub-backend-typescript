import React, { useState } from 'react';
import { Club, Role } from '../types';
import { Users, Calendar, Edit as EditIcon } from 'lucide-react';
import Button from '../../../components/Button';
import { Subject, Preference } from '../../profile/types';
import { clubService } from '../services/ClubService';

/** Props for the club About tab. */
interface AboutTabProps {
  club: Club;
  onUpdate: (updated: Club) => void;
  currentUserRole?: Role;
}

const formatEnum = (v: string) =>
  v
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

/**
 * About tab for viewing and editing club metadata.
 */
export default function AboutTab({ club, onUpdate, currentUserRole }: AboutTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const canEdit = currentUserRole === 'ADMIN';

  const [form, setForm] = useState({
    name: club.name,
    description: club.description,
    category: club.category,
    subject: club.subject,
    interest: club.interest,
    avatar: club.avatar,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

  const save = async () => {
    const updated = await clubService.updateClub(club.id, {
      name: form.name,
      description: form.description,
      category: form.category,
      subject: form.subject,
      interest: form.interest,
    });
    let avatar = form.avatar;
    if (avatarFile) {
      const withAvatar = await clubService.updateAvatar(club.id, avatarFile);
      avatar = withAvatar.avatar;
      setAvatarFile(null);
    }
    onUpdate({ ...updated, avatar });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt={club.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                  🏷️
                </div>
              )}
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              )}
            </div>
            {isEditing ? (
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="text-2xl font-bold border-b border-gray-300 focus:outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{club.name}</h2>
            )}
          </div>
          {canEdit && (
            isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={save}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-1">
                <EditIcon className="w-4 h-4" /> Edit
              </Button>
            )
          )}
        </div>

        {isEditing ? (
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-3 py-1 mb-4"
          >
            {['Academic','Creative','Sports','Cultural','Technical'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        ) : (
          <p className="text-gray-600 mb-4">{club.category}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span>{club.members} members</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>{club.events.length} upcoming events</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">About This Club</h3>
          {isEditing ? (
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
              placeholder="Short description…"
            />
          ) : (
            <p className="text-gray-700">
              {club.description || (
                <span className="italic text-gray-400">No description yet.</span>
              )}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Subject & Interest</h3>
          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-1"
              >
                {Object.values(Subject).map(s => (
                  <option key={s} value={s}>{formatEnum(s)}</option>
                ))}
              </select>
              <select
                name="interest"
                value={form.interest}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-3 py-1"
              >
                {Object.values(Preference).map(p => (
                  <option key={p} value={p}>{formatEnum(p)}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {club.subject !== Subject.NONE && (
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-sm">
                  {formatEnum(club.subject)}
                </span>
              )}
              {club.interest !== Preference.NONE && (
                <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-sm">
                  {formatEnum(club.interest)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
