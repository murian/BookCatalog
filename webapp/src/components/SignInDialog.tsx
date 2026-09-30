import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { Cloud, Loader2, Lock, Mail, RefreshCw, Smartphone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { auth } from '../lib/firebase'
import { Modal } from './Modal'
import { Logo } from './Logo'

export function friendlyAuthError(code: string) {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Wrong email or password.'
  if (code.includes('email-already-in-use')) return 'An account with this email already exists. Sign in instead.'
  if (code.includes('weak-password')) return 'Use at least 6 characters for the password.'
  if (code.includes('invalid-email')) return 'That email address looks invalid.'
  if (code.includes('network')) return 'Network error. Check your connection and try again.'
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'Sign-in was cancelled.'
  if (code.includes('unauthorized-domain'))
    return `This site isn't on Firebase's list of allowed sites yet. In the Firebase console, add ${location.hostname} under Authentication → Settings → Authorized domains.`
  if (code.includes('operation-not-allowed')) return 'This sign-in method is turned off in Firebase. Enable it under Authentication → Sign-in method.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.'
  return 'Something went wrong signing in. Please try again.'
}

const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

/** Sign-in for syncing, explaining plainly what it is and where the data lives. */
export function SignInDialog({ onClose, hasLocalBooks }: { onClose: () => void; hasLocalBooks: boolean }) {
  const [useEmail, setUseEmail] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  const google = async () => {
    setBusy('google')
    setMsg(null)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
      onClose()
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      // Some mobile browsers block popups; a full-page redirect works there.
      if (code.includes('popup-blocked') || code.includes('operation-not-supported')) return signInWithRedirect(auth, provider)
      setMsg({ text: friendlyAuthError(code) })
      setBusy(null)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy('email')
    setMsg(null)
    try {
      if (mode === 'signin') await signInWithEmailAndPassword(auth, email, password)
      else await createUserWithEmailAndPassword(auth, email, password)
      onClose()
    } catch (err) {
      setMsg({ text: friendlyAuthError((err as { code?: string }).code ?? '') })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal title={<span className="sr-only">Sign in</span>} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <Logo className="size-14" />
        <h2 className="font-display mt-4 text-2xl font-semibold">Keep your library everywhere</h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Sign in to back up your books and see the same library on your phone, tablet and computer.
        </p>
      </div>

      <ul className="mx-auto mt-5 max-w-sm space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <li className="flex items-center gap-2.5">
          <Cloud size={16} className="shrink-0 text-brand-600 dark:text-brass-400" /> Backed up automatically, nothing to export
        </li>
        <li className="flex items-center gap-2.5">
          <Smartphone size={16} className="shrink-0 text-brand-600 dark:text-brass-400" /> Changes appear on all your devices instantly
        </li>
        <li className="flex items-center gap-2.5">
          <Lock size={16} className="shrink-0 text-brand-600 dark:text-brass-400" /> Private to your account. Nobody else can see your books
        </li>
      </ul>

      <div className="mx-auto mt-6 max-w-sm space-y-3">
        <button
          onClick={google}
          disabled={!!busy}
          className="btn w-full border border-zinc-300 bg-white py-3 text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
        >
          {busy === 'google' ? <Loader2 size={18} className="animate-spin" /> : <GoogleG />} Continue with Google
        </button>

        {!useEmail ? (
          <button className="btn-ghost w-full" onClick={() => setUseEmail(true)}>
            <Mail size={16} /> Use email and password instead
          </button>
        ) : (
          <form onSubmit={submit} className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="h-px flex-1 bg-zinc-900/10 dark:bg-white/10" /> or with email <span className="h-px flex-1 bg-zinc-900/10 dark:bg-white/10" />
            </div>
            <input className="field" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className="field"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder={mode === 'signin' ? 'Password' : 'Choose a password (6+ characters)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn-primary w-full" disabled={!!busy}>
              {busy === 'email' && <Loader2 size={16} className="animate-spin" />} {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-brand-700 hover:underline dark:text-brass-300" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'New here? Create an account' : 'I already have an account'}
              </button>
              {mode === 'signin' && (
                <button
                  type="button"
                  className="text-zinc-500 hover:underline"
                  onClick={async () => {
                    if (!email) return setMsg({ text: 'Enter your email first, then tap “Forgot password?”.' })
                    await sendPasswordResetEmail(auth, email).catch(() => {})
                    setMsg({ ok: true, text: 'If that account exists, a reset link is on its way.' })
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </form>
        )}

        {msg && <p className={`text-center text-sm ${msg.ok ? 'text-brand-600' : 'text-rose-600'}`}>{msg.text}</p>}

        {hasLocalBooks && (
          <p className="flex items-start gap-2 rounded-xl bg-brass-500/10 px-3 py-2 text-xs text-brass-700 dark:text-brass-300">
            <RefreshCw size={14} className="mt-0.5 shrink-0" /> After you sign in, you can move the books saved in this browser into your account.
          </p>
        )}

        <p className="pt-2 text-center text-xs leading-relaxed text-zinc-400">
          Sign-in and storage are provided by Google Firebase. Your password is never seen or stored by Ex Libris.
        </p>
      </div>
    </Modal>
  )
}
