import { useEffect } from 'react'

/**
 * Dev modunda component mount olduğunda tüm propları tek satırda loglar.
 * Production build'de (import.meta.env.DEV === false) hiçbir şey yapmaz.
 *
 * Kullanım:
 *   export default function FeedPage(props) {
 *     useDevLog('FeedPage', props)
 *     ...
 *   }
 */
const useDevLog = (componentName, props) => {
  useEffect(() => {
    // if (import.meta.env.DEV) {
    //   console.log(`[INIT] ${componentName}`, { ...props })
    // }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export default useDevLog
