'use client';

import React from 'react';
import { Card, CardBody, Input } from "@heroui/react";
import { Search, History } from 'lucide-react';

export default function HistoryPage() {
    return (
        <div className="p-8 space-y-8 min-h-screen bg-zinc-950 text-white" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black uppercase tracking-tight">Archives</h1>
            </div>

            <div className="max-w-xl">
                <Input
                    placeholder="Search past orders, customers, or refs..."
                    startContent={<Search className="text-zinc-500" />}
                    classNames={{
                        inputWrapper: "bg-black border border-zinc-800 text-white h-12",
                        input: "text-white"
                    }}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* History Placeholder */}
                <Card className="bg-black border border-zinc-800 border-dashed opacity-50 flex items-center justify-center p-20">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <History size={32} />
                        <p className="text-sm font-mono">No Archives Found</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
