import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      isGreenMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleGreenMode: () => set((state) => ({ isGreenMode: !state.isGreenMode })),
      setTheme: (isDark) => set({ isDarkMode: isDark }),
      setGreenMode: (isGreen) => set({ isGreenMode: isGreen })
    }),
    {
      name: 'theme-storage', // localStorage key
      storage: createJSONStorage(() => localStorage), // Persist across sessions
    }
  )
)

export default useThemeStore
