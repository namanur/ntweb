'use server'

import { redirect } from 'next/navigation'
import { login, logout } from '@/lib/auth'

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const adminPassword = process.env.ADMIN_PASSWORD

  // 1. Check Password
  if (password === adminPassword) {

    // 2. Create Session (JWT)
    await login();

    // 3. Redirect to Admin
    redirect('/admin')
  }

  return { error: 'Invalid Credentials. Please try again.' }
}

export async function logoutAction() {
  await logout();
  redirect('/login')
}