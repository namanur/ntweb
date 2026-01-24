'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut, Package } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Schemes', href: '/admin/schemes', icon: Package }, // Phase 4
        { name: 'Customers', href: '/admin/customers', icon: Users }, // Phase 3
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    if (pathname === '/admin/login') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center relative">
                <div
                    className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url('/background.svg')`,
                        backgroundSize: '40px 40px',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="relative z-10 w-full max-w-md">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-zinc-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-black flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-black">N</div>
                    <span className="font-bold tracking-widest uppercase text-sm">Nandan Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-zinc-900 text-white border border-zinc-800'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                                    }`}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={async () => {
                            // Clear admin session cookie
                            document.cookie = 'admin_session=; Path=/admin; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                            // Redirect to login
                            window.location.href = '/admin/login';
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen relative">
                {/* Monochrome Background for Content Area */}
                <div
                    className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url('/background.svg')`,
                        backgroundSize: '40px 40px',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
