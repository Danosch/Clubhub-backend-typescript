import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react';
import { bookmarksService } from '../services/BookmarksService';
import type { BookmarkedPost } from '../types';
import Toast from '../../../components/Toast';
import Avatar from '../../../components/Avatar';
import ImageLightbox from '../../../components/ImageLightbox';
import { formatDateTime } from '../../../utils/date';
import { ApiError } from '../../../services/api';

/**
 * Page listing the user's bookmarked posts with basic actions.
 */
export default function BookmarksPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const data = await bookmarksService.getAll();
        setBookmarks(data);
      } catch (err) {
        setError('Failed to load bookmarks');
      }
    };
    fetchBookmarks();
  }, []);

  const handleRemove = async (id: string) => {
    const prev = [...bookmarks];
    setBookmarks(prev => prev.filter(b => b.id !== id));
    try {
      await bookmarksService.remove(id);
    } catch (e) {
      setBookmarks(prev);
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setError('You do not have permission to modify bookmarks.');
      } else {
        setError('Failed to remove bookmark');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>

      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map(post => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer"
              onClick={() =>
                navigate(`/posts/${post.id}` as string, {
                  state: { from: location.pathname },
                })
              }
            >
              {/* Header */}
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

              {/* Content */}
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

              {/* Actions */}
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-1">
                  <Heart className={`w-4 h-4 ${post.liked ? 'text-orange-500' : ''}`} />
                  <span className="text-sm">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                </div>
                <button className="flex items-center gap-1 hover:text-orange-500" onClick={(e) => { e.stopPropagation(); }}>
                  <Bookmark
                    className="w-4 h-4 text-orange-500"
                    onClick={() => handleRemove(post.id)}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
          <p className="text-gray-600">Bookmark posts to find them here later</p>
        </div>
      )}
      {error && <Toast message={error} onClose={() => setError(null)} />}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
