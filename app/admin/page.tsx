"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Order } from '@/lib/erp';
import Image from 'next/image';
import { 
  LayoutDashboard, Package, ShoppingCart, Server, Database, LogOut, Save, X, Edit3, 
  CheckCircle2, AlertTriangle, RefreshCw, Search, Upload, Layers, Play, FileText, ArrowUpDown, ChevronDown, 
  AlertCircle, Flame, Clock, Truck // ✅ ADDED Clock & Truck
} from 'lucide-react';
import { logoutAction } from '@/app/login/actions'; 

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
        {icon} {label}
    </button>
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [testStatus, setTestStatus] = useState({ telegram: "Idle", erp: "Idle" });

  const [filterBrand, setFilterBrand] = useState("All");
  const [filterStock, setFilterStock] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchData(); 
  }, []);

  // ✅ Dashboard Stats Calculation
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.in_stock !== false).length;
    const outOfStock = products.filter(p => p.in_stock === false).length;
    const priceWarning = products.filter(p => p.standard_rate < 2).length;
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
        const res = await fetch('/api/admin/order-action', {
            method: 'POST',
            body: JSON.stringify({ action, orderId })
        });
        
        const data = await res.json();
        if(res.ok) {
            if(action !== 'mark_out_for_delivery') alert("Success: " + data.message);
            fetchOrders(); 
        } else {
            alert("Failed: " + (data.error || "Unknown Error"));
        }
    } catch(e: any) { alert("Network Error: " + e.message); }
    setLoading(false);
  };

  const openEditModal = (product: Product) => { 
      setEditingItem(product); 
      setEditForm({ 
          ...product,
          stock_qty: product.stock_qty !== undefined ? product.stock_qty : 0, 
          threshold: product.threshold !== undefined ? product.threshold : 2, 
          in_stock: product.in_stock !== undefined ? product.in_stock : true,
          is_hot: product.is_hot || false
      }); 
      setSelectedFiles(null); 
  };
  
  const handleSaveItem = async () => { 
      if (!editingItem) return;
      try {
          const res = await fetch('/api/products/update', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ item_code: editingItem.item_code, ...editForm }) 
          });
          
          if (res.ok) { 
              alert("Updated Successfully!"); 
              setProducts(prev => prev.map(p => p.item_code === editingItem.item_code ? { ...p, ...editForm } as Product : p)); 
              setEditingItem(null); 
          } else { alert("Failed to save changes."); }
      } catch (e) { alert("Network Error"); }
  };

  const handleImageUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !editingItem?.item_code) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("item_code", editingItem.item_code);
    
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("file", selectedFiles[i]);
    }

    try {
      const res = await fetch("/api/products/update", { method: "POST", body: formData });
      if (res.ok) {
        alert("✅ Uploaded " + selectedFiles.length + " images!");
        const img = document.getElementById("preview-img") as HTMLImageElement;
        if(img) img.src = `/images/${editingItem.item_code}.jpg?t=${new Date().getTime()}`;
        setSelectedFiles(null);
      } else { alert("Upload Failed"); }
    } catch (e) { alert("Error"); } finally { setUploading(false); }
  };

  const uniqueBrands = useMemo(() => {
      const brands = new Set(products.map(p => p.brand || "Generic"));
      return ["All", ...Array.from(brands).sort()];
  }, [products]);

  const processedProducts = useMemo(() => {
      let result = [...products];

      if (search) {
          const s = search.toLowerCase();
          result = result.filter(p => (p.item_name || "").toLowerCase().includes(s) || (p.item_code || "").toLowerCase().includes(s));
      }

      if (filterBrand !== "All") {
          result = result.filter(p => (p.brand || "Generic") === filterBrand);
      }

      if (filterStock === "In Stock") {
          result = result.filter(p => p.in_stock !== false);
      } else if (filterStock === "Out of Stock") {
          result = result.filter(p => p.in_stock === false);
      }

      if (sortConfig) {
          result.sort((a, b) => {
              const aVal = a[sortConfig.key] ?? "";
              const bVal = b[sortConfig.key] ?? "";
              
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return result;
  }, [products, search, filterBrand, filterStock, sortConfig]);

  const requestSort = (key: keyof Product) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      <aside className="w-72 border-r border-zinc-900 p-6 flex flex-col hidden md:flex sticky top-0 h-screen bg-black">
        <div className="flex items-center gap-3 mb-12 px-2"><div className="relative w-10 h-10"><Image src="/logo.png" alt="Admin Logo" fill className="object-contain invert brightness-0" /></div><span className="font-bold text-lg tracking-wide">COMMAND</span></div>
        <nav className="space-y-1 flex-1">
          <NavButton active={activeTab === 'orders'} onClick={() => setActiveTab("orders")} icon={<ShoppingCart size={20} />} label="Order Management" />
          <NavButton active={activeTab === 'products'} onClick={() => setActiveTab("products")} icon={<Package size={20} />} label="Inventory" />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="System Health" />
        </nav>
        <button onClick={() => logoutAction()} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={18} /> Sign Out</button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-xl z-20 py-4 border-b border-zinc-900 md:border-none">
          <h1 className="text-2xl md:text-3xl font-black capitalize tracking-tight">{activeTab}</h1>
          <button onClick={() => { if(activeTab === 'orders') fetchOrders(); else fetchData(); }} disabled={loading} className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`p-5 rounded-2xl border ${stats.priceWarning > 0 ? 'bg-red-900/20 border-red-800' : 'bg-zinc-900/30 border-zinc-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className={stats.priceWarning > 0 ? "text-red-500" : "text-zinc-500"} />
                        <span className="text-xs font-bold uppercase text-zinc-500">Fix Price</span>
                    </div>
                    <div className="text-3xl font-black">{stats.priceWarning}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Items &lt; ₹2.00</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-xs font-bold uppercase text-zinc-500">In Stock</span>
                    </div>
                    <div className="text-3xl font-black">{stats.inStock}</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span className="text-xs font-bold uppercase text-zinc-500">No Stock</span>
                    </div>
                    <div className="text-3xl font-black">{stats.outOfStock}</div>
                </div>

                 <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame size={16} className="text-purple-500" />
                        <span className="text-xs font-bold uppercase text-zinc-500">New / Hot</span>
                    </div>
                    <div className="text-3xl font-black">{stats.hotItems}</div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={16} className="text-blue-500" />
                        <span className="text-xs font-bold uppercase text-zinc-500">Total</span>
                    </div>
                    <div className="text-3xl font-black">{stats.total}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/30">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Telegram Bot</span><div className="p-2 bg-blue-900/20 text-blue-400 rounded-lg"><Server size={20} /></div></div>
                    <div className="flex flex-col gap-3"><div className="text-xs text-zinc-500 font-mono bg-black p-3 rounded-lg border border-zinc-800 break-words">{testStatus.telegram}</div><button onClick={() => runSystemTest('telegram')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"><Play size={14} /> Send Test Alert</button></div>
                </div>
                <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/30">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-orange-400 uppercase tracking-wider">ERPNext Link</span><div className="p-2 bg-orange-900/20 text-orange-400 rounded-lg"><Database size={20} /></div></div>
                    <div className="flex flex-col gap-3"><div className="text-xs text-zinc-500 font-mono bg-black p-3 rounded-lg border border-zinc-800 break-words">{testStatus.erp}</div><button onClick={() => runSystemTest('erp')} className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"><RefreshCw size={14} /> Test Connection</button></div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
            <div className="space-y-4">
                {orders.length === 0 ? <div className="text-center py-20 text-zinc-500">No orders received yet.</div> : orders.map(order => (
                    <div key={order.id} className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl hover:bg-zinc-900/50 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-white">{order.id}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'Pending' ? 'bg-yellow-900/30 text-yellow-500' : order.status === 'Out for Delivery' ? 'bg-purple-900/30 text-purple-500' : 'bg-green-900/30 text-green-500'}`}>{order.status}</span>
                                    {order.erp_synced ? 
                                        <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-900/10 px-2 py-0.5 rounded border border-green-900/30"><CheckCircle2 size={10}/> Synced</span> : 
                                        <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-900/10 px-2 py-0.5 rounded border border-red-900/30 cursor-help" title="Sync Failed."><AlertTriangle size={10}/> Failed</span>
                                    }
                                </div>
                                <div className="text-xs text-zinc-400 mt-2 space-y-1">
                                    <div className="flex items-center gap-2"><Clock size={12}/> {new Date(order.date).toLocaleString()}</div>
                                    <div className="flex items-center gap-2 font-bold text-white"><Truck size={12}/> {order.customer.name} ({order.customer.phone})</div>
                                    <div className="pl-5 opacity-70">{order.customer.address}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-white">₹{order.total.toLocaleString()}</div>
                                <div className="text-xs text-zinc-600">{order.items.length} Items</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                            {!order.erp_synced && <button onClick={() => handleOrderAction('sync_erp', order.id)} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-red-900/30"><RefreshCw size={14} /> Retry Sync</button>}
                            {(order.status === 'Pending' || order.status === 'Packed') && (
                                <button onClick={() => { handleOrderAction('mark_out_for_delivery', order.id); window.open(`/invoice/${order.id}`, '_blank'); }} className="flex-1 bg-zinc-100 text-black hover:bg-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"><FileText size={14} /> Order Sheet</button>
                            )}
                            {order.status === 'Out for Delivery' && (
                                <button onClick={() => handleOrderAction('mark_delivered', order.id)} className="flex-1 bg-green-600 text-white hover:bg-green-500 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"><CheckCircle2 size={14} /> Mark Delivered</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="relative group md:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={20} />
                    <input placeholder="Search inventory..." className="w-full pl-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="relative">
                     <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full appearance-none p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl outline-none focus:border-zinc-600 text-white cursor-pointer hover:bg-zinc-900 transition-colors">
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                     <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="w-full appearance-none p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl outline-none focus:border-zinc-600 text-white cursor-pointer hover:bg-zinc-900 transition-colors">
                        <option value="All">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                            <tr>
                                <th onClick={() => requestSort('item_name')} className="p-5 font-bold cursor-pointer hover:text-white transition-colors group/th"><div className="flex items-center gap-2">Details <ArrowUpDown size={12} className="opacity-30 group-hover/th:opacity-100"/></div></th>
                                <th onClick={() => requestSort('brand')} className="p-5 font-bold cursor-pointer hover:text-white transition-colors group/th"><div className="flex items-center gap-2">Brand <ArrowUpDown size={12} className="opacity-30 group-hover/th:opacity-100"/></div></th>
                                <th onClick={() => requestSort('standard_rate')} className="p-5 font-bold text-right cursor-pointer hover:text-white transition-colors group/th"><div className="flex items-center justify-end gap-2">Price (₹) <ArrowUpDown size={12} className="opacity-30 group-hover/th:opacity-100"/></div></th>
                                <th className="p-5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {processedProducts.slice(0, 50).map(p => (
                                <tr key={p.item_code} className="hover:bg-zinc-900/50 transition-colors group">
                                    <td className="p-5"><div className="font-bold text-sm text-zinc-200">{p.item_name}</div><div className="font-mono text-[10px] text-zinc-600 mt-1">{p.item_code}</div></td>
                                    <td className="p-5"><span className="text-xs font-medium bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md text-zinc-400">{p.brand}</span>{p.in_stock === false && <span className="ml-2 text-[10px] font-bold bg-red-900/50 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">OOS</span>}</td>
                                    <td className="p-5 text-right font-mono font-bold text-zinc-300">₹{p.standard_rate}</td>
                                    <td className="p-5 text-center"><button onClick={() => openEditModal(p)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-2 mx-auto text-xs font-bold"><Edit3 size={14} /> Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}
      </main>

      {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-xl font-black uppercase tracking-wide">Edit Item</h2>
                    <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Item Name</label>
                        <input 
                          className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors text-lg font-bold" 
                          value={editForm.item_name || ""} 
                          onChange={e => setEditForm({...editForm, item_name: e.target.value})} 
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        
                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Price (₹)</label>
                          <input 
                            type="number" 
                            className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors font-mono font-bold" 
                            value={editForm.standard_rate !== undefined ? editForm.standard_rate : ""} 
                            onChange={e => setEditForm({...editForm, standard_rate: e.target.value === "" ? 0 : parseFloat(e.target.value)})} 
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Stock Qty</label>
                          <input 
                            type="number" 
                            min="0" 
                            className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors font-mono" 
                            value={editForm.stock_qty !== undefined ? editForm.stock_qty : ""} 
                            onChange={e => setEditForm({...editForm, stock_qty: e.target.value === "" ? 0 : parseFloat(e.target.value)})} 
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Threshold</label>
                          <input 
                            type="number" 
                            min="0" 
                            className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors font-mono" 
                            value={editForm.threshold !== undefined ? editForm.threshold : ""} 
                            onChange={e => setEditForm({...editForm, threshold: e.target.value === "" ? 0 : parseFloat(e.target.value)})} 
                          />
                        </div>

                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Status</label>
                           <button
                             onClick={() => setEditForm({ ...editForm, in_stock: !editForm.in_stock })}
                             className={`w-full h-[50px] rounded-xl flex items-center px-2 transition-all duration-300 border ${editForm.in_stock ? 'bg-green-900/30 border-green-900' : 'bg-red-900/20 border-red-900'}`}
                           >
                              <div className="flex items-center gap-3 w-full">
                                  <div className={`w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${editForm.in_stock ? 'bg-green-500 translate-x-full' : 'bg-red-500 translate-x-0'}`}></div>
                                  <span className={`text-xs font-bold flex-1 text-center ${editForm.in_stock ? 'text-green-500' : 'text-red-500'}`}>
                                      {editForm.in_stock ? "In Stock" : "OOS"}
                                  </span>
                              </div>
                           </button>
                        </div>

                      </div>
                      
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${editForm.is_hot ? 'bg-orange-900/20 text-orange-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                <Flame size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Mark as New / Hot</h3>
                                <p className="text-[10px] text-zinc-500">Shows in the scrolling list on home page</p>
                            </div>
                         </div>
                         <button 
                             onClick={() => setEditForm({ ...editForm, is_hot: !editForm.is_hot })}
                             className={`w-12 h-6 rounded-full transition-colors relative ${editForm.is_hot ? 'bg-orange-500' : 'bg-zinc-700'}`}
                         >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editForm.is_hot ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Description</label>
                        <textarea 
                          rows={3} 
                          className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors resize-none" 
                          value={editForm.description || ""} 
                          onChange={e => setEditForm({...editForm, description: e.target.value})} 
                        />
                      </div>
                      
                      <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 flex gap-5 items-center">
                        <div className="h-24 w-24 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-800 relative group">
                          <img id="preview-img" src={`/images/${editForm.item_code}.jpg`} alt="Preview" className="h-full w-full object-contain" onError={(e) => e.currentTarget.src = "https://placehold.co/100/18181b/ffffff?text=No+Img"} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-zinc-500 uppercase block mb-3">Product Images</label>
                          <div className="flex gap-3 items-center">
                            <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                              <Layers size={14} /> 
                              {selectedFiles && selectedFiles.length > 0 ? `${selectedFiles.length} Files Selected` : "Select Photos"}
                              <input type="file" multiple accept="image/jpeg, image/png" className="hidden" onChange={(e) => setSelectedFiles(e.target.files)} />
                            </label>
                            {selectedFiles && <button onClick={handleImageUpload} disabled={uploading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50">{uploading ? <RefreshCw className="animate-spin" size={14}/> : <Upload size={14} />}{uploading ? "..." : "Upload All"}</button>}
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-2">Uploading will overwrite the main image with the first selected file.</p>
                        </div>
                      </div>

                  </div>

                  <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                      <button onClick={() => setEditingItem(null)} className="px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">Cancel</button>
                      <button onClick={handleSaveItem} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"><Save size={16} /> Save Changes</button>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
}