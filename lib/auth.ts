import { cookies } from 'next/headers';
// Simple mock for now, can be expanded to JWT
export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  // In real app, verify signature/token
  if (session?.value === 'true' || session?.value && session.value.length > 10) {
    return { role: 'admin' };
  }
  return null;
}