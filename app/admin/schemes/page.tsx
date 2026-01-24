'use client';

import React from 'react';
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Plus } from 'lucide-react';

/**
 * Render the Schemes management page UI for the admin area.
 *
 * Renders a static layout containing the "Scheme Engine" header, a "New Scheme" button with a Plus icon, and a responsive grid that displays a placeholder card ("No Active Schemes") when no schemes are present.
 *
 * @returns A JSX element representing the Schemes page layout
 */
export default function SchemesPage() {
    return (
        <div className="p-8 space-y-8 min-h-screen bg-zinc-950 text-white" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black uppercase tracking-tight">Scheme Engine</h1>
                <Button className="font-bold bg-white text-black" startContent={<Plus size={18} />}>
                    New Scheme
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Scheme Card Placeholder */}
                <Card className="bg-black border border-zinc-800 border-dashed opacity-50 flex items-center justify-center p-12">
                    <p className="text-zinc-500 text-sm font-mono">No Active Schemes</p>
                </Card>
            </div>
        </div>
    );
}