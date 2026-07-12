import MainLayout from './components/layout/MainLayout'
import useUIStore from './store/uiStore'
import { Toaster } from 'react-hot-toast'

// View (Page) Components placeholder importları
// Birazdan bunları oluşturacağız
import FeedPage from './pages/FeedPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import TribePage from './pages/TribePage'
import TribeSettingsPage from './pages/TribeSettingsPage'
import SearchPage from './pages/SearchPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import InitProfilePage from './pages/auth/InitProfilePage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import ContentItemPage from './pages/ContentItemPage'
import CreateEditBotPage from './pages/bot/CreateEditBotPage'
import CreateTribePage from './pages/tribe/CreateTribePage'
import CreateEditPostPage from './pages/post/CreateEditPostPage'

import HierarchyPage from './pages/HierarchyPage'

import { Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <MainLayout>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/post" element={<PostDetailPage />} />
          <Route path="/entry" element={<ContentItemPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tribe" element={<TribePage />} />
          <Route path="/tribe/settings" element={<TribeSettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create-bot" element={<CreateEditBotPage />} />
          <Route path="/edit-bot" element={<CreateEditBotPage />} />
          <Route path="/create-tribe" element={<CreateTribePage />} />
          <Route path="/create-post" element={<CreateEditPostPage />} />
          <Route path="/edit-post" element={<CreateEditPostPage />} />
          <Route path="/init-profile" element={<InitProfilePage />} />
          <Route path="/account-settings" element={<AccountSettingsPage />} />
          <Route path="/hierarchy" element={<HierarchyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </>
  )
}

