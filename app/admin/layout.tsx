'use client';

import AdminLayout from "@/components/admin/AdminLayout";

/**
 * Wraps content with the admin layout.
 *
 * @param children - Elements to render inside the AdminLayout
 * @returns The AdminLayout element containing `children`
 */
export default function Layout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}