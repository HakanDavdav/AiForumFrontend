import { useState } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/common/BackButton'

import ChangeUsernameModal from '../components/auth/ChangeUsernameModal'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import TwoFactorModal from '../components/auth/TwoFactorModal'
import DeleteAccountModal from '../components/auth/DeleteAccountModal'
import ChangeEmailModal from '../components/auth/ChangeEmailModal'
import ChangePhoneModal from '../components/auth/ChangePhoneModal'
import useDevLog from '../utils/useDevLog'

export default function AccountSettingsPage() {
  useDevLog('AccountSettingsPage', arguments[0] || {})
  const [activeModal, setActiveModal] = useState(null) // null, 'editProfile', 'changeUsername', 'changePassword', 'twoFactor', 'deleteAccount', 'changeEmail', 'changePhone'
  const navigate = useNavigate()

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>
      
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(var(--color-primary-rgb, 99,102,241), 0.3)',
          }}
        >
          <Settings size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            Hesap Ayarları
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Profilinizi ve güvenlik tercihlerinizi yönetin.
          </p>
        </div>
      </div>



      {/* Hesap & Güvenlik Bölümü */}
      <div className="card-surface" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--color-text-primary)' }}>Hesap & Güvenlik</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            Giriş bilgilerinizi güncelleyin ve hesabınızı güvende tutun.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changeEmail')}>
            E-posta Değiştir
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changePhone')}>
            Telefon Ekle/Değiştir
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changeUsername')}>
            Kullanıcı Adı Değiştir
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changePassword')}>
            Şifre Değiştir
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('twoFactor')}>
            İki Aşamalı Doğrulama
          </button>
        </div>
      </div>

      {/* Tehlikeli Alan Bölümü */}
      <div className="card-surface" style={{ padding: 24, border: '1px solid var(--color-error)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 4 }}>Tehlikeli İşlemler</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            Hesabınızı silmek kalıcı bir işlemdir. Bütün verileriniz silinir.
          </p>
        </div>
        <div>
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--color-error)', color: '#fff', border: 'none' }}
            onClick={() => setActiveModal('deleteAccount')}
          >
            Hesabımı Sil
          </button>
        </div>
      </div>

      {/* Modals */}

      <ChangeUsernameModal 
        isOpen={activeModal === 'changeUsername'} 
        onClose={() => setActiveModal(null)} 
      />
      <ChangePasswordModal 
        isOpen={activeModal === 'changePassword'} 
        onClose={() => setActiveModal(null)} 
      />
      <TwoFactorModal 
        isOpen={activeModal === 'twoFactor'} 
        onClose={() => setActiveModal(null)} 
      />
      <DeleteAccountModal 
        isOpen={activeModal === 'deleteAccount'} 
        onClose={() => setActiveModal(null)} 
      />
      <ChangeEmailModal 
        isOpen={activeModal === 'changeEmail'} 
        onClose={() => setActiveModal(null)} 
      />
      <ChangePhoneModal 
        isOpen={activeModal === 'changePhone'} 
        onClose={() => setActiveModal(null)} 
      />
    </div>
  )
}
