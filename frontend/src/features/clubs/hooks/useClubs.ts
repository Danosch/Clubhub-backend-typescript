import { useEffect, useState } from 'react';
import { Club } from '../types';
import { clubService, ClubSearchParams } from '../services/ClubService';
import { useProfile } from '../../profile/hooks/useProfile';

export function useClubs(params: ClubSearchParams = {}) {
  const { user, refresh } = useProfile();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    page,
    size,
    name,
    category,
    interest,
    minMembers,
    maxMembers,
  } = params;

  useEffect(() => {
    setLoading(true);
    setError(null);
    clubService
      .getAll({ page, size, name, category, interest, minMembers, maxMembers })
      .then(res => {
        setClubs(
          res.clubs.map(c => ({
            ...c,
            isJoined: c.isJoined || !!user?.memberships.some(m => m.clubId === c.id),
          }))
        );
        setTotalPages(res.totalPages);
      })
      .catch(err => setError(err.message ?? 'Failed to load clubs'))
      .finally(() => setLoading(false));
  }, [user, page, size, name, category, interest, minMembers, maxMembers]);
  
  /** locally adds a club; later you can call clubService.create() too */
  const addClub = (newClub: Club) => {
    setClubs(prev => [...prev, newClub]);
  };

  const joinClub = (id: string) => {
    setError(null);
    setClubs(prev =>
      prev.map(c =>
        c.id === id ? { ...c, isJoined: true, members: c.members + 1 } : c
      )
    );
    clubService
      .joinClub(id)
      .then(() => refresh())
      .catch(err => {
        setClubs(prev =>
          prev.map(c =>
            c.id === id
              ? { ...c, isJoined: false, members: Math.max(0, c.members - 1) }
              : c
          )
        );
        setError(err.message ?? 'Failed to join club');
      });
  };

  const leaveClub = (id: string) => {
    setError(null);
    setClubs(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, isJoined: false, members: Math.max(0, c.members - 1) }
          : c
      )
    );
    clubService.leaveClub(id).catch(err => {
      setClubs(prev =>
        prev.map(c =>
          c.id === id ? { ...c, isJoined: true, members: c.members + 1 } : c
        )
      );
      setError(err.message ?? 'Failed to leave club');
    });
  };

  return { clubs, addClub, joinClub, leaveClub, loading, error, totalPages };
}
