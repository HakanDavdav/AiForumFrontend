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
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

export default function AccountSettingsPage() {
  useDevLog('AccountSettingsPage', arguments[0] || {})
  const { isExternalAuth } = useAuthStore()
  const [activeModal, setActiveModal] = useState(null) // null, 'editProfile', 'changeUsername', 'changePassword', 'twoFactor', 'deleteAccount', 'changeEmail', 'changePhone'
  const navigate = useNavigate()
  const { t } = useTranslation()

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
        <div className="page-header-icon">
          <Settings size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {t('settings.account_settings')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('settings.account_settings_desc')}
          </p>
        </div>
      </div>



      {/* Hesap & Güvenlik Bölümü */}
      {!isExternalAuth && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--color-text-primary)' }}>{t('settings.account_security')}</h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              {t('settings.account_security_desc')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changeEmail')}>
              {t('settings.change_email')}
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changePhone')}>
              {t('settings.change_phone')}
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changeUsername')}>
              {t('settings.change_username')}
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('changePassword')}>
              {t('settings.change_password')}
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setActiveModal('twoFactor')}>
              {t('settings.two_factor')}
            </button>
          </div>
        </div>
      )}

      {/* Tehlikeli Alan Bölümü */}
      <div className="card-surface" style={{ padding: 24, border: '1px solid var(--color-error)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 4 }}>{t('settings.danger_zone')}</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            {t('settings.danger_zone_desc')}
          </p>
        </div>
        <div>
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--color-error)', color: '#fff', border: 'none' }}
            onClick={() => setActiveModal('deleteAccount')}
          >
            {t('settings.delete_account')}
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
