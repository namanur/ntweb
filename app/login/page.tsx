'use client'

import { useActionState } from 'react' // or useFormState in older Next.js versions
import { loginAction } from './actions'
import Image from 'next/image'
import { Lock, ArrowRight, AlertCircle } from 'lucide-react'

// Initial state for the form
const initialState = {
  error: '',
}

export default function LoginPage() {
  // Hook to handle server action state
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="relative w-20 h-20 mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700">
             <Image src="/logo.png" alt="Logo" width={50} height={50} className="invert brightness-0" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-300">Restricted Area</h1>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              name="password"
              type="password" 
              placeholder="Enter Passkey" 
              className="w-full pl-12 p-4 bg-black rounded-xl border border-zinc-800 focus:border-white focus:ring-0 outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-center"
              autoFocus
              required
            />
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 text-red-400 text-xs justify-center bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              <AlertCircle size={14} /> {state.error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-white text-black font-bold p-4 rounded-xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? "Verifying..." : "Authenticate"} {!isPending && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}