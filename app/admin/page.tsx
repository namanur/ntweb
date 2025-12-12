"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Order } from '@/lib/erp';
import Image from 'next/image';
import { 
  LayoutDashboard, Package, ShoppingCart, Server, Database, LogOut, Save, X, Edit3, 
  CheckCircle2, AlertTriangle, RefreshCw, Search, Upload, Layers, Play, FileText, ArrowUpDown, 
  ChevronDown, AlertCircle, Flame, Clock, Truck, ChevronLeft, ChevronRight, Image as ImageIcon, Menu, Filter
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions'; 

// --- TYPES ---
interface ImageStats {
  total: number;
  found: number;
  missing: number;
  missingItemCodes: string[];
}

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
        {icon} {label}
    </button>
);

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-2xl border bg-zinc-900 border-zinc-800 flex flex-col justify-between transition-all duration-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/80' : ''} ${colorClass}`}
  >
      <div className="flex items-center gap-2 mb-2">
          <Icon size={18} className="opacity-80" />
          <span className="text-xs font-bold uppercase opacity-60 tracking-wider">{label}</span>
      </div>
      <div>
          <div className="text-3xl font-black text-white tracking-tight">{value}</div>
          {subtext && <div className="text-[10px] opacity-50 mt-1 font-medium">{subtext}</div>}
      </div>
  </div>
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetItemCode, setTargetItemCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchData(); 
    fetchImageStats(); 
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, filterBrand, filterStock, filterImage]);

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
          const res = await fetch('/api/admin/test-api', { method: 'POST', body: JSON.stringify({ target }) });
          const data = await res.json();
          setTestStatus(prev => ({ ...prev, [target]: data.success ? "✅ " + data.message : "❌ " + data.message }));
      } catch (e) { setTestStatus(prev => ({ ...prev, [target]: "❌ Error" })); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/seed');
        if (res.ok) setProducts(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const fetchImageStats = async () => {
    try {
        const res = await fetch('/api/admin/image-stats');
        if (res.ok) setImageStats(await res.json());
    } catch(e) {}
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/order');
        if (res.ok) setOrders(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const handleOrderAction = async (action: string, orderId: string) => {
    if(action !== 'mark_out_for_delivery' && !confirm("Confirm action?")) return;
    setLoading(true);
    try {
        const res = await fetch('/api/admin/order-action', { method: 'POST', body: JSON.stringify({ action, orderId }) });
        if(res.ok) { fetchOrders(); if(action !== 'mark_out_for_delivery') alert("Success"); }
        else alert("Failed");
    } catch(e: any) { alert("Error: " + e.message); }
    setLoading(false);
  };

  const triggerDirectUpload = (itemCode: string) => {
    setTargetItemCode(itemCode);
    fileInputRef.current?.click();
  };

  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetItemCode) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("item_code", targetItemCode);
    formData.append("file", files[0]);
    try {
      const res = await fetch("/api/products/update", { method: "POST", body: formData });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.item_code === targetItemCode ? { ...p, imageVersion: Date.now() } as Product : p));
        fetchImageStats();
      } else alert("Upload Failed");
    } catch (e) { alert("Error"); } 
    finally { setUploading(false); setTargetItemCode(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const openEditModal = (product: Product) => { 
      setEditingItem(product); 
      setEditForm({ ...product, stock_qty: product.stock_qty ?? 0, threshold: product.threshold ?? 2, in_stock: product.in_stock ?? true, is_hot: product.is_hot || false }); 
      setSelectedFiles(null); 
  };
  
  const handleSaveItem = async () => { 
      if (!editingItem) return;
      try {
          const res = await fetch('/api/products/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_code: editingItem.item_code, ...editForm }) });
          if (res.ok) { 
              setProducts(prev => prev.map(p => p.item_code === editingItem.item_code ? { ...p, ...editForm } as Product : p)); 
              setEditingItem(null); 
          } else alert("Failed");
      } catch (e) { alert("Error"); }
  };

  const handleImageUpload = async () => {
    if (!selectedFiles || !editingItem?.item_code) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("item_code", editingItem.item_code);
    Array.from(selectedFiles).forEach(f => formData.append("file", f));
    try {
      const res = await fetch("/api/products/update", { method: "POST", body: formData });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.item_code === editingItem.item_code ? { ...p, imageVersion: Date.now() } as Product : p));
        fetchImageStats();
        setSelectedFiles(null);
      } else alert("Failed");
    } catch (e) { alert("Error"); } finally { setUploading(false); }
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
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png" onChange={handleDirectFileSelect} />

      {/* --- SIDEBAR --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 p-6 shadow-2xl animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3"><Image src="/logo.png" width={32} height={32} alt="Logo" className="invert" /><span className="font-bold tracking-wide">COMMAND</span></div>
                    <button onClick={() => setMobileMenuOpen(false)}><X className="text-zinc-500" /></button>
                </div>
                <nav className="space-y-2">
                  <NavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab("dashboard"); setMobileMenuOpen(false)}} icon={<LayoutDashboard size={20} />} label="Dashboard" />
                  <NavButton active={activeTab === 'orders'} onClick={() => {setActiveTab("orders"); setMobileMenuOpen(false)}} icon={<ShoppingCart size={20} />} label="Orders" />
                  <NavButton active={activeTab === 'products'} onClick={() => {setActiveTab("products"); setMobileMenuOpen(false)}} icon={<Package size={20} />} label="Inventory" />
                </nav>
                <div className="absolute bottom-6 left-6 right-6">
                    <button onClick={() => logoutAction()} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 bg-red-900/10 rounded-xl hover:bg-red-900/20 transition-colors"><LogOut size={18} /> Sign Out</button>
                </div>
            </div>
        </div>
      )}

      <aside className="hidden md:flex w-72 flex-col border-r border-zinc-900 bg-zinc-950 p-6">
        <div className="flex items-center gap-3 mb-10 px-2"><Image src="/logo.png" width={36} height={36} alt="Logo" className="invert" /><span className="font-bold text-xl tracking-tight">COMMAND</span></div>
        <nav className="flex-1 space-y-1">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="System Health" />
          <NavButton active={activeTab === 'orders'} onClick={() => setActiveTab("orders")} icon={<ShoppingCart size={20} />} label="Order Management" />
          <NavButton active={activeTab === 'products'} onClick={() => setActiveTab("products")} icon={<Package size={20} />} label="Inventory" />
        </nav>
        <button onClick={() => logoutAction()} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-500 hover:text-red-400 transition-colors"><LogOut size={18} /> Sign Out</button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-black">
        
        {/* SOLID HEADER (No Transparency) */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-900 shadow-md">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-white"><Menu size={24} /></button>
            <h1 className="text-xl font-bold capitalize hidden md:block">{activeTab}</h1>
            
            <div className="relative flex-1 max-w-md mx-4 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
              <input 
                placeholder={activeTab === 'products' ? "Search products..." : "Search (Product view only)..."}
                disabled={activeTab !== 'products'}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:bg-zinc-800 focus:border-zinc-700 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">System Online</span>
             </div>
             <button 
                onClick={() => { if(activeTab === 'orders') fetchOrders(); else { fetchData(); fetchImageStats(); } }} 
                disabled={loading} 
                className="p-2.5 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-black">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatCard 
                    icon={ImageIcon} 
                    label="Missing Images" 
                    value={imageStats ? imageStats.missing : "-"} 
                    subtext={imageStats ? `View ${imageStats.missing} Items` : "Loading..."}
                    colorClass={imageStats && imageStats.missing > 0 ? "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20" : "text-zinc-500"}
                    onClick={() => { setActiveTab("products"); setFilterImage("Missing Image"); }}
                  />
                  <StatCard icon={AlertCircle} label="Price Warnings" value={stats.priceWarning} subtext="Items < ₹2.00" colorClass={stats.priceWarning > 0 ? "text-red-400 border-red-900/30 bg-red-900/10" : "text-zinc-500"} />
                  <StatCard icon={CheckCircle2} label="In Stock" value={stats.inStock} colorClass="text-green-400" />
                  <StatCard icon={AlertTriangle} label="Out of Stock" value={stats.outOfStock} colorClass="text-zinc-500" />
                  <StatCard icon={Package} label="Total SKU" value={stats.total} colorClass="text-blue-400 hidden lg:flex" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="font-bold text-lg">Telegram Bot</h3>
                           <p className="text-xs text-zinc-500 mt-1">Status: {testStatus.telegram}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Server size={20}/></div>
                    </div>
                    <button onClick={() => runSystemTest('telegram')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold transition-colors">Test Alert</button>
                 </div>
                 <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="font-bold text-lg">ERPNext Sync</h3>
                           <p className="text-xs text-zinc-500 mt-1">Status: {testStatus.erp}</p>
                        </div>
                        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><Database size={20}/></div>
                    </div>
                    <button onClick={() => runSystemTest('erp')} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors">Test Connection</button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
             <div className="space-y-4 animate-in fade-in duration-300">
                {orders.length === 0 ? <div className="text-center py-20 text-zinc-600">No orders found.</div> : orders.map(order => (
                    <div key={order.id} className="group p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono font-bold text-lg text-white">{order.id}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                        order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                        order.status === 'Out for Delivery' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                                        'bg-green-500/10 text-green-500 border-green-500/20'
                                    }`}>{order.status}</span>
                                </div>
                                <div className="text-xs text-zinc-400 flex flex-col gap-1">
                                    <span className="flex items-center gap-2"><Clock size={12}/> {new Date(order.date).toLocaleString()}</span>
                                    <span className="flex items-center gap-2 text-zinc-300"><Truck size={12}/> {order.customer.name} ({order.customer.phone})</span>
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
             <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-3 items-center justify-between bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-sm">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                         <div className="relative min-w-[140px]">
                            <select value={filterImage} onChange={e => setFilterImage(e.target.value)} className="w-full appearance-none pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:border-zinc-600 outline-none">
                                <option value="All">All Images</option>
                                <option value="Missing Image">Missing Image</option>
                                <option value="With Image">Has Image</option>
                            </select>
                            <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                         </div>
                         <div className="relative min-w-[140px]">
                            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full appearance-none pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:border-zinc-600 outline-none">
                                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                         </div>
                         <div className="relative min-w-[140px]">
                            <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="w-full appearance-none pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:border-zinc-600 outline-none">
                                <option value="All">All Status</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                            <CheckCircle2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                         </div>
                    </div>
                </div>

                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-950 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                                <tr>
                                    <th className="p-4 w-16 text-center">Img</th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => requestSort('item_name')}>Product</th>
                                    <th className="p-4 hidden md:table-cell cursor-pointer hover:text-white" onClick={() => requestSort('brand')}>Brand</th>
                                    <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => requestSort('standard_rate')}>Price</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {paginatedData.map(p => (
                                    <tr key={p.item_code} className="group hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-3 text-center">
                                            <div onClick={(e) => {e.stopPropagation(); triggerDirectUpload(p.item_code)}} className="relative w-10 h-10 mx-auto bg-zinc-950 rounded border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-500 group-hover/img:scale-105 transition-all">
                                                <img src={`/images/${p.item_code}.jpg?v=${(p as any).imageVersion || ''}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('bg-zinc-900'); e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden'); }} />
                                                <div className="fallback hidden absolute inset-0 flex items-center justify-center text-zinc-700"><Upload size={14}/></div>
                                                {uploading && targetItemCode === p.item_code && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><RefreshCw size={14} className="animate-spin text-white"/></div>}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-white truncate max-w-[180px] md:max-w-xs">{p.item_name}</div>
                                            <div className="text-[10px] font-mono text-zinc-600">{p.item_code}</div>
                                        </td>
                                        <td className="p-3 hidden md:table-cell">
                                            <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-medium text-zinc-400">{p.brand}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-zinc-300">
                                            {p.standard_rate ? `₹${p.standard_rate}` : <span className="text-red-500 text-[10px]">₹0</span>}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => openEditModal(p)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"><Edit3 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-2 text-xs font-mono text-zinc-500">
                        <button disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)} className="hover:text-white disabled:opacity-30">PREV</button>
                        <span>PAGE {currentPage} / {totalPages}</span>
                        <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)} className="hover:text-white disabled:opacity-30">NEXT</button>
                    </div>
                )}
             </div>
          )}

        </main>
      </div>

      {editingItem && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-sm p-0 md:p-4">
             <div className="bg-zinc-950 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <h3 className="font-bold text-lg">Edit Product</h3>
                    <button onClick={() => setEditingItem(null)}><X className="text-zinc-500 hover:text-white"/></button>
                 </div>
                 <div className="p-6 overflow-y-auto space-y-5 bg-zinc-950">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Item Name</label>
                        <input className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-600 outline-none mt-1 font-bold" value={editForm.item_name} onChange={e => setEditForm({...editForm, item_name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Price</label>
                            <input type="number" className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-600 outline-none mt-1 font-mono" value={editForm.standard_rate} onChange={e => setEditForm({...editForm, standard_rate: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-zinc-500 uppercase">Stock Qty</label>
                             <input type="number" className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-zinc-600 outline-none mt-1 font-mono" value={editForm.stock_qty} onChange={e => setEditForm({...editForm, stock_qty: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <button onClick={() => setEditForm({...editForm, in_stock: !editForm.in_stock})} className={`flex-1 p-3 rounded-xl border font-bold text-xs transition-colors ${editForm.in_stock ? 'bg-green-900/20 border-green-900 text-green-400' : 'bg-red-900/20 border-red-900 text-red-400'}`}>{editForm.in_stock ? "IN STOCK" : "OUT OF STOCK"}</button>
                         <button onClick={() => setEditForm({...editForm, is_hot: !editForm.is_hot})} className={`flex-1 p-3 rounded-xl border font-bold text-xs transition-colors ${editForm.is_hot ? 'bg-orange-900/20 border-orange-900 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{editForm.is_hot ? "🔥 HOT ITEM" : "REGULAR ITEM"}</button>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 flex items-center gap-4">
                         <div className="w-16 h-16 bg-black rounded-lg border border-zinc-800 overflow-hidden flex-none">
                            <img src={`/images/${editForm.item_code}.jpg`} className="w-full h-full object-contain" />
                         </div>
                         <div className="flex-1">
                            <label className="block text-xs font-bold text-zinc-500 mb-2">Update Photo</label>
                            <div className="flex gap-2">
                                <label className="cursor-pointer bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-700">
                                    <Layers size={14}/> Choose File <input type="file" className="hidden" onChange={e => setSelectedFiles(e.target.files)} />
                                </label>
                                {selectedFiles && <button onClick={handleImageUpload} disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">{uploading ? "..." : "Upload"}</button>}
                            </div>
                         </div>
                    </div>
                 </div>
                 <div className="p-5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900">
                     <button onClick={() => setEditingItem(null)} className="px-6 py-3 rounded-xl font-bold text-sm text-zinc-400 hover:text-white">Cancel</button>
                     <button onClick={handleSaveItem} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200">Save Changes</button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}