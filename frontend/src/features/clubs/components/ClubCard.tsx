import React from 'react';
import { Club } from '../types';
import { Users } from 'lucide-react';
import Button from '../../../components/Button';
import { Subject, Preference } from '../../profile/types';

export default function ClubCard({
  club,
  onClick,
  onJoin
}: {
  club: Club;
  onClick: () => void;
  onJoin: () => void;
}) {
  const formatEnum = (v: string) =>
    v
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        {club.avatar ? (
          <img
            src={club.avatar}
            alt={club.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
            🏷️
          </div>
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
      <div className="flex flex-wrap gap-2 mb-3">
        {club.subject !== Subject.NONE && (
          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
            {formatEnum(club.subject)}
          </span>
        )}
        {club.interest !== Preference.NONE && (
          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
            {formatEnum(club.interest)}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            club.isJoined ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {club.isJoined ? 'Joined' : 'Not Joined'}
        </span>
        <Button
          className="text-sm"
          onClick={e => {
            e.stopPropagation();
            if (!club.isJoined) onJoin();
          }}
          disabled={club.isJoined}
        >
          {club.isJoined ? 'Joined' : 'Join'}
        </Button>
      </div>
    </div>
  );
}
