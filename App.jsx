import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Search, 
  AlertCircle, 
  History, 
  LayoutDashboard, 
  Settings,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Stethoscope,
  Pill,
  Thermometer,
  ShieldAlert,
  Save
} from 'lucide-react';

// --- Pharmacy Constants ---
const CATEGORIES = ["Analgesics", "Antibiotics", "Antivirals", "Cardiovascular", "Dermatological", "Vitamins", "Supplements"];
const DOSAGE_FORMS = ["Tablets", "Capsules", "Syrup (ml)", "Injection", "Ointment", "Drops"];

const App = () => {
  // --- State Management ---
  const [view, setView] = useState('dashboard');
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('pharma_525_inventory');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Amoxicillin 500mg', sku: 'RX-AMX-01', category: 'Antibiotics', form: 'Capsules', quantity: 450, minStock: 100, price: 0.50 },
      { id: '2', name: 'Paracetamol 500mg', sku: 'OTC-PCM-05', category: 'Analgesics', form: 'Tablets', quantity: 1200, minStock: 200, price: 0.05 },
      { id: '3', name: 'Loratadine 10mg', sku: 'OTC-LOR-02', category: 'Supplements', form: 'Tablets', quantity: 80, minStock: 100, price: 0.15 },
    ];
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('pharma_525_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('pharma_525_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('pharma_525_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- Analytical Calculations ---
  const lowStockItems = useMemo(() => 
    inventory.filter(item => item.quantity <= item.minStock), 
  [inventory]);

  const totalValue = useMemo(() => 
    inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0),
  [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  // --- Logic Handlers ---
  const handleAddOrEditItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemData = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.get('name'),
      sku: formData.get('sku'),
      category: formData.get('category'),
      form: formData.get('form'),
      quantity: parseInt(formData.get('quantity')),
      minStock: parseInt(formData.get('minStock')),
      price: parseFloat(formData.get('price')),
    };

    if (editingItem) {
      setInventory(prev => prev.map(i => i.id === editingItem.id ? itemData : i));
    } else {
      setInventory(prev => [...prev, itemData]);
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const adjustStock = (id, amount) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + amount);
    if (newQty === item.quantity) return;

    setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    
    const transaction = {
      id: Date.now().toString(),
      itemId: id,
      itemName: item.name,
      type: amount > 0 ? 'IN (Dispense/Restock)' : 'OUT (Sale/Dispense)',
      amount: Math.abs(amount),
      timestamp: new Date().toISOString(),
      previousQty: item.quantity,
      newQty: newQty
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const deleteItem = (id) => {
    if (window.confirm('Remove this medication from inventory? This cannot be undone.')) {
      setInventory(prev => prev.filter(i => i.id !== id));
    }
  };

  // --- UI Sections ---
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-cyan-500 shadow-sm">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total SKU Count</p>
          <div className="flex items-center justify-between mt-3">
            <h3 className="text-3xl font-bold text-slate-800">{inventory.length}</h3>
            <Pill className="text-cyan-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-teal-500 shadow-sm">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Inventory Value</p>
          <div className="flex items-center justify-between mt-3">
            <h3 className="text-3xl font-bold text-slate-800">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            <Thermometer className="text-teal-500" size={28} />
          </div>
        </div>
        <div className={`p-6 rounded-2xl border-l-4 shadow-sm transition-colors ${lowStockItems.length > 0 ? 'bg-red-50 border-l-red-500' : 'bg-emerald-50 border-l-emerald-500'}`}>
          <p className={`text-sm font-semibold uppercase tracking-wider ${lowStockItems.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Stock Alerts</p>
          <div className="flex items-center justify-between mt-3">
            <h3 className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-800' : 'text-emerald-800'}`}>{lowStockItems.length}</h3>
            {lowStockItems.length > 0 ? <ShieldAlert className="text-red-500" size={28} /> : <Save className="text-emerald-500" size={28} />}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Quick Dispensing / Restock</h3>
          <span className="text-xs text-slate-400 font-medium">Update stock levels instantly</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredInventory.map(item => (
            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg ${item.quantity <= item.minStock ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-600'}`}>
                  <Pill size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-mono uppercase">{item.sku} • {item.form}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className={`text-sm font-bold ${item.quantity <= item.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                    {item.quantity.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{item.form}</div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
                  <button onClick={() => adjustStock(item.id, -10)} className="px-2 py-1 hover:bg-white hover:text-red-600 hover:shadow-sm rounded transition-all font-bold text-slate-600">-10</button>
                  <button onClick={() => adjustStock(item.id, -1)} className="p-1 hover:bg-white hover:text-red-600 hover:shadow-sm rounded transition-all text-slate-600"><Minus size={16} /></button>
                  <div className="w-px bg-slate-200 mx-1"></div>
                  <button onClick={() => adjustStock(item.id, 1)} className="p-1 hover:bg-white hover:text-teal-600 hover:shadow-sm rounded transition-all text-slate-600"><Plus size={16} /></button>
                  <button onClick={() => adjustStock(item.id, 10)} className="px-2 py-1 hover:bg-white hover:text-teal-600 hover:shadow-sm rounded transition-all font-bold text-slate-600">+10</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const InventoryList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Medication Name</th>
              <th className="px-6 py-4">Category / Form</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4">Unit Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-600">{item.category}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 w-fit px-1.5 py-0.5 rounded uppercase font-bold">{item.form}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`text-sm font-bold mb-1 ${item.quantity <= item.minStock ? 'text-red-500' : 'text-teal-700'}`}>
                    {item.quantity.toLocaleString()}
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.quantity <= item.minStock ? 'bg-red-500' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, (item.quantity / (item.minStock * 2)) * 100)}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-600">
                  ${item.price.toFixed(3)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/50 flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-xl text-white shadow-lg shadow-teal-500/20">
            <Stethoscope size={24} />
          </div>
          <span className="hidden lg:block font-black text-white text-2xl tracking-tighter italic">525 PHARMA</span>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 mt-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'inventory', icon: Pill, label: 'Drug Inventory' },
            { id: 'history', icon: History, label: 'Transaction Logs' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                view === item.id 
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                : 'hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon size={22} className={view === item.id ? 'animate-pulse' : ''} />
              <span className="hidden lg:block font-bold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-6 text-[10px] font-bold text-slate-600 hidden lg:block uppercase tracking-[0.2em]">
          v1.0.525-Stable
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-20 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-40">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              {view === 'dashboard' ? 'Pharmacy Control' : view.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl w-full sm:w-64 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
              />
            </div>
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Medication</span>
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <Dashboard />}
          {view === 'inventory' && <InventoryList />}
          {view === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Medication</th>
                    <th className="px-6 py-4">Event Type</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Stock Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 tabular-nums">
                        {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{t.itemName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter ${t.type.includes('IN') ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                          {t.type.includes('IN') ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">{t.amount}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {t.previousQty} → <span className="text-slate-900 font-bold">{t.newQty}</span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">Log empty. Movements will appear here.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Pharma Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {editingItem ? 'Edit Medication' : 'Register New Drug'}
                </h2>
                <p className="text-slate-500 text-sm font-medium">Update 525 Pharmacy inventory records</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddOrEditItem} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Medication Name & Strength</label>
                  <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold" placeholder="e.g. Ibuprofen 200mg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Internal SKU / Batch</label>
                    <input name="sku" defaultValue={editingItem?.sku} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-mono" placeholder="PH-525-..." />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Therapeutic Class</label>
                    <select name="category" defaultValue={editingItem?.category || CATEGORIES[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Form</label>
                    <select name="form" defaultValue={editingItem?.form || DOSAGE_FORMS[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold">
                      {DOSAGE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                    <input name="quantity" type="number" defaultValue={editingItem?.quantity || 0} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Min. Stock</label>
                    <input name="minStock" type="number" defaultValue={editingItem?.minStock || 50} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Unit Price ($)</label>
                  <input name="price" type="number" step="0.001" defaultValue={editingItem?.price || 0} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-bold" min="0" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-teal-600/30 transition-all active:scale-[0.98]">
                  {editingItem ? 'CONFIRM CHANGES' : 'AUTHORIZE REGISTRATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

```

