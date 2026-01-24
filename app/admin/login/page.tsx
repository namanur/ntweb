'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simple Client-Side Check (Security Note: Phase 2 Prototype)
        // In production, this should be a server action or API call
        // For now, we match against env var via API or just allow simple check if matching a known pattern
        // But since ENV is server-side, we must use a server action.
        // However, for this task, I'll create a Server Action for login in the next step.
        // For now, I'll assume we verify via a simple API.

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                router.push('/admin/dashboard');
                toast.success("Welcome Back");
            } else {
                toast.error("Invalid Credentials");
            }
        } catch (err) {
            toast.error("Login Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <Card className="w-full max-w-sm bg-black border border-zinc-800 shadow-2xl">
                <CardHeader className="flex flex-col gap-2 items-center pt-8 pb-4">
                    <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800">
                        <Lock size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight uppercase">Admin Access</h1>
                </CardHeader>
                <CardBody className="px-8 pb-8">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter Access Key"
                            value={password}
                            onValueChange={setPassword}
                            classNames={{
                                inputWrapper: "bg-zinc-900 border border-zinc-800 group-data-[focus=true]:border-white",
                                input: "text-white text-center font-mono"
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            isLoading={loading}
                            className="bg-white text-black font-bold h-10 rounded-lg hover:bg-zinc-200"
                        >
                            Unlock Terminal
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
