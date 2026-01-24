'use client';

import React from 'react';
import { Button, Card, CardBody } from "@heroui/react";
import { Plus, CheckSquare } from 'lucide-react';

/**
 * Renders the Tasks page UI: a header with a "New Task" action and a responsive grid containing a placeholder card.
 *
 * The layout is static and displays a centered placeholder indicating there are no pending tasks.
 *
 * @returns The JSX element for the Tasks page
 */
export default function TasksPage() {
    return (
        <div className="p-8 space-y-8 min-h-screen bg-zinc-950 text-white" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black uppercase tracking-tight">Tasks</h1>
                <Button className="font-bold bg-white text-black" startContent={<Plus size={18} />}>
                    New Task
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Task Card Placeholder */}
                <Card className="bg-black border border-zinc-800 border-dashed opacity-50 flex items-center justify-center p-12">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <CheckSquare size={32} />
                        <p className="text-sm font-mono">No Pending Tasks</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}