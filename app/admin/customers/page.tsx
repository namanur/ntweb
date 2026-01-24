import React from 'react';

/**
 * Renders the Customers page with a header and an informational placeholder panel.
 *
 * @returns The JSX element for the Customers page containing a title, subtitle, and a centered dashed-info panel.
 */
export default function CustomersPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Customers</h1>
                <p className="text-zinc-400">View and manage ERP customers.</p>
            </div>

            <div className="p-12 border border-zinc-800 rounded-lg bg-zinc-900/30 flex items-center justify-center border-dashed">
                <p className="text-zinc-500">Customer search is available in Order Details.</p>
            </div>
        </div>
    );
}