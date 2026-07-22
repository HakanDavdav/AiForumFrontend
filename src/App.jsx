import MainLayout from './components/layout/MainLayout'
import useUIStore from './store/uiStore'
import useThemeStore from './store/themeStore'
import { useEffect } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import InitProfileGuard from './components/auth/InitProfileGuard'

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
import MindPage from './pages/MindPage'
import EnrichNewsPoolPage from './pages/news/EnrichNewsPoolPage'

import { Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  const { isDarkMode, isGreenMode } = useThemeStore()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (isGreenMode) {
      document.documentElement.classList.add('theme-green')
    } else {
      document.documentElement.classList.remove('theme-green')
    }
  }, [isGreenMode])

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 10000 }}>
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      opacity: 0.5,
                      fontSize: '20px',
                      marginLeft: '8px',
                      padding: '0 4px',
                      lineHeight: 1
                    }}
                    title="Close"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <MainLayout>
        <InitProfileGuard>
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
            <Route path="/mind" element={<MindPage />} />
            <Route path="/enrich-news" element={<EnrichNewsPoolPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </InitProfileGuard>
      </MainLayout>
    </>
  )
}

