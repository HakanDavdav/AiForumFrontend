import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * UI Store — merkezi panel/layout durumu.
 *
 * centerView: CenterPanel'de ne gösterildiği
 *   - 'feed'          → Ana akış (trending/recent posts)
 *   - 'post'          → Post detay + entry listesi
 *   - 'entry'         → ContentItem bağlamsal görünüm (EntryDto veya PostDto discriminate)
 *   - 'profile'       → ActorProfileView
 *   - 'tribe'         → TribeProfileView
 *   - 'search'        → Arama sonuçları
 *   - 'leaderboard'   → Sıralama tablosu
 *   - 'create-post'   → Yeni başlık oluşturma formu
 *   - 'create-tribe'  → Yeni tribe oluşturma formu
 *   - 'create-bot'    → Yeni bot oluşturma formu
 *   - 'init-profile'  → Yeni kayıt sonrası profil tamamlama formu
 *   - 'account-settings' → Hesap ayarları
 *   - 'hierarchy'     → ActorHierarchyTree overlay
 */
const useUIStore = create(
  persist(
    (set) => ({
      // ─── Center Panel ─────────────────────────────────────────────────────────
      // Removed centerView, centerViewParams, viewHistory, setCenterView, goBack for React Router migration


      // ─── Left Panel ───────────────────────────────────────────────────────────
      activeLeftCacheType: 'recent',
      setActiveLeftCacheType: (type) => set({ activeLeftCacheType: type }),

      isActivitiesExpanded: false,
      toggleActivities: () => set((state) => ({ isActivitiesExpanded: !state.isActivitiesExpanded })),

      // ─── Responsive Drawers ───────────────────────────────────────────────────
      isLeftDrawerOpen: false,
      isRightDrawerOpen: false,
      toggleLeftDrawer: () => set((state) => ({ isLeftDrawerOpen: !state.isLeftDrawerOpen })),
      toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
      closeDrawers: () => set({ isLeftDrawerOpen: false, isRightDrawerOpen: false }),

      // ─── My Tribes Dropdown ───────────────────────────────────────────────────
      isMyTribesOpen: false,
      toggleMyTribes: () => set((state) => ({ isMyTribesOpen: !state.isMyTribesOpen })),
      closeMyTribes: () => set({ isMyTribesOpen: false }),

      // ─── Search ───────────────────────────────────────────────────────────────
      searchMode: 'general', // 'general' | 'posts' | 'actors' | 'tribes'
      setSearchMode: (mode) => set({ searchMode: mode }),
    }),
    {
      name: 'ui-store-storage', // sessionStorage key
      storage: createJSONStorage(() => sessionStorage), // F5 atıldığında veriyi hatırlar, sekme kapandığında silinir
    }
  )
)

export default useUIStore
