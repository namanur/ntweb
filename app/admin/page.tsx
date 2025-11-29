"use client";
import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  AlertCircle,
  LogOut,
  ChevronRight,
  Save,
  X,
  Upload,
  Edit3
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'}`}>
        {icon} {label}
    </button>
);

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{title}</span>
            <div className="p-2 bg-zinc-900 rounded-lg">{icon}</div>
        </div>
        <div className="text-4xl font-black text-white">{value}</div>
    </div>
);

// --- MAIN PAGE COMPONENT ---

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, pendingOrders: 0, lowStock: 0 });
  const [search, setSearch] = useState("");

  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const handleLogin = () => {
    if (password === "admin123") { 
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Invalid Password");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        // Use the fetch API to get data from our local JSON file via the API route
        // This ensures it works in production builds too
        const res = await fetch('/api/seed'); // or create a specific GET /api/products route
        if (res.ok) {
            const json = await res.json();
             // Handle different response structures
             const data = Array.isArray(json) ? json : (json.data || []);
             
             if (Array.isArray(data)) {
                 setProducts(data);
                 // Mock Stats Calculation
                 const lowStockCount = data.filter((p: any) => (p.standard_rate || 0) === 0).length; 
                 setStats({
                     totalSales: 1254300, 
                     pendingOrders: 14,
                     lowStock: lowStockCount
                 });
             } else {
                 console.error("Data format incorrect:", json);
                 setProducts([]);
             }
        } else {
            console.error("Failed to fetch data");
        }
    } catch (e) {
        console.error("Failed to load data", e);
        setProducts([]);
    }
    setLoading(false);
  };

  const openEditModal = (product: Product) => {
      setEditingItem(product);
      setEditForm({ ...product });
  };

  const handleSaveItem = async () => {
      if (!editingItem || !editingItem.item_code) return;
      
      try {
          const res = await fetch('/api/products/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ item_code: editingItem.item_code, ...editForm })
          });
          
          if (res.ok) {
              alert("✅ Item Updated!");
              // Optimistic update
              setProducts(prev => prev.map(p => p.item_code === editingItem.item_code ? { ...p, ...editForm } as Product : p));
              setEditingItem(null);
          } else {
              alert("❌ Update Failed");
          }
      } catch (e) {
          alert("Connection Error");
      }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 font-sans">
        <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center mx-auto mb-4 font-black text-xl">N</div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-400">Admin Access</h1>
          </div>
          <input 
            type="password" 
            placeholder="Passkey" 
            className="w-full p-4 mb-4 bg-black rounded-xl border border-zinc-800 focus:border-white focus:ring-0 outline-none transition-all text-center text-white placeholder:text-zinc-700 font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin} className="w-full bg-white text-black font-bold p-4 rounded-xl hover:bg-zinc-200 transition-colors">
            Unlock Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    (p.item_name || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.item_code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      
      {/* EDIT MODAL */}
      {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                      <h2 className="text-xl font-black uppercase tracking-wide">Edit Item</h2>
                      <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Item Name</label>
                              <input 
                                  className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                                  value={editForm.item_name || ""}
                                  onChange={e => setEditForm({...editForm, item_name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Item Code (Read Only)</label>
                              <input 
                                  className="w-full p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-500 cursor-not-allowed font-mono"
                                  value={editForm.item_code || ""}
                                  readOnly
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Standard Rate (₹)</label>
                              <input 
                                  type="number"
                                  className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors font-mono"
                                  value={editForm.standard_rate !== undefined ? editForm.standard_rate : ""}
                                  onChange={e => setEditForm({...editForm, standard_rate: e.target.value === "" ? 0 : parseFloat(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Brand</label>
                              <input 
                                  className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors"
                                  value={editForm.brand || ""}
                                  onChange={e => setEditForm({...editForm, brand: e.target.value})}
                              />
                          </div>
                          <div className="md:col-span-2">
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Description</label>
                              <textarea 
                                  rows={3}
                                  className="w-full p-3 bg-black border border-zinc-800 rounded-xl focus:border-white outline-none transition-colors resize-none"
                                  value={editForm.description || ""}
                                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                              />
                          </div>
                          
                          <div className="md:col-span-2">
                              <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Product Image</label>
                              <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center hover:border-zinc-600 transition-colors cursor-pointer bg-black group">
                                  <Upload className="text-zinc-500 mb-2 group-hover:text-white" size={24} />
                                  <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200">Click to upload new image</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                      <button onClick={() => setEditingItem(null)} className="px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors">Cancel</button>
                      <button onClick={handleSaveItem} className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2">
                          <Save size={16} /> Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SIDEBAR (Desktop) */}
      <aside className="w-72 border-r border-zinc-900 p-6 flex flex-col hidden md:flex sticky top-0 h-screen bg-black">
        <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black">N</div>
            <span className="font-bold text-lg tracking-wide">COMMAND</span>
        </div>
        
        <nav className="space-y-1 flex-1">
          <NavButton active={activeTab === 'products'} onClick={() => setActiveTab("products")} icon={<Package size={20} />} label="Inventory" />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavButton active={activeTab === 'orders'} onClick={() => setActiveTab("orders")} icon={<ShoppingCart size={20} />} label="Orders" />
        </nav>

        <button onClick={() => setIsAuthenticated(false)} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors">
            <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-xl z-20 py-4 border-b border-zinc-900 md:border-none">
          <h1 className="text-2xl md:text-3xl font-black capitalize tracking-tight">{activeTab}</h1>
          <button onClick={fetchData} disabled={loading} className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Revenue" value={`₹${stats.totalSales.toLocaleString()}`} icon={<TrendingUp className="text-green-500" />} />
            <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<ShoppingCart className="text-blue-500" />} />
            <StatCard title="Low Stock Items" value={stats.lowStock} icon={<AlertCircle className="text-orange-500" />} />
          </div>
        )}

        {/* PRODUCTS VIEW */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={20} />
                <input 
                    placeholder="Search inventory..." 
                    className="w-full pl-12 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase text-zinc-500 tracking-wider">
                            <tr>
                                <th className="p-5 font-bold">Details</th>
                                <th className="p-5 font-bold">Category</th>
                                <th className="p-5 font-bold text-right">Price (₹)</th>
                                <th className="p-5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredProducts.slice(0, 50).map(p => (
                                <tr key={p.item_code} className="hover:bg-zinc-900/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-bold text-sm text-zinc-200">{p.item_name}</div>
                                        <div className="font-mono text-[10px] text-zinc-600 mt-1">{p.item_code}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-xs font-medium bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md text-zinc-400">
                                            {p.item_group}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-zinc-300">
                                        ₹{p.standard_rate}
                                    </td>
                                    <td className="p-5 text-center">
                                        <button 
                                            onClick={() => openEditModal(p)}
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-2 mx-auto text-xs font-bold"
                                        >
                                            <Edit3 size={14} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                                        No products found. Try running the Import Script.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        )}
      </main>
    </div>
  );
}