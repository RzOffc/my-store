// pages/owner/orders.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/AuthContext';
import { getOrders, updateOrderStatus } from '../../lib/products';
import { OwnerNavbar } from './index';
import toast from 'react-hot-toast';
import { Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'processing', label: 'Diproses', color: 'text-blue-600 bg-blue-50' },
  { value: 'done', label: 'Selesai', color: 'text-green-600 bg-green-50' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'text-red-500 bg-red-50' },
];

export default function OwnerOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!user.isOwner) router.replace('/');
    }
  }, [user, loading, router]);

  const loadOrders = () => {
    setLoadingOrders(true);
    getOrders().then((o) => {
      setOrders(o);
      setLoadingOrders(false);
    });
  };

  useEffect(() => {
    if (user?.isOwner) loadOrders();
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    const { success, error } = await updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Status pesanan diperbarui');
    } else {
      toast.error('Gagal update status: ' + error);
    }
    setUpdatingStatus(null);
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !search || 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.status === 'done')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading || !user?.isOwner) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <OwnerNavbar active="orders" />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-0.5">Manajemen</p>
            <h1 className="font-display text-4xl font-bold text-espresso-900">Pesanan</h1>
          </div>
          <button onClick={loadOrders} className="btn-ghost py-2.5 px-4">
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Pesanan', value: orders.length, color: 'text-espresso-900' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'Selesai', value: orders.filter(o => o.status === 'done').length, color: 'text-green-600' },
            { label: 'Pendapatan', value: formatRupiah(totalRevenue), color: 'text-amber-brand' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-amber-brand/8 shadow-sm">
              <p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-espresso-600/60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-600/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pesanan / nama..."
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded-xl text-sm font-body transition-all ${filterStatus === 'all' ? 'bg-espresso-900 text-cream-50' : 'bg-white border border-amber-brand/15 text-espresso-700 hover:bg-cream-100'}`}>
              Semua
            </button>
            {STATUSES.map((s) => (
              <button key={s.value} onClick={() => setFilterStatus(s.value)}
                className={`px-3 py-2 rounded-xl text-sm font-body transition-all ${filterStatus === s.value ? 'bg-espresso-900 text-cream-50' : 'bg-white border border-amber-brand/15 text-espresso-700 hover:bg-cream-100'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loadingOrders ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-cream-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-2xl text-espresso-700/40">Tidak ada pesanan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const statusConf = STATUSES.find(s => s.value === order.status) || STATUSES[0];
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 px-6 py-4">
                    <button
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className="flex-1 flex items-center gap-4 text-left">
                      <div>
                        <p className="font-mono text-sm font-medium text-espresso-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs font-body text-espresso-600/50 mt-0.5">
                          {order.customer?.name} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="hidden sm:block ml-auto">
                        <p className="font-display font-bold text-espresso-900 text-sm">{formatRupiah(order.total)}</p>
                        <p className="text-xs font-body text-espresso-600/40">{order.items?.length} item</p>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-espresso-600/30 flex-shrink-0" /> : <ChevronDown size={16} className="text-espresso-600/30 flex-shrink-0" />}
                    </button>

                    {/* Status dropdown */}
                    <div className="flex-shrink-0">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`text-xs font-mono px-3 py-2 rounded-xl border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-brand/30 ${statusConf.color} disabled:opacity-50`}>
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-5 border-t border-amber-brand/8 animate-fade-in">
                      <div className="pt-4 grid sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-mono text-xs text-espresso-600/50 uppercase tracking-wider mb-2">Item Pesanan</h4>
                          <div className="space-y-2">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="font-body text-espresso-800">{item.name} <span className="text-espresso-600/50">×{item.qty}</span></span>
                                <span className="font-display font-semibold text-espresso-900">{formatRupiah(item.price * item.qty)}</span>
                              </div>
                            ))}
                            <div className="pt-2 border-t border-amber-brand/10 flex justify-between font-body font-semibold">
                              <span>Total</span>
                              <span className="text-amber-brand">{formatRupiah(order.total)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-mono text-xs text-espresso-600/50 uppercase tracking-wider mb-2">Info Customer</h4>
                          <div className="space-y-1 text-sm font-body text-espresso-800">
                            <p><span className="text-espresso-600/50">Nama:</span> {order.customer?.name || '-'}</p>
                            <p><span className="text-espresso-600/50">Email:</span> {order.customer?.email || '-'}</p>
                            <p><span className="text-espresso-600/50">HP:</span> {order.customer?.phone || '-'}</p>
                            {order.note && <p><span className="text-espresso-600/50">Catatan:</span> {order.note}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
