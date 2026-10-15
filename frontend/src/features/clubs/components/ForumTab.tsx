import React, { useState, useEffect, useRef } from 'react';
import { Club, Thread } from '../types';
import Button from '../../../components/Button';
import { clubService } from '../services/ClubService';
import { ApiError } from '../../../services/api';
import { Loader2, ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import SharePopup from '../../../components/SharePopup';

/** Props for the club Forum tab. */
interface ForumTabProps {
  club: Club;
  onClubUpdate: (c: Club) => void;
  onSelectThread: (t: Thread) => void;
}

/**
 * Forum tab for creating and browsing discussion threads inside a club.
 */
export default function ForumTab({ club, onClubUpdate, onSelectThread }: ForumTabProps) {
  const [title, setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [error, setError]   = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState<number>(club.forum_threads.length || 0);
  const [shareThreadId, setShareThreadId] = useState<string | null>(null);
  const clubRef = useRef(club);
  useEffect(() => { clubRef.current = club; }, [club]);

  useEffect(() => {
    // Always fetch fresh threads when this tab mounts
    setLoading(true);
    setHasMore(true);
    clubService
      .listThreadsPage(club.id, 0, 10)
      .then(list => {
        onClubUpdate({ ...clubRef.current, forum_threads: list });
        setOffset(list.length);
        if (list.length < 10) setHasMore(false);
      })
      .catch(err => setError(err?.message ?? 'Failed to load threads'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setError(null);
    if (!title.trim() || !content.trim()) {
      setError('Both title and content are required.');
      return;
    }
    try {
      const created = await clubService.createThread(club.id, title.trim(), content.trim());
      onClubUpdate({ ...club, forum_threads: [ created, ...club.forum_threads ] });
      setTitle(''); setContent('');
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setError('Only club members can create threads.');
      } else {
        setError('Failed to create thread');
      }
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const limit = 10;
      const list = await clubService.listThreadsPage(club.id, offset, limit);
      const existing = new Set((clubRef.current.forum_threads ?? []).map(t => t.id));
      const filtered = list.filter(t => {
        if (existing.has(t.id)) return false;
        existing.add(t.id);
        return true;
      });
      if (filtered.length > 0) {
        onClubUpdate({ ...clubRef.current, forum_threads: [...clubRef.current.forum_threads, ...filtered] });
      }
      setOffset(o => o + limit);
      if (list.length < limit) setHasMore(false);
    } catch (e) {
      setError('Failed to load more threads');
    } finally {
      setLoadingMore(false);
    }
  };

  // Compute sorted threads by score (upvotes - downvotes), highest first
  const sortedThreads = [...(club.forum_threads ?? [])].sort((a, b) => {
    const sa = (a.upvotes ?? 0) - (a.downvotes ?? 0);
    const sb = (b.upvotes ?? 0) - (b.downvotes ?? 0);
    if (sb !== sa) return sb - sa;
    // tie-breaker: most recent activity first
    const ta = new Date(a.lastActivity || '').getTime();
    const tb = new Date(b.lastActivity || '').getTime();
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
  });

  const updateThreadInClub = (threadId: string, updater: (t: any) => any) => {
    const list = (club.forum_threads ?? []).map(t => String(t.id) === String(threadId) ? updater(t) : t);
    onClubUpdate({ ...club, forum_threads: list });
  };

  const toggleUpvote = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    const t = (club.forum_threads ?? []).find(x => String(x.id) === String(threadId));
    if (!t) return;
    const wasUpvoted = !!t.upvoted;
    const hadDownvoted = !!t.downvoted;
    // optimistic
    updateThreadInClub(threadId, x => ({
      ...x,
      upvoted: !wasUpvoted,
      downvoted: wasUpvoted ? x.downvoted : false,
      upvotes: (x.upvotes ?? 0) + (wasUpvoted ? -1 : 1),
      downvotes: wasUpvoted ? (x.downvotes ?? 0) : Math.max(0, (x.downvotes ?? 0) - (x.downvoted ? 1 : 0)),
    }));
    try {
      if (wasUpvoted) {
        await clubService.removeUpvoteThread(threadId);
      } else {
        if (hadDownvoted) await clubService.removeDownvoteThread(threadId);
        await clubService.upvoteThread(threadId);
      }
    } catch (e) {
      // revert on error
      updateThreadInClub(threadId, x => ({
        ...x,
        upvoted: wasUpvoted,
        downvoted: x.downvoted,
        upvotes: (x.upvotes ?? 0) + (wasUpvoted ? 1 : -1),
        downvotes: x.downvotes,
      }));
    }
  };

  const toggleDownvote = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    const t = (club.forum_threads ?? []).find(x => String(x.id) === String(threadId));
    if (!t) return;
    const wasDownvoted = !!t.downvoted;
    const hadUpvoted = !!t.upvoted;
    // optimistic
    updateThreadInClub(threadId, x => ({
      ...x,
      downvoted: !wasDownvoted,
      upvoted: wasDownvoted ? x.upvoted : false,
      downvotes: (x.downvotes ?? 0) + (wasDownvoted ? -1 : 1),
      upvotes: wasDownvoted ? (x.upvotes ?? 0) : Math.max(0, (x.upvotes ?? 0) - (x.upvoted ? 1 : 0)),
    }));
    try {
      if (wasDownvoted) {
        await clubService.removeDownvoteThread(threadId);
      } else {
        if (hadUpvoted) await clubService.removeUpvoteThread(threadId);
        await clubService.downvoteThread(threadId);
      }
    } catch (e) {
      // revert on error
      updateThreadInClub(threadId, x => ({
        ...x,
        downvoted: wasDownvoted,
        upvoted: x.upvoted,
        downvotes: (x.downvotes ?? 0) + (wasDownvoted ? 1 : -1),
        upvotes: x.upvotes,
      }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Thread title"
          className="w-full border border-gray-300 rounded-lg px-3 py-1 mb-2"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Thread content"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 resize-none"
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <Button
          onClick={handleCreate}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          Create Thread
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {sortedThreads.map(thread => (
        <div
          key={thread.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md cursor-pointer"
          onClick={() => onSelectThread(thread)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{thread.title}</h4>
              <p className="text-xs text-gray-500">
                By {thread.author} • {thread.replies} replies
              </p>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <button
                className={`p-1 rounded hover:bg-gray-100 ${thread.upvoted ? 'text-orange-600' : ''}`}
                onClick={(e) => toggleUpvote(e, thread.id)}
                aria-label="Upvote thread"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <span className="text-sm">{thread.upvotes ?? 0}</span>
              <button
                className={`p-1 rounded hover:bg-gray-100 ${thread.downvoted ? 'text-blue-600' : ''}`}
                onClick={(e) => toggleDownvote(e, thread.id)}
                aria-label="Downvote thread"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <span className="text-sm">{thread.downvotes ?? 0}</span>
              <span className="text-xs text-gray-400">• score: {(thread.upvotes ?? 0) - (thread.downvotes ?? 0)}</span>
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => setShareThreadId(prev => (prev === String(thread.id) ? null : String(thread.id)))}
                  aria-label="Share thread"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {shareThreadId === String(thread.id) && (
                  <SharePopup
                    url={`${window.location.origin}/clubs/${club.id}/threads/${thread.id}`}
                    onClose={() => setShareThreadId(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && !loading && (
        <div className="flex justify-center py-4">
          <Button onClick={loadMore} disabled={loadingMore} className="px-4 py-2">
            {loadingMore ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</span>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
