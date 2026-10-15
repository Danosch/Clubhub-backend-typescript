import React, { useState, ChangeEvent, useEffect, useRef, useCallback } from 'react';
// Lazy-load heavy emoji picker to reduce initial bundle size
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { Club, Post } from '../types';
import {
  MessageCircle,
  Heart,
  Share2,
  Image as PhotoIcon,
  Bookmark as BookmarkIcon,
  Smile,
  MoreHorizontal,
  Edit3,
  Trash2,
  Loader2
} from 'lucide-react';
import Button from '../../../components/Button';
import SharePopup from '../../../components/SharePopup';
import Avatar from '../../../components/Avatar';
import { bookmarksService } from '../../bookmarks/services/BookmarksService';
import { clubService } from '../services/ClubService';
import { formatDateTime } from '../../../utils/date';
import { useProfile } from '../../profile/hooks/useProfile';
import ProcessingBox from '../../../components/ProcessingBox';
import ImageLightbox from '../../../components/ImageLightbox';
import Toast from '../../../components/Toast';
import { ApiError } from '../../../services/api';

/** Props for the club Posts tab. */
interface PostsTabProps {
  club: Club;
  onClubUpdate: (c: Club) => void;
  onSelectPost: (p: Post) => void;
}

/**
 * Posts tab for composing posts, listing them, and quick actions
 * such as like, comment, share, and bookmark.
 */
