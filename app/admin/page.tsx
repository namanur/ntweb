"use client";
import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { Package, DollarSign, ShoppingCart, TrendingUp, Search, Save, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, pendingOrders: 0, lowStock: 0 });
  const [search, setSearch] = useState("");

  // Simple Auth (Replace with real auth later)
  const handleLogin = () => {
    if (password === "admin123") { // 🔒 Change this!
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Invalid Password");
    }
  };

  const fetchData = async () => {
    // In a real app, these would be API calls to ERPNext
    // For now, we mock the stats based on local data
    const res = await fetch('/api/seed'); // Using your existing seed route or create a new products route
    // Note: You need an API route that returns JSON products. 
    // Assuming we fetch from your sync file for now:
    import('@/src/data/products.json').then(mod => {
        setProducts(mod.default as any);
        setStats({
            totalSales: 154300, // Mock data
            pendingOrders: 12,
            lowStock: mod.default.length > 5 ? 5 : 0
        });
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-sm p-8 bg-card border border-border rounded-3xl shadow-2xl">
          <h1 className="text-2xl font-black mb-6 text-center uppercase tracking-widest">Admin Access</h1>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            className="w-full p-4 mb-4 bg-secondary rounded-2xl border border-border focus:border-foreground outline-none transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="w-full bg-foreground text-background font-bold p-4 rounded-2xl hover:scale-105 transition-transform">
            Unlock Dashboard
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => 
    p.item_name.toLowerCase().includes(search.toLowerCase()) || 
    p.item_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-border p-6 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="font-black text-xl tracking-widest uppercase mb-10">NT Admin</div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-foreground text-background' : 'hover:bg-secondary text-muted-foreground'}`}>
            <TrendingUp size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab("products")} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-foreground text-background' : 'hover:bg-secondary text-muted-foreground'}`}>
            <Package size={18} /> Inventory & Price
          </button>
          <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-foreground text-background' : 'hover:bg-secondary text-muted-foreground'}`}>
            <ShoppingCart size={18} /> Orders
          </button>
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="mt-auto text-xs font-bold text-muted-foreground hover:text-destructive">Log Out</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black capitalize">{activeTab}</h1>
          <button onClick={fetchData} className="p-3 bg-secondary rounded-full hover:rotate-180 transition-transform duration-500">
            <RefreshCw size={20} />
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Total Sales</span>
                    <DollarSign className="text-green-500" />
                </div>
                <div className="text-4xl font-black">₹{stats.totalSales.toLocaleString()}</div>
            </div>
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Pending Orders</span>
                    <ShoppingCart className="text-blue-500" />
                </div>
                <div className="text-4xl font-black">{stats.pendingOrders}</div>
            </div>
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Low Stock</span>
                    <Package className="text-orange-500" />
                </div>
                <div className="text-4xl font-black">{stats.lowStock}</div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                    placeholder="Search by name or code..." 
                    className="w-full pl-12 p-4 bg-secondary rounded-2xl outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="p-4 font-bold">Item Code</th>
                            <th className="p-4 font-bold">Name</th>
                            <th className="p-4 font-bold text-right">Price (₹)</th>
                            <th className="p-4 font-bold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredProducts.slice(0, 50).map(p => (
                            <tr key={p.item_code} className="hover:bg-secondary/30 transition-colors">
                                <td className="p-4 font-mono text-xs text-muted-foreground">{p.item_code}</td>
                                <td className="p-4 font-bold text-sm">{p.item_name}</td>
                                <td className="p-4 text-right">
                                    <input 
                                        defaultValue={p.standard_rate} 
                                        className="w-24 text-right bg-transparent border-b border-border focus:border-foreground outline-none font-mono"
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-xs bg-foreground text-background px-3 py-1.5 rounded-full font-bold hover:opacity-80">
                                        Update
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}