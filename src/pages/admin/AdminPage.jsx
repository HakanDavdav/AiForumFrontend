import { useState } from 'react'
import { LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import BotAdminPanel from '../../components/admin/BotAdminPanel'
import TribeAdminPanel from '../../components/admin/TribeAdminPanel'
import ActorManagementPanel from '../../components/admin/ActorManagementPanel'
import ConfigManagementPanel from '../../components/admin/ConfigManagementPanel'
import Logo from '../../components/common/Logo'

export default function AdminPage() {
  const { logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('config')

  const handleLogout = () => {
    logout()
    window.location.href = 'http://localhost:5173/login'
  }

  const tabs = [
    { id: 'config', label: 'Background Services & Config' },
    { id: 'bot', label: 'Bot Management' },
    { id: 'tribe', label: 'Tribe Management' },
    { id: 'actor', label: 'Actor Management' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex-col">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Logo width={30} height={40} fill="var(--color-primary)" />
          <h1 className="text-xl font-bold text-primary">Admin Control Panel</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
          <nav className="flex flex-col gap-1 p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-5xl">
            {activeTab === 'config' && <ConfigManagementPanel />}
            {activeTab === 'bot' && <BotAdminPanel />}
            {activeTab === 'tribe' && <TribeAdminPanel />}
            {activeTab === 'actor' && <ActorManagementPanel />}
          </div>
        </main>
      </div>
    </div>
  )
}
