'use client'

import { useState } from 'react'
import { AlertCircle, Check, Mail } from 'lucide-react'

type Status = 'idle' | 'copied' | 'error'

// Falls back to the legacy execCommand path when the Clipboard API write is
// denied — happens in locked-down corporate browsers, older Safari, and
// cross-origin iframe contexts, not just insecure origins.
function legacyCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (!ok) throw new Error('execCommand copy failed')
}

export function CopyEmailButton({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle')

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email)
          setStatus('copied')
        } catch {
          try {
            legacyCopy(email)
            setStatus('copied')
          } catch {
            setStatus('error')
          }
        } finally {
          setTimeout(() => setStatus('idle'), 1500)
        }
      }}
      aria-label={`Copy email address ${email}`}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {status === 'copied' && <Check className="size-4 text-green-600" />}
      {status === 'error' && <AlertCircle className="size-4 text-destructive" />}
      {status === 'idle' && <Mail className="size-4" />}
    </button>
  )
}