export default function PostsTab({ club, onClubUpdate, onSelectPost }: PostsTabProps) {
  // Local posts state (Club no longer embeds posts)
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText]   = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [photo, setPhoto] = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Poll creation removed; composer now only supports text + optional image
  const [error, setError]       = useState<string|null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  // Infinite scroll state
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlightRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(offset);
  const loaderElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  const clubRef = useRef(club);
  useEffect(() => { clubRef.current = club; }, [club]);
  const postsRef = useRef<Post[]>(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    inFlightRef.current = true;
    setLoadingMore(true);
    try {
      const limit = 10;
      const next = await clubService.listPostsPage(clubRef.current.id, offsetRef.current, limit);
      if (next && next.length > 0) {
        const existing = new Set(postsRef.current.map(p => p.id));
        const filtered = next.filter(p => {
          if (existing.has(p.id)) return false;
          existing.add(p.id);
          return true;
        });
        if (filtered.length > 0) {
          setPosts(prev => [...prev, ...filtered]);
        }
        setOffset(o => o + limit);
      }
      if (!next || next.length < 10) setHasMore(false);
    } catch (e) {
      // Swallow silently; optional: use a toast if needed
    } finally {
      setLoadingMore(false);
      inFlightRef.current = false;
    }
  }, [onClubUpdate]);

  // Initial fetch when the Posts tab mounts
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  // IntersectionObserver to trigger loading more when the sentinel enters viewport
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    loaderElRef.current = node;
    if (!node) return;
    if (!observer.current) {
      observer.current = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (entry.isIntersecting && !inFlightRef.current && hasMoreRef.current) {
          if (loaderElRef.current) observer.current?.unobserve(loaderElRef.current);
          loadMore();
        }
      });
    }
    observer.current.observe(node);
  }, [loadMore]);

  // Re-observe loader after each load completes if more data remains
  useEffect(() => {
    if (!loadingMore && hasMoreRef.current && loaderElRef.current) {
      observer.current?.observe(loaderElRef.current);
    }
  }, [loadingMore, hasMore]);

  // edit state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Role-based permissions
  const { user } = useProfile();
  const membership = user?.memberships?.find(m => String(m.clubId) === String(club.id));
  // Creating posts: only Admin/Moderator members of the club
  const canPost = membership?.role === 'ADMIN' || membership?.role === 'MODERATOR';
  // Editing: only the author of the post
  const isAuthor = (post: Post) => !!user?.name && String(post.author) === String(user?.name);
  const canEditPost = (post: Post) => isAuthor(post);
  // Deleting: author of the post OR club ADMIN OR global ADMIN
  const canDeletePost = (post: Post) =>
    isAuthor(post) || membership?.role === 'ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    setLikedPosts(posts.filter((p: any) => p.liked).map(p => p.id));
  }, [posts]);

  useEffect(() => {
    bookmarksService
      .getAll()
      .then(list => setBookmarks(list.map(b => b.id)))
      .catch(() => {});
  }, []);

  const toggleBookmark = async (post: Post) => {
    const isBookmarked = bookmarks.includes(post.id);
    // optimistic update
    if (isBookmarked) setBookmarks(b => b.filter(x => x !== post.id));
    else setBookmarks(b => [...b, post.id]);
    try {
      if (isBookmarked) await bookmarksService.remove(post.id);
      else await bookmarksService.add(post.id);
    } catch (e) {
      // revert
      setBookmarks(prev => (isBookmarked ? [...prev, post.id] : prev.filter(x => x !== post.id)));
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to modify bookmarks.');
      } else {
        setActionError('Failed to update bookmark');
      }
    }
  };

  const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB
  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      e.currentTarget.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 100MB or smaller.');
      e.currentTarget.value = '';
      return;
    }
    setError(null);
    setPhoto(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleEditPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setActionError('Only image files are allowed.');
      e.currentTarget.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setActionError('Image must be 100MB or smaller.');
      e.currentTarget.value = '';
      return;
    }
    setEditPhoto(file);
    const url = URL.createObjectURL(file);
    if (editPhotoPreview) URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoPreview(url);
  };

  // Remove selected image while composing a new post
  const removeSelectedPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  };

  // Remove selected replacement image during edit (client-side only)
  const removeSelectedEditPhoto = () => {
    if (editPhotoPreview) URL.revokeObjectURL(editPhotoPreview);
    setEditPhoto(null);
    setEditPhotoPreview(null);
  };

  // Poll creation removed

  const handlePost = async () => {
    setError(null);
    if (!text.trim()) {
      setError('Add some text to your post.');
      return;
    }
    if (!canPost) {
      setError('Only moderators and admins can post in this club.');
      return;
    }

    try {
      setPosting(true);
      const created = await clubService.createPost(club.id, text, photo ?? undefined);
      setPosts(prev => [created, ...prev]);
      setText('');
      setPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
      // Poll-related resets removed
      onSelectPost(created);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setError('You do not have permission to create posts in this club.');
      } else {
        setError('Failed to create post');
      }
    } finally {
      setPosting(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText(prev => prev + emoji);
      setEmojiOpen(false);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const next = before + emoji + after;
    setText(next);
    setEmojiOpen(false);
    // restore caret after inserted emoji
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emoji.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const handleLike = async (post: Post) => {
    const isLiked = likedPosts.includes(post.id);
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, liked: !isLiked, likes: p.likes + (isLiked ? -1 : 1) }
        : p
    ));
    setLikedPosts(prev =>
      isLiked ? prev.filter(id => id !== post.id) : [...prev, post.id]
    );
    try {
      if (isLiked) await clubService.unlikePost(post.id);
      else await clubService.likePost(post.id);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to like posts.');
      }
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, liked: isLiked, likes: p.likes + (isLiked ? 1 : -1) }
          : p
      ));
      setLikedPosts(prev =>
        isLiked ? [...prev, post.id] : prev.filter(id => id !== post.id)
      );
    }
  };

  const startEdit = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditPhoto(null);
    if (editPhotoPreview) {
      URL.revokeObjectURL(editPhotoPreview);
      setEditPhotoPreview(null);
    }
    setMenuPostId(null);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    if (editPhotoPreview) {
      URL.revokeObjectURL(editPhotoPreview);
      setEditPhotoPreview(null);
    }
    setEditPhoto(null);
  };

  const saveEdit = async (post: Post) => {
    if (!canEditPost(post)) {
      setActionError('Only the author can edit this post.');
      return;
    }
    setSaving(true);
    try {
      let updated: Post | null = null;
      // Update content first if changed
      if (editContent.trim() !== post.content.trim()) {
        updated = await clubService.updatePost(club.id, post.id, editContent.trim());
      }
      // Update picture if a new photo is selected
      if (editPhoto) {
        const dto = await clubService.updatePostPicture(post.id, editPhoto);
        updated = dto;
      }
      // If nothing changed, just exit
      if (!updated) {
        cancelEdit();
        return;
      }
      setPosts(prev => prev.map(p => (p.id === post.id ? updated! : p)));
      cancelEdit();
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to edit posts in this club.');
      } else {
        setActionError('Failed to update post');
      }
    } finally {
      setSaving(false);
    }
  };

  // Remove existing server-side photo for a post while editing
  const removePostPhoto = async (post: Post) => {
    if (!canEditPost(post)) {
      setActionError('Only the author can edit this post.');
      return;
    }
    setSaving(true);
    try {
      const updated = await clubService.deletePostPicture(post.id);
      setPosts(prev => prev.map(p => (p.id === post.id ? updated : p)));
      // clear any client-side selection/preview
      removeSelectedEditPhoto();
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to remove the photo.');
      } else {
        setActionError('Failed to remove photo');
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (post: Post) => {
    if (!canDeletePost(post)) {
      setActionError('You do not have permission to delete this post.');
      return;
    }
    setMenuPostId(null);
    try {
      await clubService.deletePost(club.id, post.id);
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to delete posts in this club.');
      } else {
        setActionError('Failed to delete post');
      }
    }
  };

  return (
    <>
      {posting && <ProcessingBox message="Creating post..." />}
      {actionError && <Toast message={actionError} onClose={() => setActionError(null)} />}
      <div className="space-y-4">
        {canPost && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
              <textarea
                placeholder="What's on your mind?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                ref={textareaRef}
              />

              {/* Poll creation removed */}

              <div className="flex items-center gap-4 mt-2 relative">
                <label className="p-2 cursor-pointer hover:bg-gray-100 rounded-full">
                  <PhotoIcon className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhoto}
                  />
                </label>
                {/* Poll toggle removed */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(o => !o)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Smile className="w-5 h-5 text-gray-500" />
                  </button>
                  {emojiOpen && (
                    <div className="absolute z-10 mt-2">
                      <React.Suspense fallback={<div className="p-2 text-sm text-gray-500">Loading emojis…</div>}>
                        <EmojiPicker
                          width={300}
                          height={300}
                          skinTonesDisabled
                          previewConfig={{ showPreview: false }}
                          onEmojiClick={(emojiData: any) => insertEmoji(emojiData.emoji)}
                        />
                      </React.Suspense>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handlePost}
                  className="ml-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Post
                </Button>
              </div>
            </div>

            {photoPreview && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Image preview</p>
                  <button
                    type="button"
                    onClick={removeSelectedPhoto}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="w-full rounded-lg bg-gray-100 flex items-center justify-center h-64 md:h-80 lg:h-96 overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </>
        )}

      {posts.map(post => {
        const isBookmarked = bookmarks.includes(post.id);
        return (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar avatar={post.avatar} size={32} />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">{post.author}</span>
                <span className="text-xs text-gray-500">• {club.name}</span>
                <span className="text-xs text-gray-500">• {formatDateTime(post.time)}</span>
              </div>
              {(canEditPost(post) || canDeletePost(post)) && (
                <div className="ml-auto relative">
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setMenuPostId(prev => (prev === post.id ? null : post.id))}
                    aria-label="Post actions"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                  {menuPostId === post.id && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow z-10">
                      {canEditPost(post) && (
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => startEdit(post)}
                        >
                          <Edit3 className="w-4 h-4 text-gray-600" /> Edit
                        </button>
                      )}
                      {canDeletePost(post) && (
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => deletePost(post)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {editingPostId === post.id ? (
              <div className="mb-2">
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none mb-2"
                  rows={3}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  disabled={saving}
                />
                <div className="flex items-center gap-3 mb-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1 border rounded cursor-pointer hover:bg-gray-50">
                    <PhotoIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Change photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleEditPhoto} />
                  </label>
                  {editPhotoPreview && (
                    <button
                      type="button"
                      onClick={removeSelectedEditPhoto}
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    >
                      Remove selected
                    </button>
                  )}
                  {!editPhotoPreview && post.picture && (
                    <button
                      type="button"
                      onClick={() => removePostPhoto(post)}
                      className="px-3 py-1 border rounded text-sm text-red-600 hover:bg-red-50"
                      disabled={saving}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                {(editPhotoPreview || post.picture) && (
                  <div className="w-full rounded-lg bg-gray-100 mb-2 flex items-center justify-center h-64 md:h-80 lg:h-96 overflow-hidden">
                    <img
                      src={editPhotoPreview ?? post.picture}
                      alt="attachment"
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button onClick={() => saveEdit(post)} disabled={saving} className="bg-orange-500 text-white px-3 py-1.5">
                    Save
                  </Button>
                  <button className="px-3 py-1.5 rounded border text-sm" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 mb-2">{post.content}</p>
                {post.picture && (
                  <button
                    className="w-full rounded-lg bg-gray-100 mb-2 flex items-center justify-center h-64 md:h-80 lg:h-96 overflow-hidden"
                    onClick={() => setLightboxSrc(post.picture!)}
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
              </>
            )}

            {post.poll && (
              <div className="mb-2">
                <p className="font-medium">{post.poll.question}</p>
                <ul className="list-disc list-inside">
                  {post.poll.options.map((o,i)=>(
                    <li key={i} className="text-gray-700 text-sm">
                      {o.text} — {o.votes} votes
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-6 text-gray-500">
              <button
                className="flex items-center gap-1 hover:text-orange-500"
                onClick={() => handleLike(post)}
              >
                <Heart className={`w-4 h-4 ${likedPosts.includes(post.id) ? 'text-orange-500' : ''}`} />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button
                className="flex items-center gap-1 hover:text-orange-500"
                onClick={() => onSelectPost(post)}
              >
                <MessageCircle className="w-4 h-4" /><span className="text-sm">{post.comments}</span>
              </button>
              <div className="relative">
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
                className="flex items-center gap-1 hover:text-orange-500"
                onClick={() => toggleBookmark(post)}
              >
                <BookmarkIcon
                  className={`w-4 h-4 ${isBookmarked ? 'text-orange-500' : 'text-gray-500'}`}
                />
              </button>
            </div>
          </div>
        );
      })}
      <div ref={loaderRef} />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}
      {!loadingMore && !hasMore && (
        <div className="text-center text-gray-500 py-4">No more posts</div>
      )}
    </div>
    {lightboxSrc && (
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    )}
  </>
  );
}
