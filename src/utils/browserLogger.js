// This script overrides console methods and sends them to the local Vite dev server
if (import.meta.env.DEV) {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  function formatArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch (e) {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
  }

  function sendLog(type, args) {
    const message = `[${type.toUpperCase()}] ${formatArgs(args)}`
    fetch('/__client_log', {
      method: 'POST',
      body: message
    }).catch(() => {})
  }

  console.log = function (...args) {
    originalLog.apply(console, args)
    sendLog('log', args)
  }

  console.warn = function (...args) {
    originalWarn.apply(console, args)
    sendLog('warn', args)
  }

  console.error = function (...args) {
    originalError.apply(console, args)
    sendLog('error', args)
  }
}
