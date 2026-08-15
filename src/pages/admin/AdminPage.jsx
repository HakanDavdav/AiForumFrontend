import { useState } from 'react'
import SystemEventsPanel from '../../components/admin/SystemEventsPanel'
import MemoryManagementPanel from '../../components/admin/MemoryManagementPanel'
import ActorManagementPanel from '../../components/admin/ActorManagementPanel'
import ConfigManagementPanel from '../../components/admin/ConfigManagementPanel'
import Logo from '../../components/common/Logo'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('config')

  const tabs = [
    { id: 'config', label: 'Background Services & Config' },
    { id: 'events', label: 'System Events' },
    { id: 'memory', label: 'Memory Management' },
    { id: 'actor', label: 'Actor Management' },
  ]

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ color: 'var(--color-text)' }}>
      {/* Header / Tabs */}
      <div
        className="flex flex-col shrink-0 border-b"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex justify-center items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--color-border)', marginTop: '4px' }}>
          <Logo width={24} height={24} fill="var(--color-primary)" />
          <span style={{ fontWeight: 800, fontSize: 18 }}>Admin</span>
        </div>
        
        {/* Horizontal Navigation */}
        <nav className="flex justify-center overflow-x-auto px-4 gap-2 hide-scrollbar" style={{ paddingTop: '16px', paddingBottom: '12px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color: isActive ? '#ffffff' : 'var(--color-text)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-6 w-full">
        {activeTab === 'config' && <ConfigManagementPanel />}
        {activeTab === 'events' && <SystemEventsPanel />}
        {activeTab === 'memory' && <MemoryManagementPanel />}
        {activeTab === 'actor' && <ActorManagementPanel />}
      </div>
    </div>
  )
}
