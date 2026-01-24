'use client';

import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Spinner } from "@heroui/react";
import { Search, User } from 'lucide-react';
import { searchERPCustomers } from "@/actions/erp-customer-actions";
import { toast } from 'sonner';

interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: any) => void;
}

export default function CustomerSearchModal({ isOpen, onClose, onSelect }: CustomerSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (query.length < 3) {
            toast.error("Enter at least 3 characters");
            return;
        }
        setLoading(true);
        try {
            const data = await searchERPCustomers(query);
            setResults(data);
            if (data.length === 0) toast.info("No customers found");
        } catch (e) {
            toast.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            size="2xl"
            backdrop="blur"
            classNames={{
                base: "bg-zinc-950 border border-zinc-800",
                header: "border-b border-zinc-900",
                footer: "border-t border-zinc-900"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="text-white uppercase tracking-tight">Link ERP Customer</ModalHeader>
                        <ModalBody className="p-6 space-y-6">
                            <div className="flex gap-2">
                                <Input
                                    autoFocus
                                    placeholder="Search by Name or Mobile..."
                                    value={query}
                                    onValueChange={setQuery}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    startContent={<Search className="text-zinc-500" size={18} />}
                                    classNames={{
                                        inputWrapper: "bg-zinc-900 border border-zinc-800 text-white",
                                        input: "text-white"
                                    }}
                                />
                                <Button isIconOnly className="bg-white text-black font-bold" onPress={handleSearch} isLoading={loading}>
                                    <Search size={20} />
                                </Button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {results.map((c) => (
                                    <div
                                        key={c.name}
                                        className="p-3 rounded-lg border border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors flex justify-between items-center group"
                                        onClick={() => onSelect(c)}
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{c.customer_name}</div>
                                            <div className="text-xs text-zinc-500 font-mono">{c.name} • {c.mobile_no || 'No Mobile'}</div>
                                        </div>
                                        <div className="text-xs uppercase font-bold text-zinc-600 bg-zinc-900 px-2 py-1 rounded">
                                            {c.territory}
                                        </div>
                                    </div>
                                ))}
                                {results.length === 0 && !loading && (
                                    <div className="text-center text-zinc-600 py-8 italic">Search for a customer to link</div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose} className="text-zinc-400">Cancel</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
