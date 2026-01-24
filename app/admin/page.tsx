import { redirect } from 'next/navigation';

/**
 * Redirects to the admin dashboard.
 *
 * This component performs an immediate navigation to `/admin/dashboard` and does not render any UI.
 */
export default function AdminPage() {
    redirect('/admin/dashboard');
}