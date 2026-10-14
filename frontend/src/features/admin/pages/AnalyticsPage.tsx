import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../../profile/hooks/useProfile';

/** Placeholder analytics dashboard for admins/moderators. */
export default function AnalyticsPage() {
  const { user } = useProfile();

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  // placeholder metrics
  const totalClubs   = 42;
  const totalMembers = 1_234;
  const totalPosts   = 5_678;
  const avgEngagement= 3.4; // likes+comments per post

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clubs',    value: totalClubs },
          { label: 'Total Members',  value: totalMembers },
          { label: 'Total Posts',    value: totalPosts },
          { label: 'Avg Engagement', value: avgEngagement.toFixed(1) }
        ].map(({ label, value }) => (
          <div key={label} className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            <p className="text-gray-600">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-sm">More charts coming soon…</p>
    </div>
  );
}
