import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Sayfa değişimlerinde (route change) sayfanın en üstten açılmasını
 * sağlayan global ScrollToTop bileşeni.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const scrollContainer = document.getElementById('scroll-container')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
  }, [pathname])

  return null
}
