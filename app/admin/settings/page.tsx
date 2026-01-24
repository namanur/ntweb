import React from 'react';

/**
 * Renders the Settings page UI including a page header, subtitle, and an "Account Settings" card with a placeholder message.
 *
 * @returns The JSX element for the Settings page.
 */
export default function SettingsPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
                <p className="text-zinc-400">Manage system configurations and preferences.</p>
            </div>

            <div className="grid gap-6">
                <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/30">
                    <h3 className="text-lg font-medium mb-4">Account Settings</h3>
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-500">No settings available yet.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}