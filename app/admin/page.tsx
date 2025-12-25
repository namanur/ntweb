"use client";

// Register AG Grid modules globally (must be imported before any grid components)
import "@/lib/agGridModules";

import React, { useState, useEffect, useMemo } from 'react';
import { Product, Order } from '@/lib/erp';
import { PricingConsole } from "@/components/pricing-console/PricingConsole";
import Image from 'next/image';
import {
  LayoutDashboard, Package, ShoppingCart, Server, Database, LogOut, Save, X, Edit3,
  CheckCircle2, AlertTriangle, RefreshCw, Search, Upload, Layers, Play, FileText, ArrowUpDown,
  ChevronDown, AlertCircle, Flame, Clock, Truck, ChevronLeft, ChevronRight, Image as ImageIcon, Menu, Filter,
  MoreVertical, Command, Bell, Settings, Zap, DollarSign
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import { Button, Input, Chip, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

// --- TYPES ---
interface ImageStats {
  total: number;
  found: number;
  missing: number;
  missingItemCodes: string[];
}

// --- COMPONENTS ---

const SidebarItem = ({ active, onClick, icon: Icon, label, count }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? "text-black" : "text-zinc-500 group-hover:text-zinc-200"} />
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-black/10 text-black' : 'bg-zinc-900 text-zinc-500'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatCardHoriz = ({ icon: Icon, label, value, subtext, colorClass, onClick }: any) => (
  <div
    onClick={onClick}
    className={`flex-none min-w-[200px] p-5 rounded-2xl border bg-zinc-900/50 backdrop-blur-sm border-zinc-800 flex flex-col justify-between transition-all duration-200 hover:bg-zinc-800 ${onClick ? 'cursor-pointer hover:border-zinc-700' : ''} ${colorClass}`}
  >
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/50">
        <Icon size={18} className="opacity-80" />
      </div>
      {/* <div className="text-[10px] font-bold uppercase opacity-40 tracking-wider">Stats</div> */}
    </div>
    <div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="text-xs font-medium opacity-50 mt-1">{label}</div>
    </div>
  </div>
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true); // Default open on desktop

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [testStatus, setTestStatus] = useState({ telegram: "Idle", erp: "Idle" });

  const [filterBrand, setFilterBrand] = useState("All");
  const [filterStock, setFilterStock] = useState("All");
  const [filterImage, setFilterImage] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const [imageStats, setImageStats] = useState<ImageStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;


  const [targetItemCode, setTargetItemCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchData();
    fetchImageStats();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterBrand, filterStock, filterImage]);

  // Auto-switch to products tab on search
  useEffect(() => {
    if (search.length > 0 && activeTab !== 'products') {
      setActiveTab('products');
    }
  }, [search]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.in_stock !== false).length;
    const outOfStock = products.filter(p => p.in_stock === false).length;
    const priceWarning = products.filter(p => !p.standard_rate || p.standard_rate < 2).length;
    const hotItems = products.filter(p => p.is_hot).length;
    return { total, inStock, outOfStock, priceWarning, hotItems };
  }, [products]);

  const runSystemTest = async (target: 'telegram' | 'erp') => {
    setTestStatus(prev => ({ ...prev, [target]: "Running..." }));
    try {
      const endpoint = target === 'erp' ? '/api/admin/sync' : '/api/admin/test-api';
      const res = await fetch(endpoint, {
        method: 'POST',
        body: target === 'erp' ? undefined : JSON.stringify({ target })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus(prev => ({ ...prev, [target]: "✅ Sync Complete" }));
        if (target === 'erp') { fetchData(); fetchImageStats(); }
      } else {
        setTestStatus(prev => ({ ...prev, [target]: "❌ " + data.message }));
      }
    } catch (e) { setTestStatus(prev => ({ ...prev, [target]: "❌ Error" })); }
  };

  const [metadata, setMetadata] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts(data.products || []);
          setMetadata(data.metadata || null);
        }
      }
    } catch (e) { }
    setLoading(false);
  };
  const fetchImageStats = async () => {
    try {
      const res = await fetch('/api/admin/image-stats');
      if (res.ok) setImageStats(await res.json());
    } catch (e) { }
  };
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/order');
      if (res.ok) setOrders(await res.json());
    } catch (e) { }
    setLoading(false);
  };

  const handleOrderAction = async (action: string, orderId: string) => {
    if (action !== 'mark_out_for_delivery' && !confirm("Confirm action?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/order-action', { method: 'POST', body: JSON.stringify({ action, orderId }) });
      if (res.ok) { fetchOrders(); if (action !== 'mark_out_for_delivery') alert("Success"); }
      else alert("Failed");
    } catch (e: any) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const uniqueBrands = useMemo(() => ["All", ...Array.from(new Set(products.map(p => p.brand || "Generic"))).sort()], [products]);

  const processedProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => (p.item_name || "").toLowerCase().includes(s) || (p.item_code || "").toLowerCase().includes(s));
    }
    if (filterBrand !== "All") result = result.filter(p => (p.brand || "Generic") === filterBrand);
    if (filterStock === "In Stock") result = result.filter(p => p.in_stock !== false);
    else if (filterStock === "Out of Stock") result = result.filter(p => p.in_stock === false);

    if (imageStats) {
      if (filterImage === "Missing Image") result = result.filter(p => imageStats.missingItemCodes.includes(p.item_code));
      else if (filterImage === "With Image") result = result.filter(p => !imageStats.missingItemCodes.includes(p.item_code));
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        return (aVal < bVal ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
      });
    }
    return result;
  }, [products, search, filterBrand, filterStock, filterImage, sortConfig, imageStats]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedProducts, currentPage]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const requestSort = (key: keyof Product) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">

      {/* --- LEFT SIDEBAR (Navigation) --- */}
      <aside className={`fixed md:relative z-50 h-full w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Image src="/logo.png" width={20} height={20} alt="Logo" className="invert" />
            </div>
            <span className="font-bold tracking-tight text-lg">Nandan Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-zinc-500"><X /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase px-4 mb-2 mt-4 tracking-wider">Main Menu</div>
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab("dashboard")} icon={LayoutDashboard} label="Overview" />
          <SidebarItem active={activeTab === 'orders'} onClick={() => setActiveTab("orders")} icon={ShoppingCart} label="Orders" count={orders.filter(o => o.status === 'Pending').length} />
          <SidebarItem active={activeTab === 'products'} onClick={() => setActiveTab("products")} icon={Package} label="Inventory" count={products.length} />
          <SidebarItem active={activeTab === 'pricing'} onClick={() => setActiveTab("pricing")} icon={DollarSign} label="Pricing Console" />

          {/* <div className="text-[10px] font-bold text-zinc-500 uppercase px-4 mb-2 mt-8 tracking-wider">System</div>
          <SidebarItem onClick={() => {}} icon={Settings} label="Settings" /> */}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <SidebarItem onClick={() => logoutAction()} icon={LogOut} label="Sign Out" />
        </div>
      </aside>

      {/* --- CENTER MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Header */}
        <header className="flex-none h-16 border-b border-zinc-900 flex items-center justify-between px-6 glass-panel sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 -ml-2 text-zinc-400"><Menu size={20} /></button>
            <div className="relative max-w-md w-full group hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input
                placeholder="Search products, orders..."
                className="w-full bg-zinc-900/50 border border-zinc-900 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:bg-zinc-900 focus:border-zinc-700 transition-all placeholder:text-zinc-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                <div className={`w-1.5 h-1.5 rounded-full ${metadata ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                <span className="text-xs font-medium text-zinc-400">
                  {metadata?.syncTimestamp ? new Date(metadata.syncTimestamp).toLocaleString() : "Local Snapshot"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-bold">Source: ERPNext</span>
            </div>

            <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 hidden md:block">
              <LayoutDashboard size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">

          {/* HORIZONTAL STATS ROW */}
          <div className="flex gap-4 overflow-x-auto pb-4 mb-6 -mx-6 px-6 scrollbar-hide">
            <StatCardHoriz
              icon={ImageIcon}
              label="Missing Images"
              value={imageStats ? imageStats.missing : "-"}
              colorClass={imageStats && imageStats.missing > 0 ? "text-orange-400 border-orange-900/30 bg-orange-950/10" : "text-zinc-500"}
              onClick={() => { setActiveTab("products"); setFilterImage("Missing Image"); }}
            />
            <StatCardHoriz icon={AlertCircle} label="Price Warnings" value={stats.priceWarning} colorClass={stats.priceWarning > 0 ? "text-red-400 border-red-900/30 bg-red-950/10" : "text-zinc-500"} />
            <StatCardHoriz icon={CheckCircle2} label="In Stock" value={stats.inStock} colorClass="text-green-400 border-green-900/30 bg-green-950/10" />
            <StatCardHoriz icon={AlertTriangle} label="Out of Stock" value={stats.outOfStock} colorClass="text-zinc-500" />
            <StatCardHoriz icon={Package} label="Total SKU" value={stats.total} colorClass="text-blue-400 border-blue-900/30 bg-blue-950/10" />
            <StatCardHoriz icon={ShoppingCart} label="Pending Orders" value={orders.filter(o => o.status === 'Pending').length} colorClass="text-purple-400 border-purple-900/30 bg-purple-950/10" />
          </div>

          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <div className="text-center py-20">
                <Database size={64} className="mx-auto text-zinc-800 mb-6" />
                <h2 className="text-2xl font-black tracking-tight text-zinc-700">Select Inventory or Orders</h2>
                <p className="text-zinc-600 mt-2">Use the left navigation to manage store content.</p>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-3xl font-black tracking-tighter">Orders</h2>
                  <Button size="sm" variant="flat" onPress={fetchOrders} startContent={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}>Refresh</Button>
                </div>
                {orders.length === 0 ? <div className="text-center py-20 text-zinc-600">No recent orders.</div> : orders.map(order => (
                  <div key={order.id} className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono font-bold text-lg text-white">#{order.id}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            order.status === 'Out for Delivery' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                              'bg-green-500/10 text-green-500 border-green-500/20'
                            }`}>{order.status}</span>
                        </div>
                        <div className="text-xs text-zinc-400 flex flex-col gap-1">
                          <span className="flex items-center gap-2"><Clock size={12} /> {new Date(order.date).toLocaleString()}</span>
                          <span className="flex items-center gap-2 text-zinc-300"><Truck size={12} /> {order.customer.name} ({order.customer.phone})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black">₹{order.total.toLocaleString()}</div>
                        <div className="text-xs text-zinc-500">{order.items.length} Items</div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-zinc-800/50">
                      {order.status === 'Pending' && <button onClick={() => { handleOrderAction('mark_out_for_delivery', order.id); window.open(`/invoice/${order.id}`, '_blank'); }} className="flex-1 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200">Processing Sheet</button>}
                      {order.status === 'Out for Delivery' && <button onClick={() => handleOrderAction('mark_delivered', order.id)} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500">Mark Delivered</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">Inventory</h2>
                    <div className="flex gap-2 mt-2 text-xs text-zinc-500 font-medium">
                      <span>{products.length} Items</span> • <span>{imageStats?.missing || 0} Missing Images</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none">
                      {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none">
                      <option value="All">All Status</option>
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                    <select value={filterImage} onChange={e => setFilterImage(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none">
                      <option value="All">All Images</option>
                      <option value="Missing Image">Missing</option>
                      <option value="With Image">Has Image</option>
                    </select>
                  </div>
                </div>

                <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-950/80 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="p-4 w-16 text-center">Img</th>
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => requestSort('item_name')}>Product</th>
                          <th className="p-4 hidden md:table-cell cursor-pointer hover:text-white" onClick={() => requestSort('brand')}>Brand</th>
                          <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => requestSort('standard_rate')}>Price</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {paginatedData.map(p => (
                          <tr key={p.item_code} className="group hover:bg-zinc-800/30 transition-colors">
                            <td className="p-3 text-center">
                              <div className="relative w-10 h-10 mx-auto bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
                                <img src={`/images/items/${p.item_code}.jpg`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-zinc-900'); e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden'); }} />
                                <div className="fallback hidden absolute inset-0 flex items-center justify-center text-zinc-700"><Package size={14} /></div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-white truncate max-w-[180px] md:max-w-xs">{p.item_name}</div>
                              <div className="text-[10px] font-mono text-zinc-600">{p.item_code}</div>
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] font-medium text-zinc-400">{p.brand}</span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-zinc-300">
                              {p.standard_rate ? `₹${p.standard_rate}` : <span className="text-red-500 text-[10px]">₹0</span>}
                            </td>
                            <td className="p-3 text-center">
                              <Tooltip content="Managed in ERP">
                                <div className="p-2 inline-block rounded-lg text-zinc-600 cursor-not-allowed"><Server size={16} /></div>
                              </Tooltip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 text-xs font-mono text-zinc-500 border-t border-transparent">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="hover:text-white disabled:opacity-30 flex items-center gap-1"><ChevronLeft size={14} /> PREV</button>
                    <span>PAGE {currentPage} / {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="hover:text-white disabled:opacity-30 flex items-center gap-1">NEXT <ChevronRight size={14} /></button>
                  </div>
                )}
              </div>

            )}

            {activeTab === 'pricing' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-[calc(100vh-140px)]">
                <div className="mb-4">
                  <h2 className="text-3xl font-black tracking-tighter">Pricing Console</h2>
                  <p className="text-zinc-500 text-sm">Manage item prices, margins, and stock.</p>
                </div>
                <div className="h-full bg-zinc-950/30 rounded-2xl border border-zinc-800/50 overflow-hidden">
                  <PricingConsole />
                </div>
              </div>
            )}
          </div>
        </main>
      </div >

      {/* FLOATING TOGGLE BUTTON (When Panel Closed) */}
      {
        !rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 p-2 pl-3 bg-zinc-900/90 backdrop-blur-md text-zinc-400 hover:text-white rounded-l-xl border-y border-l border-zinc-800 shadow-2xl transition-all hover:pl-4 group"
            title="Open System Actions"
          >
            <ChevronLeft size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        )
      }

      {/* --- RIGHT STATUS PANEL (System Health - Read Only) --- */}
      <aside className={`fixed md:relative z-40 h-full w-80 bg-zinc-950 border-l border-zinc-900 flex flex-col transition-all duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full md:mr-[-20rem]'}`}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
          <span className="font-bold tracking-tight text-white">System Status</span>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded-lg"
            title="Collapse Panel"
          >
            {/* Show X on mobile (close), ChevronRight on desktop (collapse) */}
            <div className="md:hidden"><X size={20} /></div>
            <div className="hidden md:block"><ChevronRight size={20} /></div>
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* ERP Status (Read-Only) */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-900/20 text-orange-400 flex items-center justify-center"><Database size={16} /></div>
              <div>
                <h3 className="font-bold text-sm">ERP Connection</h3>
                <p className="text-[10px] text-zinc-500">ERPNext Mirror</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Status</span>
                <span className="flex items-center gap-1.5 text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  {metadata?.syncTimestamp ? "Synced" : "Local Snapshot"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Last Updated</span>
                <span className="text-zinc-300 font-mono text-[10px]">
                  {metadata?.syncTimestamp ? new Date(metadata.syncTimestamp).toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Items Cached</span>
                <span className="text-zinc-300 font-bold">{products.length}</span>
              </div>
            </div>
          </div>

          {/* Console Mode Badge */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-900/20 text-blue-400 flex items-center justify-center"><DollarSign size={16} /></div>
              <div>
                <h3 className="font-bold text-sm">Pricing Console</h3>
                <p className="text-[10px] text-zinc-500">Operational Mode</p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-900/30 text-center">
              <span className="text-sm font-bold text-blue-400">Preview Mode</span>
              <p className="text-[10px] text-zinc-500 mt-1">Read-only access</p>
            </div>
          </div>

          {/* System Health */}
          <div className="pt-6 border-t border-zinc-900">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4">Health Checks</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-300">Database Connected</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-300">API Endpoints Live</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-300">Catalog Loaded</span>
              </div>
            </div>
          </div>

        </div>
      </aside>

    </div >
  );
}