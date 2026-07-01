import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import useUIStore from '../store/uiStore'
import EditProfileModal from '../components/profile/EditProfileModal'
import ChangeUsernameModal from '../components/auth/ChangeUsernameModal'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import TwoFactorModal from '../components/auth/TwoFactorModal'
import DeleteAccountModal from '../components/auth/DeleteAccountModal'
import ChangeEmailModal from '../components/auth/ChangeEmailModal'
import ChangePhoneModal from '../components/auth/ChangePhoneModal'

export default function AccountSettingsPage() {
  const [activeModal, setActiveModal] = useState(null) // null, 'editProfile', 'changeUsername', 'changePassword', 'twoFactor', 'deleteAccount', 'changeEmail', 'changePhone'
  const { setCenterView } = useUIStore()

  return (
    <div className="flex-col gap-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
        <button 
          className="btn-icon" 
          onClick={() => setCenterView('feed')}
          title="Geri Dön"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Hesap Ayarları
        </h1>
      </div>

      {/* Profil Ayarları Bölümü */}
      <div className="card-surface flex-col gap-4" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Profil Ayarları</h2>
        <p className="text-muted" style={{ fontSize: 14 }}>
          Diğer kullanıcıların sizi nasıl göreceğini (isim, resim, hakkında) belirleyin.
        </p>
        <div>
          <button className="btn btn-outline" onClick={() => setActiveModal('editProfile')}>
            Profili Düzenle
          </button>
        </div>
      </div>

      {/* Hesap & Güvenlik Bölümü */}
      <div className="card-surface flex-col gap-4" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Hesap & Güvenlik</h2>
        <p className="text-muted" style={{ fontSize: 14 }}>
          Giriş bilgilerinizi güncelleyin ve hesabınızı güvende tutun.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setActiveModal('changeEmail')}>
            E-posta Değiştir
          </button>
          <button className="btn btn-outline" onClick={() => setActiveModal('changePhone')}>
            Telefon Ekle/Değiştir
          </button>
          <button className="btn btn-outline" onClick={() => setActiveModal('changeUsername')}>
            Kullanıcı Adı Değiştir
          </button>
          <button className="btn btn-outline" onClick={() => setActiveModal('changePassword')}>
            Şifre Değiştir
          </button>
          <button className="btn btn-outline" onClick={() => setActiveModal('twoFactor')}>
            İki Aşamalı Doğrulama (2FA)
          </button>
        </div>
      </div>

      {/* Tehlikeli Alan Bölümü */}
      <div className="card-surface flex-col gap-4" style={{ padding: 24, border: '1px solid var(--color-error)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 8 }}>Tehlikeli İşlemler</h2>
        <p className="text-muted" style={{ fontSize: 14 }}>
          Hesabınızı silmek kalıcı bir işlemdir. Bütün verileriniz silinir.
        </p>
        <div>
          <button 
            className="btn" 
            style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
            onClick={() => setActiveModal('deleteAccount')}
          >
            Hesabımı Sil
          </button>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={activeModal === 'editProfile'} 
        onClose={() => setActiveModal(null)} 
      />
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
