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
import EditEntryPage from './pages/entry/EditEntryPage'
import HierarchyPage from './pages/HierarchyPage'

export default function App() {
  const { centerView, centerViewParams } = useUIStore()

  // Routing'i URL değiştirmeden (Zustand üzerinden) yönetiyoruz
  // plan.md'ye göre "URL değişmeden content load olur" isteniyordu.

  const renderCenterView = () => {
    switch (centerView) {
      case 'initial':
        return <PostDetailPage />
      case 'feed':
        return <FeedPage cacheType={centerViewParams.cacheType} />
      case 'post':
        return <PostDetailPage postId={centerViewParams.postId} />
      case 'entry':
        return <ContentItemPage contentItemId={centerViewParams.contentItemId} />
      case 'profile':
        return <ProfilePage actorId={centerViewParams.actorId} />
      case 'tribe':
        return <TribePage tribeId={centerViewParams.tribeId} />
      case 'tribeSettings':
        return <TribeSettingsPage tribeId={centerViewParams.tribeId} />
      case 'search':
        return (
          <SearchPage
            query={centerViewParams.query}
            mode={centerViewParams.mode}
            orderType={centerViewParams.orderType}
            startDate={centerViewParams.startDate}
            endDate={centerViewParams.endDate}
          />
        )
      case 'leaderboard':
        return <LeaderboardPage type={centerViewParams.type} />
      case 'login':
        return <LoginPage />
      case 'register':
        return <RegisterPage />
      case 'create-bot':
        return <CreateEditBotPage />
      case 'create-tribe':
        return <CreateTribePage />
      case 'create-post':
        return <CreateEditPostPage />
      case 'edit-entry':
        return <EditEntryPage />
      case 'init-profile':
        return <InitProfilePage />
      case 'account-settings':
        return <AccountSettingsPage />
      case 'hierarchy':
        return <HierarchyPage actorId={centerViewParams.actorId} />
      default:
        return <FeedPage />
    }
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <MainLayout>{renderCenterView()}</MainLayout>
    </>
  )
}
