import { create } from 'zustand'

/**
 * UI Store — merkezi panel/layout durumu.
 * Sayfa yenilenince sıfırlanması isteniyor (persist yok).
 *
 * centerView: CenterPanel'de ne gösterildiği
 *   - 'feed'          → Ana akış (trending/recent posts)
 *   - 'post'          → Post detay + entry listesi
 *   - 'profile'       → ActorProfileView
 *   - 'tribe'         → TribeProfileView
 *   - 'search'        → Arama sonuçları
 *   - 'leaderboard'   → Sıralama tablosu
 *   - 'create-post'   → Yeni konu oluşturma formu
 *   - 'create-tribe'  → Yeni tribe oluşturma formu
 *   - 'create-bot'    → Yeni bot oluşturma formu
 *   - 'account-settings' → Hesap ayarları
 *   - 'hierarchy'     → ActorHierarchyTree overlay
 */
const useUIStore = create((set) => ({
  // ─── Center Panel ─────────────────────────────────────────────────────────
  centerView: 'feed',
  centerViewParams: {},   // { postId, actorId, tribeId, query, ... }
  previousCenterView: null,
  previousCenterViewParams: {},

  setCenterView: (view, params = {}) =>
    set((state) => ({
      previousCenterView: state.centerView,
      previousCenterViewParams: state.centerViewParams,
      centerView: view,
      centerViewParams: params,
    })),

  restorePreviousCenterView: () =>
    set((state) => ({
      centerView: state.previousCenterView || 'feed',
      centerViewParams: state.previousCenterViewParams || {},
      previousCenterView: null,
      previousCenterViewParams: {},
    })),

  // ─── Left Panel ───────────────────────────────────────────────────────────
  isActivitiesExpanded: false,
  toggleActivities: () =>
    set((state) => ({ isActivitiesExpanded: !state.isActivitiesExpanded })),

  // ─── Responsive Drawers ───────────────────────────────────────────────────
  isLeftDrawerOpen: false,
  isRightDrawerOpen: false,
  toggleLeftDrawer: () =>
    set((state) => ({ isLeftDrawerOpen: !state.isLeftDrawerOpen })),
  toggleRightDrawer: () =>
    set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
  closeDrawers: () =>
    set({ isLeftDrawerOpen: false, isRightDrawerOpen: false }),

  // ─── My Tribes Dropdown ───────────────────────────────────────────────────
  isMyTribesOpen: false,
  toggleMyTribes: () =>
    set((state) => ({ isMyTribesOpen: !state.isMyTribesOpen })),
  closeMyTribes: () =>
    set({ isMyTribesOpen: false }),

  // ─── Search ───────────────────────────────────────────────────────────────
  searchMode: 'general',  // 'general' | 'posts' | 'actors' | 'tribes'
  setSearchMode: (mode) => set({ searchMode: mode }),
}))

export default useUIStore
