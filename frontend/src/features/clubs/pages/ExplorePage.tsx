// src/features/clubs/pages/ExplorePage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid as GridIcon,
  List as ListIcon,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useClubs } from '../hooks/useClubs';
import ClubGrid from '../components/ClubGrid';
import ClubList from '../components/ClubList';
import type { Club } from '../types';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { Preference } from '../../profile/types';

const categories = ['All', 'Academic', 'Creative', 'Sports', 'Cultural', 'Technical'];
const interests = ['All', ...Object.values(Preference).filter(i => i !== Preference.NONE)];
const formatEnum = (v: string) =>
  v
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
type SortKey = 'members_desc' | 'members_asc' | 'name_asc' | 'name_desc';

/**
 * Explore page for discovering clubs with filters, search, sorting
 * and grid/list presentation modes.
 */
export default function ExplorePage() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedInterest, setSelectedInterest] = useState<Preference | 'All'>('All');
  const [minMembers, setMinMembers] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('members_desc');

  const { clubs, joinClub, leaveClub, loading, error, totalPages } = useClubs({
    page,
    size: PAGE_SIZE,
    name: search || undefined,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    interest: selectedInterest === 'All' ? undefined : selectedInterest,
    minMembers: minMembers ? Number(minMembers) : undefined,
    maxMembers: maxMembers ? Number(maxMembers) : undefined,
  });
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedInterest('All');
    setMinMembers('');
    setMaxMembers('');
    setSortKey('members_desc');
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [search, selectedCategory, selectedInterest, minMembers, maxMembers]);

  const sorted = useMemo(() => {
    let arr = [...clubs];

    switch (sortKey) {
      case 'members_desc':
        arr = [...arr].sort((a, b) => b.members - a.members);
        break;
      case 'members_asc':
        arr = [...arr].sort((a, b) => a.members - b.members);
        break;
      case 'name_asc':
        arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        arr = [...arr].sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return arr;
  }, [clubs, sortKey]);

  const handleJoin = (club: Club) => {
    club.isJoined ? leaveClub(club.id) : joinClub(club.id);
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
      {/* Header + controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold mb-2">Explore</h1>

          {/* search + toggles row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                className="pl-10 pr-4 py-2 w-full"
                placeholder="Search clubs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:shadow-sm"
                  onClick={() => setShowFilters(f => !f)}
                  aria-label="Toggle filters"
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFilters && (
                  <div className="absolute top-full left-1/2 mt-2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 w-[760px] max-w-[calc(100vw-2rem)]">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Category */}
                      <div className="flex-1 min-w-[140px]">
                        <div className="mb-1">
                          <h3 className="font-medium text-sm">Category</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                selectedCategory === cat
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interest */}
                      <div className="flex-1 min-w-[140px]">
                        <div className="mb-1">
                          <h3 className="font-medium text-sm">Interest</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {interests.map(i => (
                            <button
                              key={i}
                              onClick={() => setSelectedInterest(i as any)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                selectedInterest === i
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-orange-200'
                              }`}
                            >
                              {i === 'All' ? 'All' : formatEnum(i)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Members */}
                      <div className="flex-1 min-w-[140px]">
                        <div className="mb-1">
                          <h3 className="font-medium text-sm">Members</h3>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={minMembers}
                            onChange={e => setMinMembers(e.target.value)}
                            placeholder="Min"
                            className="w-24 px-3 py-2 text-sm border rounded-lg"
                          />
                          <Input
                            type="number"
                            value={maxMembers}
                            onChange={e => setMaxMembers(e.target.value)}
                            placeholder="Max"
                            className="w-24 px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>
                          {/* Sort */}
                        <div className="mb-1 mt-1">
                          <h3 className="font-medium text-sm">Sort By</h3>
                        </div>
                        <select
                          value={sortKey}
                          onChange={e => setSortKey(e.target.value as SortKey)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="members_desc">Members (high → low)</option>
                          <option value="members_asc">Members (low → high)</option>
                          <option value="name_asc">Name (A → Z)</option>
                          <option value="name_desc">Name (Z → A)</option>
                        </select>
                      </div>
                      </div>

                    

                    {/* Clear All on its own line */}
                    <div className="mt-4">
                      <Button onClick={resetFilters} variant="primary">
                        Clear All
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="Grid view"
                >
                  <GridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  aria-label="List view"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clubs listing */}
      <div>
        {viewMode === 'grid' ? (
          <ClubGrid
            clubs={sorted}
            onSelect={c => navigate(`/clubs/${c.id}`)}
            onJoin={handleJoin}
          />
        ) : (
          <ClubList
            clubs={sorted}
            onSelect={c => navigate(`/clubs/${c.id}`)}
            onJoin={handleJoin}
          />
        )}
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={page + 1 >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
