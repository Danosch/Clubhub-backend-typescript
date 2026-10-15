import React, { useState, useEffect } from 'react';
import { Post, Comment, Role } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit3, Trash2, Image as PhotoIcon, Loader2 } from 'lucide-react';
import Button from '../../../components/Button';
import Toast from '../../../components/Toast';
import { ApiError } from '../../../services/api';
import SharePopup from '../../../components/SharePopup';
import { clubService } from '../services/ClubService';
import { formatDateTime } from '../../../utils/date';
import Avatar from '../../../components/Avatar';
import ImageLightbox from '../../../components/ImageLightbox';
import { useProfile } from '../../profile/hooks/useProfile';

/** Props for the dedicated post view. */
interface PostDetailProps {
  post: Post;
  clubId?: string; // optional; required only for manage actions
  currentUserRole?: Role;
  onBack: () => void;
  onPostUpdate?: (p: Post) => void;
  onPostDelete?: (id: string) => void;
  backLabel?: string;
}

/** Detailed post view with comments, likes, and sharing. */
export default function PostDetail({ post, clubId, currentUserRole, onBack, onPostUpdate, onPostDelete, backLabel }: PostDetailProps) {
  const [showShare, setShowShare] = useState(false);
  const [postData, setPostData] = useState(post);
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useProfile();
  // Derive club role from the post's clubId if explicit role not provided
  const derivedClubRole: Role | undefined = React.useMemo(() => {
    const cid = postData.clubId;
    if (!cid) return undefined;
    const role = user?.memberships.find(m => String(m.clubId) === String(cid))?.role;
    return role as Role | undefined;
  }, [postData.clubId, user]);
  // Pagination state for comments
  const [cmOffset, setCmOffset] = useState<number>(0);
  const [cmHasMore, setCmHasMore] = useState<boolean>(true);
  const [cmLoading, setCmLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setCmLoading(true);
      try {
        const limit = 10;
        const comments = await clubService.listCommentsPage(post.id, 0, limit);
        setPostData(p => ({ ...p, comments: comments.length, commentsList: comments }));
        setCmOffset(comments.length);
        setCmHasMore(comments.length >= limit);
        onPostUpdate?.({ ...post, comments: comments.length, commentsList: comments });
      } catch {}
      finally { setCmLoading(false); }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const loadMoreComments = async () => {
    if (cmLoading || !cmHasMore) return;
    setCmLoading(true);
    try {
      const limit = 10;
      const next = await clubService.listCommentsPage(post.id, cmOffset, limit);
      setPostData(p => {
        const list = [ ...(p.commentsList ?? []), ...next ];
        const updated = { ...p, commentsList: list, comments: list.length };
        onPostUpdate?.(updated);
        return updated;
      });
      setCmOffset(o => o + next.length);
      if (next.length < limit) setCmHasMore(false);
    } catch {}
    finally { setCmLoading(false); }
  };

  // Permissions
  const isAuthor = !!user?.name && String(postData.author) === String(user?.name);
  const canEdit = isAuthor; // only author can edit
  const canDelete = isAuthor || currentUserRole === 'ADMIN' || user?.role === 'ADMIN'; // author, club ADMIN, or global ADMIN can delete

  const handleLikePost = async () => {
    const isLiked = postData.liked ?? false;
    setPostData(p => {
      const next = {
        ...p,
        liked: !isLiked,
        likes: p.likes + (isLiked ? -1 : 1),
      };
      onPostUpdate?.(next);
      return next;
    });
    try {
      if (isLiked) await clubService.unlikePost(postData.id);
      else await clubService.likePost(postData.id);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to like posts.');
      }
      setPostData(p => {
        const next = {
          ...p,
          liked: isLiked,
          likes: p.likes + (isLiked ? 1 : -1),
        };
        onPostUpdate?.(next);
        return next;
      });
    }
  };

  const handleEditPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setActionError('Only image files are allowed.');
      e.currentTarget.value = '';
      return;
    }
    setEditPhoto(file);
    const url = URL.createObjectURL(file);
    if (editPreview) URL.revokeObjectURL(editPreview);
    setEditPreview(url);
  };

  const removeSelectedEditPhoto = () => {
    if (editPreview) URL.revokeObjectURL(editPreview);
    setEditPreview(null);
    setEditPhoto(null);
  };

  const removeServerPhoto = async () => {
    if (!canEdit) {
      setActionError('Only the author can edit this post.');
      return;
    }
    setSaving(true);
    try {
      const updated = await clubService.deletePostPicture(postData.id);
      setPostData(updated);
      onPostUpdate?.(updated);
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

  const saveEdit = async () => {
    if (!canEdit) {
      setActionError('Only the author can edit this post.');
      return;
    }
    const changedContent = editContent.trim() !== postData.content.trim();
    const hasNewPhoto = !!editPhoto;
    // If nothing changed, simply exit edit mode without errors
    if (!changedContent && !hasNewPhoto) {
      setEditing(false);
      setMenuOpen(false);
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditPreview(null);
      setEditPhoto(null);
      return;
    }
    setSaving(true);
    try {
      let updated: Post | null = null;
      // Update text content if changed (requires club context)
      if (changedContent) {
        if (!clubId) {
          setActionError('Cannot update text without club context.');
          setSaving(false);
          return;
        }
        updated = await clubService.updatePost(clubId, postData.id, editContent.trim());
      }
      // Update picture if a new local file is selected
      if (hasNewPhoto) {
        const dto = await clubService.updatePostPicture(postData.id, editPhoto!);
        updated = dto;
      }
      if (updated) {
        setPostData(updated);
        onPostUpdate?.(updated);
      }
      setEditing(false);
      setMenuOpen(false);
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditPreview(null);
      setEditPhoto(null);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to edit this post.');
      } else {
        setActionError('Failed to update post');
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!canDelete) {
      setActionError('You do not have permission to delete this post.');
      return;
    }
    if (!clubId) {
      setActionError('Cannot delete this post: missing club context.');
      return;
    }
    try {
      await clubService.deletePost(clubId, postData.id);
      onPostDelete?.(postData.id);
      onBack();
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to delete this post.');
      } else {
        setActionError('Failed to delete post');
      }
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Optimistically toggle like/unlike on the specific comment
    let prevLiked = false;
    setPostData(p => {
      const next = {
        ...p,
        commentsList: (p.commentsList ?? []).map(c => {
          if (c.id !== commentId) return c;
          prevLiked = !!c.liked;
          const nowLiked = !prevLiked;
          const nextLikes = (c.likes ?? 0) + (nowLiked ? 1 : -1);
          return { ...c, liked: nowLiked, likes: Math.max(0, nextLikes) };
        }),
      };
      onPostUpdate?.(next);
      return next;
    });
    try {
      if (prevLiked) await clubService.unlikeComment(commentId);
      else await clubService.likeComment(commentId);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to like comments.');
      }
      // Revert on error
      setPostData(p => ({
        ...p,
        commentsList: (p.commentsList ?? []).map(c => {
          if (c.id !== commentId) return c;
          const revertedLikes = (c.likes ?? 0) + (c.liked ? -1 : 1);
          return { ...c, liked: !c.liked, likes: Math.max(0, revertedLikes) };
        }),
      }));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await clubService.addComment(postData.id, commentText);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to comment.');
      }
    }

    try {
      const comments = await clubService.listCommentsPage(postData.id, 0, Math.max(10, (postData.commentsList?.length ?? 0)));
      setPostData(p => {
        const next = {
          ...p,
          comments: comments.length,
          commentsList: comments,
        };
        onPostUpdate?.(next);
        return next;
      });
      setCommentText('');
    } catch {}
  };

  const canDeleteComment = (c: Comment) => {
    const isAuthor = String(c.author?.id ?? '') === String(user?.id ?? '');
    const role = currentUserRole ?? derivedClubRole;
    const isClubAdmin = role === 'ADMIN';
    const isClubModerator = role === 'MODERATOR';
    const isGlobalAdmin = user?.role === 'ADMIN';
    return isAuthor || isClubAdmin || isClubModerator || isGlobalAdmin;
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!canDeleteComment(comment)) {
      setActionError('You do not have permission to delete this comment.');
      return;
    }
    // optimistic remove
    setPostData(p => ({
      ...p,
      comments: Math.max(0, p.comments - 1),
      commentsList: (p.commentsList ?? []).filter(c => c.id !== comment.id),
    }));
    try {
      await clubService.deleteComment(comment.id);
    } catch (e) {
      const err = e as any;
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You do not have permission to delete comments.');
      } else {
        setActionError('Failed to delete comment');
      }
      // revert: re-fetch comments to be consistent
      try {
        const comments = await clubService.listComments(postData.id);
        setPostData(p => ({ ...p, comments: comments.length, commentsList: comments }));
      } catch {}
    }
  };

  return (
    <>
    <div className="space-y-6">
      {actionError && <Toast message={actionError} onClose={() => setActionError(null)} />}
      <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
        ← {backLabel ?? 'Back'}
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar avatar={postData.avatar} size={40} />
          <div>
            <p className="font-medium text-gray-900">{postData.author}</p>
            <p className="text-sm text-gray-500">{formatDateTime(postData.time)}</p>
          </div>
          {(canEdit || canDelete) && (
            <div className="ml-auto relative">
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Post actions"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow z-10">
                  {canEdit && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                        setEditContent(postData.content);
                      }}
                    >
                      <Edit3 className="w-4 h-4 text-gray-600" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={deletePost}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {editing ? (
          <div className="mb-4">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none mb-2"
              rows={4}
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
              {editPreview && (
                <button
                  type="button"
                  onClick={removeSelectedEditPhoto}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  disabled={saving}
                >
                  Remove selected
                </button>
              )}
              {!editPreview && postData.picture && (
                <button
                  type="button"
                  onClick={removeServerPhoto}
                  className="px-3 py-1 border rounded text-sm text-red-600 hover:bg-red-50"
                  disabled={saving}
                >
                  Remove photo
                </button>
              )}
            </div>
            {(editPreview || postData.picture) && (
              <div className="w-full rounded-lg bg-gray-100 mb-2 flex items-center justify-center h-72 md:h-96 lg:h-[32rem] overflow-hidden">
                <img
                  src={editPreview ?? postData.picture}
                  alt="attachment"
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={saveEdit} disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                Save
              </Button>
              <button
                className="px-4 py-2 rounded border text-sm"
                onClick={() => {
                  setEditing(false);
                  setMenuOpen(false);
                  if (editPreview) URL.revokeObjectURL(editPreview);
                  setEditPreview(null);
                  setEditPhoto(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-4">{postData.content}</p>
            {postData.picture && (
              <button
                className="w-full rounded-lg bg-gray-100 mb-4 flex items-center justify-center h-72 md:h-96 lg:h-[32rem] overflow-hidden"
                onClick={() => setLightboxSrc(postData.picture!)}
                aria-label="Open image"
              >
                <img
                  src={postData.picture}
                  alt="attachment"
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            )}
          </>
        )}
        <div className="flex items-center gap-6 text-gray-500">
          <button
            className="flex items-center gap-1 hover:text-orange-500"
            onClick={handleLikePost}
          >
            <Heart className={`w-4 h-4 ${postData.liked ? 'text-orange-500' : ''}`} />
            <span className="text-sm">{postData.likes}</span>
          </button>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{postData.comments} comments</span>
          </span>
          <div className="relative">
            <button
              className="flex items-center gap-1 hover:text-orange-500"
              onClick={() => setShowShare(s => !s)}
            >
              <Share2 className="w-4 h-4" />
            </button>
            {showShare && (
              <SharePopup
                url={window.location.href}
                onClose={() => setShowShare(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
        {(postData.commentsList ?? []).map((c: Comment) => (
          <div key={c.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar avatar={c.author?.avatar} size={32} />
              <div>
                <p className="font-medium text-gray-900">{c.author?.username}</p>
                <p className="text-sm text-gray-500">{formatDateTime(c.time)}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">{c.content}</p>
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-orange-500"
                onClick={() => handleLikeComment(c.id)}
              >
                <Heart className={`w-4 h-4 ${c.liked ? 'text-orange-500' : ''}`} />
                <span className="text-sm">{c.likes ?? 0}</span>
              </button>
              {canDeleteComment(c) && (
                <button
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteComment(c)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {cmHasMore && (
        <div className="flex justify-center py-2">
          <Button onClick={loadMoreComments} disabled={cmLoading} className="px-4 py-2">
            {cmLoading ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</span>
            ) : (
              'Load more comments'
            )}
          </Button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Add a Comment</h4>
        <textarea
          placeholder="Write your comment..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          rows={3}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={handleAddComment}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
    {lightboxSrc && (
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    )}
  </>
  );
}
