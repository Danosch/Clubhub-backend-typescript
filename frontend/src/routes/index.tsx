import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ExplorePage from '../features/clubs/pages/ExplorePage';
import ClubDetailPage from '../features/clubs/pages/ClubDetailPage';
import PostPage from '../features/clubs/pages/PostPage';
import FeedPage from '../features/feed/pages/FeedPage';
import { ProfilePage, UserProfilePage } from '../features/profile/pages';
import SettingsPage from '../features/settings/pages/SettingsPage';
import SupportPage from '../features/support/SupportPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import MyClubsPage from '../features/clubs/pages/MyClubsPage';
import BookmarksPage from '../features/bookmarks/pages/BookmarksPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import AdminPage from '../features/admin/pages/AdminPage';
import ManageUsersPage from '../features/admin/pages/ManageUsersPage';
import AnalyticsPage from '../features/admin/pages/AnalyticsPage';
import ModerationPage from '../features/admin/pages/ModerationPage';
import RequireAuth from '../features/auth/components/RequireAuth';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * Top-level route configuration for the app.
 * Includes public auth routes and protected sections wrapped by `RequireAuth`.
 */
export default function AppRoutes() {
  const { token } = useAuth();
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/explore" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={token ? <Navigate to="/explore" replace /> : <RegisterPage />}
          />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
            <Route path="/clubs/:clubId/posts/:postId" element={<PostPage />} />
            <Route path="/posts/:postId" element={<PostPage />} />
            <Route path="/clubs/:clubId/threads/:threadId" element={<ClubDetailPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/my-clubs" element={<MyClubsPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/moderation" element={<ModerationPage />} />
            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Route>
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
