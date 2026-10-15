import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../../profile/hooks/useProfile';
import Button from '../../../components/Button';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'moderator' | 'admin';
  banned: boolean;
}

/** Admin page for searching users, changing roles, and bans. */
export default function ManageUsersPage() {
  const { user } = useProfile();
  const [users, setUsers] = useState<UserRecord[]>([
    { id:1, name:'Alice Johnson', email:'alice@uni.edu', role:'student', banned:false },
    { id:2, name:'Bob Smith',     email:'bob@uni.edu',   role:'moderator', banned:false },
    { id:3, name:'Carol Lee',     email:'carol@uni.edu', role:'student',   banned:true }
  ]);
  const [filter, setFilter] = useState('');

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const changeRole = (id: number, role: UserRecord['role']) => {
    setUsers(us => us.map(u => u.id===id ? { ...u, role } : u));
  };
  const toggleBan = (id: number) => {
    setUsers(us => us.map(u => u.id===id ? { ...u, banned: !u.banned } : u));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <input
        type="text"
        placeholder="Search by name or email..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <div className="space-y-4">
        {filtered.map(u => (
          <div
            key={u.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 border rounded-lg gap-4"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {u.name} {u.banned && <span className="text-red-500">(banned)</span>}
              </p>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value as any)}
                className="border border-gray-300 rounded-lg px-2 py-1"
              >
                <option value="student">Student</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                onClick={() => toggleBan(u.id)}
                className={`px-3 py-1 rounded-lg ${u.banned ? 'bg-green-500' : 'bg-red-500'} text-white hover:opacity-90`}
              >
                {u.banned ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-600">No users found.</p>
        )}
      </div>
    </div>
  );
}
