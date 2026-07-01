import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Auth Store — kullanıcının oturum bilgilerini tutar.
 *
 * actorId: Login response'unda backend'den gelen Guid.
 * Logout olana kadar localStorage'da persist edilir.
 * Sayfa yenilenince kaybolmaz.
 *
 * Kullanımı:
 *   const { actorId, isLoggedIn, setAuth, logout } = useAuthStore()
 */
const useAuthStore = create(
  persist(
    (set) => ({
      actorId: null,       // string (Guid) | null
      isProfileCreated: false,

      /**
       * Login başarılı olunca çağrılır.
       * @param {string} actorId - backend'den gelen Guid string
       * @param {boolean} isProfileCreated - profil oluşturulmuş mu?
       */
      setAuth: (actorId, isProfileCreated) => set({
        actorId,
        isProfileCreated,
        isLoggedIn: true,
      }),

      setProfileCreated: (status) => set({
        isProfileCreated: status
      }),

      /**
       * Logout olunca çağrılır.
       * actorId ve isLoggedIn sıfırlanır.
       */
      logout: () => set({
        actorId: null,
        isProfileCreated: false,
        isLoggedIn: false,
      }),
    }),
    {
      name: 'aiforum-auth',          // localStorage key
      partialize: (state) => ({      // sadece bu alanlar persist edilir
        actorId: state.actorId,
        isProfileCreated: state.isProfileCreated,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

export default useAuthStore
