import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Calendar, MapPin, Loader2 } from 'lucide-react';
import { bookmarksService } from '../../bookmarks/services/BookmarksService';
import Toast from '../../../components/Toast';
import { ApiError } from '../../../services/api';
import Button from '../../../components/Button';
import SharePopup from '../../../components/SharePopup';
import Avatar from '../../../components/Avatar';
import ImageLightbox from '../../../components/ImageLightbox';
import { clubService } from '../../clubs/services/ClubService';
import { useProfile } from '../../profile/hooks/useProfile';
import { type FeedItem, type FeedEventItem, type FeedPost, feedService } from '../services/FeedService';
import { formatDateTime } from '../../../utils/date';

interface EventFeedItem extends FeedEventItem {
  clubId: string;
  clubName: string;
  clubImage: string;
  isJoinedClub: boolean;
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  joinedCount: number;
  attendees?: { id: string; name: string; surname: string; email: string; avatar?: string }[];
}

const isEvent = (item: FeedItem): item is EventFeedItem =>
  (item as any).type === 'event';

/**
 * Unified feed combining upcoming events and recent posts.
 * Supports infinite scroll, bookmarking, liking, and event joins.
 */
export default function FeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useProfile();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlightRef = useRef(false); // prevents duplicate concurrent loads
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);
  const loaderElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  const [activeTab, setActiveTab] = useState<'events' | 'posts'>('posts');

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    inFlightRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const limit = 10;
      const currentOffset = offsetRef.current;
      const next = await feedService.getPage(currentOffset, limit);
      setItems(prev => {
        const existing = new Set(
          prev.map(i => (isEvent(i) ? `event-${i.id}` : (i as FeedPost).id))
        );
        const filtered = next.filter(item => {
          const key = isEvent(item)
            ? `event-${item.id}`
            : (item as FeedPost).id;
          if (existing.has(key)) return false;
          existing.add(key);
          return true;
        });
        return [...prev, ...filtered];
      });
      // Step the offset by limit to avoid overlap
      setOffset(o => o + limit);
      if (next.length < limit) setHasMore(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setError(message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    loaderElRef.current = node;
    if (!node) return;
    if (!observer.current) {
      observer.current = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (entry.isIntersecting && !inFlightRef.current && hasMoreRef.current) {
          // Temporarily unobserve to prevent rapid re-fires while loading
          if (loaderElRef.current) observer.current?.unobserve(loaderElRef.current);
          loadMore();
        }
      });
    }
    observer.current.observe(node);
  }, [loadMore]);

  // Re-observe loader after each load completes if more data is available
  useEffect(() => {
    if (!loadingMore && hasMoreRef.current && loaderElRef.current) {
      observer.current?.observe(loaderElRef.current);
    }
  }, [loadingMore, hasMore]);

  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set()); // key: `${clubId}-${eventId}`
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const visibleItems = items.filter(item =>
    activeTab === 'events' ? isEvent(item) : !isEvent(item)
  );

  useEffect(() => {
    if (!loading && visibleItems.length === 0 && hasMoreRef.current && !loadingMore && !inFlightRef.current) {
      loadMore();
    }
    }, [activeTab, visibleItems.length, hasMore, loadingMore, loadMore, loading]);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const list = await bookmarksService.getAll();
        setBookmarked(new Set(list.map(b => b.id)));
      } catch {}
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    if (!user) return;
    const set = new Set<string>();
    items.forEach(item => {
      if (isEvent(item)) {
        const key = `${item.clubId}-${item.id}`;
        const attendees = item.attendees || [];
        const joined = attendees.some(a => a.email === user.email) ||
          (item as any).joinedByUser || (item as any).isJoined;
        if (joined) set.add(key);
      }
    });
    setJoinedEvents(set);
  }, [items, user]);

  const toggleBookmark = async (post: FeedPost) => {
    const prev = new Set(bookmarked);
    const isBookmarked = prev.has(post.id);
    if (isBookmarked) {
      setBookmarked(next => {
        const copy = new Set(next);
        copy.delete(post.id);
        return copy;
      });
    } else {
      setBookmarked(next => {
        const copy = new Set(next);
        copy.add(post.id);
        return copy;
      });
    }
    try {
      if (isBookmarked) {
        await bookmarksService.remove(post.id);
      } else {
        await bookmarksService.add(post.id);
      }
    } catch (err) {
      setBookmarked(prev);
      setBookmarkError('Failed to update bookmark');
    }
  };

  const toggleLike = async (post: FeedPost) => {
    const isLiked = post.liked ?? false;
    setItems(prev =>
      prev.map(item =>
        isEvent(item)
          ? item
          : item.id === post.id
            ? { ...item, liked: !isLiked, likes: item.likes + (isLiked ? -1 : 1) }
            : item
      )
    );
    try {
      if (isLiked) await clubService.unlikePost(post.id);
      else await clubService.likePost(post.id);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to like posts.');
      }
      setItems(prev =>
        prev.map(item =>
          isEvent(item)
            ? item
            : item.id === post.id
              ? { ...item, liked: isLiked, likes: item.likes + (isLiked ? 1 : -1) }
              : item
        )
      );
    }
  };


  const handleJoinEvent = async (ev: EventFeedItem) => {
    if (!user) return;
    const key = `${ev.clubId}-${ev.id}`;
    const isJoined = joinedEvents.has(key);

    if (isJoined) {
      // Optimistic leave
      setJoinedEvents(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setItems(prev =>
        prev.map(item => {
          if (isEvent(item) && item.clubId === ev.clubId && item.id === ev.id) {
            const attendees = (item.attendees || []).filter(a => a.email !== user.email);
            return {
              ...item,
              attendees,
              joinedCount: Math.max(0, item.joinedCount - 1),
            };
          }
          return item;
        })
      );
      try {
        await clubService.leaveEvent(ev.clubId, ev.id);
      } catch (e) {
        const err = e as any;
        if (err instanceof ApiError && err.status === 403) {
          setActionError('You do not have permission to leave events.');
        }
        // Revert optimistic leave on error
        setJoinedEvents(prev => new Set(prev).add(key));
        setItems(prev =>
          prev.map(item => {
            if (isEvent(item) && item.clubId === ev.clubId && item.id === ev.id) {
              const attendees = item.attendees || [];
              return {
                ...item,
                attendees: [
                  ...attendees,
                  {
                    id: user.id,
                    name: user.name,
                    surname: (user as any).surname || '',
                    email: user.email,
                    avatar: user.avatar,
                  },
                ],
                joinedCount: item.joinedCount + 1,
              };
            }
            return item;
          })
        );
      }
      return;
    }

    // Optimistic join
    setJoinedEvents(prev => new Set(prev).add(key));
    setItems(prev =>
      prev.map(item => {
        if (isEvent(item) && item.clubId === ev.clubId && item.id === ev.id) {
          const attendees = item.attendees || [];
          return {
            ...item,
            attendees: [
              ...attendees,
              {
                id: user.id,
                name: user.name,
                surname: (user as any).surname || '',
                email: user.email,
                avatar: user.avatar,
              },
            ],
            joinedCount: item.joinedCount + 1,
          };
        }
        return item;
      })
    );
    try {
      await clubService.joinEvent(ev.clubId, ev.id);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to join events.');
      }
      // Revert optimistic join on error
      setJoinedEvents(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setItems(prev =>
        prev.map(item => {
          if (isEvent(item) && item.clubId === ev.clubId && item.id === ev.id) {
            const attendees = (item.attendees || []).filter(a => a.email !== user.email);
            return {
              ...item,
              attendees,
              joinedCount: Math.max(0, item.joinedCount - 1),
            };
          }
          return item;
        })
      );
    }
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
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 -mb-px font-medium ${
            activeTab === 'posts'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-600'
          }`}
        >
          Recent Posts
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 -mb-px font-medium ${
            activeTab === 'events'
              ? 'border-b-2 border-orange-500 text-orange-500'
              : 'text-gray-600'
          }`}
        >
          Events
        </button>
      </div>
      <div className="flex space-x-6">
        <main className="flex-1 space-y-4">
          {visibleItems.length === 0 && !loadingMore && (
            <p className="text-center text-gray-500">No items to show.</p>
      )}
      {actionError && (
        <Toast message={actionError} onClose={() => setActionError(null)} />
      )}
          <div className="space-y-4">
            {visibleItems.map((item, index) => {
            if (isEvent(item)) {
              const ev = item;
              const key = `${ev.clubId}-${ev.id}`;
              const joinedByUser = joinedEvents.has(key);
              return (
                <div
                  key={`event-${ev.clubId ?? 'unknown'}-${ev.id}-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar avatar={ev.clubImage} size={32} />
                      <div>
                        <p className="font-medium text-gray-900">{ev.clubName}</p>
                        <p className="text-sm text-gray-500">{ev.title}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{ev.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{ev.location || 'TBA'}</span>
                      </div>
                    </div>
                  </div>
                  {ev.description && (
                    <p className="text-gray-700 mb-2">{ev.description}</p>
                  )}
                  {ev.attendees && ev.attendees.length > 0 && (
                    <div className="flex -space-x-2 mb-2">
                      {ev.attendees.slice(0, 5).map((a: any) => (
                        <Avatar key={a.id} avatar={a.avatar} size={24} />
                      ))}
                      {ev.attendees.length > 5 && (
                        <span className="text-xs text-gray-500 self-end pl-2">
                          +{ev.attendees.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-500 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">{ev.joinedCount} joined</span>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => handleJoinEvent(ev)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          joinedByUser
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        {joinedByUser ? 'Leave' : 'Join'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            const post = item as FeedPost;
            return (
              <div
                key={`${post.clubId ?? 'unknown'}-${post.id}-${index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer"
                onClick={() =>
                  navigate(`/posts/${post.id}` as string, {
                    state: { from: location.pathname },
                  })
                }
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar avatar={post.authorAvatar} size={32} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{post.author}</span>
                      {post.clubName && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          {post.clubImage && <span className="mr-0.5">{post.clubImage}</span>}
                          • {post.clubName}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">• {formatDateTime(post.time)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{post.content}</p>
                {post.picture && (
                  <button
                    className="w-full rounded-lg bg-gray-100 mb-3 flex items-center justify-center h-64 md:h-80 lg:h-96 overflow-hidden"
                    onClick={(e) => { e.stopPropagation(); setLightboxSrc(post.picture!); }}
                    aria-label="Open image"
                  >
                    <img
                      src={post.picture}
                      alt="attachment"
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
                <div className="flex items-center gap-6 text-gray-500 mb-2">
                  <button
                    className="flex items-center gap-1 hover:text-orange-500"
                    onClick={e => {
                      e.stopPropagation();
                      toggleLike(post);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${post.liked ? 'text-orange-500' : ''}`} />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button
                    className="flex items-center gap-1 hover:text-orange-500"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/posts/${post.id}` as string, {
                        state: { from: location.pathname },
                      });
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      className="flex items-center gap-1 hover:text-orange-500"
                      onClick={() =>
                        setSharePostId(prev => (prev === post.id ? null : post.id))
                      }
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {sharePostId === post.id && (
                      <SharePopup
                        url={`${window.location.origin}/posts/${post.id}`}
                        onClose={() => setSharePostId(null)}
                      />
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleBookmark(post);
                    }}
                    className="flex items-center gap-1 hover:text-orange-500"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked.has(post.id) ? 'text-orange-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={loaderRef} />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        )}
        {!loadingMore && !hasMore && (
          <div className="text-center text-gray-500 py-4">No more new feeds</div>
        )}
      </main>
        {bookmarkError && (
          <Toast message={bookmarkError} onClose={() => setBookmarkError(null)} />
        )}
        {lightboxSrc && (
          <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
      </div>
    </div>
  );
}
