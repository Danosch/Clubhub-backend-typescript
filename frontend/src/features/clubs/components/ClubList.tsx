import React from 'react';
import { Club } from '../types';
import { Users } from 'lucide-react';
import Button from '../../../components/Button';
import { Subject, Preference } from '../../profile/types';

/**
 * List layout that renders clubs with metadata and a join button.
 */
export default function ClubList({
  clubs,
  onSelect,
  onJoin
}: {
  clubs: Club[];
  onSelect: (club: Club) => void;
  onJoin: (club: Club) => void;
}) {
  const formatEnum = (v: string) =>
    v
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-4">
      {clubs.map(club => (
        <div
          key={club.id}
          onClick={() => onSelect(club)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-4"
        >
          {club.avatar ? (
            <img
              src={club.avatar}
              alt={club.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
              🏷️
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{club.name}</h3>
            <p className="text-sm text-gray-600">{club.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {club.members} members
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100">{club.category}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
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
          </div>
          <Button
            className="text-sm"
            onClick={e => {
              e.stopPropagation();
              if (!club.isJoined) onJoin(club);
            }}
            disabled={club.isJoined}
          >
            {club.isJoined ? 'Joined' : 'Join'}
          </Button>
        </div>
      ))}
    </div>
  );
}
