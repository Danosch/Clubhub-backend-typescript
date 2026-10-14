// src/features/admin/pages/ModerationPage.tsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../../profile/hooks/useProfile';
import Button from '../../../components/Button';

type FlaggedItem = {
  id: number;
  type: 'post' | 'thread';
  title: string;
  reportedBy: string;
  reason: string;
  date: string;
};

/** Admin/moderator queue for reviewing flagged content. */
export default function ModerationPage() {
  const { user } = useProfile();
  const [queue, setQueue] = useState<FlaggedItem[]>([
    { id:1, type:'post',   title:'Spam post in Chess Club',    reportedBy:'eve@uni.edu', reason:'Spam',  date:'2025-07-13' },
    { id:2, type:'thread', title:'Off-topic debate thread',       reportedBy:'tom@uni.edu', reason:'Off-topic', date:'2025-07-14' }
  ]);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  const resolve = (id: number) =>
    setQueue(q => q.filter(item => item.id !== id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content Moderation Queue</h1>
      {queue.length > 0 ? (
        queue.map(item => (
          <div key={item.id} className="bg-white p-4 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">
                [{item.type.toUpperCase()}] {item.title}
              </p>
              <p className="text-sm text-gray-500">
                Reported by {item.reportedBy} on {item.date} — {item.reason}
              </p>
            </div>
            <Button onClick={() => resolve(item.id)} variant="success" size="sm">
              Resolve
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No items awaiting moderation.</p>
      )}
    </div>
  );
}
