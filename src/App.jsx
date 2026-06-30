import MainLayout from './components/layout/MainLayout'
import useUIStore from './store/uiStore'

// View (Page) Components placeholder importları
// Birazdan bunları oluşturacağız
import FeedPage from './pages/FeedPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import TribePage from './pages/TribePage'
import SearchPage from './pages/SearchPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import AccountSettingsPage from './pages/AccountSettingsPage'

export default function App() {
  const { centerView, centerViewParams } = useUIStore()

  // Routing'i URL değiştirmeden (Zustand üzerinden) yönetiyoruz
  // plan.md'ye göre "URL değişmeden content load olur" isteniyordu.
  
  const renderCenterView = () => {
    switch (centerView) {
      case 'feed':
        return <FeedPage cacheType={centerViewParams.cacheType} />
      case 'post':
        return <PostDetailPage postId={centerViewParams.postId} />
      case 'profile':
        return <ProfilePage actorId={centerViewParams.actorId} />
      case 'tribe':
        return <TribePage tribeId={centerViewParams.tribeId} />
      case 'search':
        return <SearchPage query={centerViewParams.query} mode={centerViewParams.mode} />
      case 'leaderboard':
        return <LeaderboardPage type={centerViewParams.type} />
      case 'login':
        return <LoginPage />
      case 'register':
        return <RegisterPage />
      case 'account-settings':
        return <AccountSettingsPage />
      default:
        return <FeedPage />
    }
  }

  return (
    <MainLayout>
      {renderCenterView()}
    </MainLayout>
  )
}
