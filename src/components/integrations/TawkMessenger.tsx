import {useEffect} from 'react'

const DEFAULT_TAWK_PROPERTY_ID = '693f1753a98748197f471eca'
const DEFAULT_TAWK_WIDGET_ID = '1jcf768f9'

const TAWK_PROPERTY_ID =
  import.meta.env.VITE_TAWK_PROPERTY_ID || DEFAULT_TAWK_PROPERTY_ID
const TAWK_WIDGET_ID =
  import.meta.env.VITE_TAWK_WIDGET_ID || DEFAULT_TAWK_WIDGET_ID

type TawkWindow = Window & typeof globalThis & {
  Tawk_API?: Record<string, unknown>
  Tawk_LoadStart?: Date
}

export function TawkMessenger() {
  useEffect(() => {
    if (!TAWK_PROPERTY_ID || !TAWK_WIDGET_ID) {
      if (import.meta.env.DEV) {
        console.info('Tawk.to env vars missing, skipping widget mount')
      }
      return
    }

    const scriptId = 'tawk-messenger'
    if (document.getElementById(scriptId)) {
      return
    }

    const tawkWindow = window as TawkWindow
    tawkWindow.Tawk_LoadStart = new Date()
    tawkWindow.Tawk_API = tawkWindow.Tawk_API || {}

    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')

    const firstScript = document.getElementsByTagName('script')[0]
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.body.appendChild(script)
    }

    return () => {
      script.remove()
      delete tawkWindow.Tawk_API
      delete tawkWindow.Tawk_LoadStart
    }
  }, [])

  return null
}
