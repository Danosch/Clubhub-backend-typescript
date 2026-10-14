import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PostDetail from '../components/PostDetail';
import type { Post, Role } from '../types';
import { clubService } from '../services/ClubService';
import { useProfile } from '../../profile/hooks/useProfile';

export default function PostPage() {
  const { postId, clubId } = useParams<{ postId: string; clubId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useProfile();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    const statePost = (location.state as any)?.post as Post | undefined;
    if (statePost && String(statePost.id) === String(postId)) {
      setPost(statePost);
      setLoading(false);
      return;
    }
    clubService
      .getPost(postId)
      .then(p => setPost(p))
      .catch(e => setError(e?.message ?? 'Failed to load post'))
      .finally(() => setLoading(false));
  }, [postId, location.state]);

  const userRole: Role | undefined = clubId
    ? (user?.memberships.find(m => String(m.clubId) === String(clubId))?.role as Role | undefined)
    : undefined;

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

  if (!post) return null;

  return (
    <PostDetail
      post={post}
      clubId={clubId}
      currentUserRole={userRole}
      onBack={() => {
        const from = (location.state as any)?.from as string | undefined;
        if (from && typeof from === 'string') navigate(from);
        else if (clubId) navigate(`/clubs/${clubId}?tab=posts`);
        else navigate('/feed');
      }}
      backLabel={((): string => {
        const from = (location.state as any)?.from as string | undefined;
        if (!from) return clubId ? 'Back to Posts' : 'Back to Feed';
        if (from.includes('/feed')) return 'Back to Feed';
        if (from.includes('/bookmarks')) return 'Back to Bookmarks';
        return 'Back';
      })()}
      onPostUpdate={updated => setPost(updated)}
      onPostDelete={() => {
        if (clubId) navigate(`/clubs/${clubId}?tab=posts`);
        else navigate('/feed');
      }}
    />
  );
}

