'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD

  // 1. Check Password
  if (password === adminPassword) {
    
    // 2. Set Secure Cookie
    // We use the password itself as the token for simplicity & security
    // (It's HttpOnly, so hackers can't steal it easily)
    const cookieStore = await cookies()
    cookieStore.set('admin_token', adminPassword as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 Day
      sameSite: 'lax',
    })

    // 3. Redirect to Admin
    redirect('/admin')
  } 
  
  return { error: 'Invalid Credentials. Please try again.' }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  redirect('/login')
}