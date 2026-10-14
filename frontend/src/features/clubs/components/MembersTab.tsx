// src/features/clubs/components/MembersTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, List } from 'lucide-react';
import { Club, Member, Role } from '../types';
import { clubService } from '../services/ClubService';
import Avatar from '../../../components/Avatar';
import { useProfile } from '../../profile/hooks/useProfile';

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'MEMBER',    label: 'Member',    description: 'Regular member; can post, join events, and comment.' },
  { value: 'MODERATOR', label: 'Moderator', description: 'Can create and manage events, and moderate content.' },
  { value: 'ADMIN',     label: 'Admin',     description: 'Can change roles of other members and manage everything.' },
];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MODERATOR: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-green-100 text-green-800',
};

/** Props for the club Members tab. */
interface MembersTabProps {
  club: Club;
  onUpdate?: (updated: Member[]) => void;
  currentUserRole?: Role;
}

/**
 * Members tab with grid/list views, search, and role management.
 */
export default function MembersTab({ club, onUpdate, currentUserRole }: MembersTabProps) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>(club.members_list);
  const [view, setView]     = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');
  const { user } = useProfile();

  // Sync props → state
  useEffect(() => {
    setMembers(club.members_list);
  }, [club.members_list]);

  // Filter by name/role
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  }, [members, search]);

  const handleRoleChange = async (id: number | string, newRole: Role) => {
    const target = members.find(m => m.id === id);
    if (!target) return;
    if (String(target.userId) === String(user?.id)) return; // cannot change your own role
    const admins = members.filter(m => m.role === 'ADMIN');
    if (target.role === 'ADMIN' && newRole !== 'ADMIN' && admins.length <= 1) {
      return; // must keep at least one admin
    }
    try {
      await clubService.updateMemberRole(club.id, id, newRole);
      const updated = members.map(m =>
        m.id === id ? { ...m, role: newRole } : m
      );
      setMembers(updated);
      onUpdate?.(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg ${view==='grid' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg ${view==='list' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(member => {
            const isSelf = String(member.userId) === String(user?.id);
            return (
              <div
                key={member.id}
                onClick={() => navigate(`/users/${member.userId}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-3xl">
                  <Avatar avatar={member.avatar} size={48} />
                </div>

                <p className="font-medium text-gray-900">{member.name}</p>

                {currentUserRole === 'ADMIN' && !isSelf ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value as Role)}
                    onClick={e => e.stopPropagation()}
                    title={ROLE_OPTIONS.find(r=>r.value===member.role)?.description}
                    className={`border px-2 py-1 rounded ${ROLE_COLORS[member.role]} border-gray-300 hover:border-gray-400`}
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                    {ROLE_OPTIONS.find(r => r.value === member.role)?.label ?? member.role}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => {
            const isSelf = String(member.userId) === String(user?.id);
            return (
              <div
                key={member.id}
                onClick={() => navigate(`/users/${member.userId}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-3xl">
                  <Avatar avatar={member.avatar} size={32} />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                </div>

                {currentUserRole === 'ADMIN' && !isSelf ? (
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value as Role)}
                    onClick={e => e.stopPropagation()}
                    title={ROLE_OPTIONS.find(r=>r.value===member.role)?.description}
                    className={`mr-4 border px-2 py-1 rounded ${ROLE_COLORS[member.role]} border-gray-300 hover:border-gray-400`}
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`mr-4 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                    {ROLE_OPTIONS.find(r => r.value === member.role)?.label ?? member.role}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
