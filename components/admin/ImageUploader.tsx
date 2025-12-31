"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { processImage } from '@/lib/client/image-optimizer';

// Simplified Props for Zero-Click Workflow
interface ImageUploaderProps {
    onUploadStart?: () => void;
    onUploadComplete?: (results: any) => void;
    targetProduct?: any; // MANDATORY for Zero-Click
    products?: any[]; // Legacy, ignored
}

interface WorkerFile {
    id: string;
    original: File;
    status: 'processing' | 'uploading' | 'done' | 'error';
    error?: string;
}

export function ImageUploader({ onUploadComplete, targetProduct }: ImageUploaderProps) {
    const [activeFile, setActiveFile] = useState<WorkerFile | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        // 0. Validation
        if (!targetProduct) return;

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return;

        const file = files[0]; // SINGLE FILE ONLY per instructions

        // 1. Init Worker
        const workerId = Math.random().toString(36).substring(7);
        setActiveFile({
            id: workerId,
            original: file,
            status: 'processing'
        });

        try {
            // 2. Client-side Optimize
            const result = await processImage(file);

            // 3. Immediate Upload
            setActiveFile(prev => prev ? { ...prev, status: 'uploading' } : null);

            const formData = new FormData();
            formData.append('file_original', file);
            formData.append('file_optimized', result.optimized, `${targetProduct.item_code}.webp`);
            formData.append('item_code', targetProduct.item_code);

            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Upload failed");
            }

            // 4. Success Signal
            setActiveFile(prev => prev ? { ...prev, status: 'done' } : null);

            // Short delay to show success checkmark before auto-advancing
            setTimeout(() => {
                setActiveFile(null); // Clear worker
                if (onUploadComplete) onUploadComplete({ success: true, item: targetProduct.item_code });
            }, 600);

        } catch (err: any) {
            setActiveFile(prev => prev ? { ...prev, status: 'error', error: err.message } : null);
            // On error, we DO NOT clear. User must see error.
        }

    }, [targetProduct, onUploadComplete]);

    return (
        <div
            className={`w-full h-full border-2 border-dashed rounded-xl transition-all relative overflow-hidden ${isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10'
                }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
        >
            {/* IDLE STATE */}
            {!activeFile && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center select-none">
                    <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110">
                        <Upload size={32} className="text-zinc-500" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">Drop Image Here</h4>
                    <p className="text-zinc-500 text-sm max-w-sm">
                        Instantly attaches to <br />
                        <span className="text-blue-400 font-mono font-bold text-base mt-1 inline-block bg-blue-900/10 px-2 py-0.5 rounded border border-blue-900/30">{targetProduct?.item_code}</span>
                    </p>
                </div>
            )}

            {/* PROCESSING / UPLOADING STATE */}
            {activeFile && activeFile.status !== 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-10 transition-all animate-in fade-in duration-200">
                    {activeFile.status === 'done' ? (
                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_rgba(34,197,94,0.6)]">
                                <CheckCircle2 size={48} className="text-white" />
                            </div>
                            <h4 className="text-3xl font-black text-white tracking-tight">Attached!</h4>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
                            <h4 className="text-xl font-bold text-white tracking-tight">
                                {activeFile.status === 'processing' ? 'Optimizing...' : 'Uploading...'}
                            </h4>
                        </div>
                    )}
                </div>
            )}

            {/* ERROR STATE */}
            {activeFile && activeFile.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-md z-10">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h4 className="text-xl font-bold text-red-400 mb-2">Upload Failed</h4>
                    <p className="text-base text-red-200/70 max-w-xs text-center mb-6 font-medium">{activeFile.error}</p>
                    <button
                        onClick={() => setActiveFile(null)}
                        className="px-8 py-3 bg-red-900 hover:bg-red-800 text-white rounded-xl text-sm font-bold border border-red-700 transition-all shadow-lg hover:shadow-red-900/20 active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
