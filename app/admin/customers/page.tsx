"use client";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, Building2, Phone, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const query = search ? `?search=${search}` : '';
            const res = await fetch(`/api/admin/customers${query}`);
            const data = await res.json();
            setCustomers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">

            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">Customer Directory</h1>

                <div className="ml-auto w-full max-w-sm relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
                    <input
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:border-zinc-700 outline-none transition-all placeholder:text-zinc-600"
                        placeholder="Search by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
                        <tr>
                            <th className="p-4">Customer Name</th>
                            <th className="p-4">Mobile</th>
                            <th className="p-4">Territory</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No customers found.</td></tr>
                        ) : (
                            customers.map((c: any) => (
                                <tr key={c.name} className="group hover:bg-zinc-900/50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/customers/${c.name}`)}>
                                    <td className="p-4 font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 transition-colors">
                                            <Building2 size={16} />
                                        </div>
                                        {c.customer_name}
                                        <span className="text-[10px] text-zinc-600 font-mono ml-2 border border-zinc-800 px-1 rounded">{c.name}</span>
                                    </td>
                                    <td className="p-4 text-zinc-400 font-mono">
                                        <div className="flex items-center gap-2"><Phone size={14} /> {c.mobile_no || "N/A"}</div>
                                    </td>
                                    <td className="p-4 text-zinc-400">
                                        <div className="flex items-center gap-2"><MapPin size={14} /> {c.territory}</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="text-zinc-500 group-hover:text-blue-400 text-xs font-bold flex items-center justify-end gap-1">
                                            View Details <ChevronLeft size={12} className="rotate-180" />
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
