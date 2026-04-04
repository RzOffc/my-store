// pages/orders.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { getOrders } from '../lib/products';
import Navbar from '../components/Navbar';
import { Package, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_CONFIG = {
  pending: { label: 'Menunggu', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  processing: { label: 'Diproses', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  done: { label: 'Selesai', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getOrders().then((all) => {
        // Only show current user's orders (unless owner)
        const myOrders = user.isOwner ? all : all.filter((o) => o.userId === user.uid);
        setOrders(myOrders);
        setLoadingOrders(false);
      });
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-espresso-900">Pesanan Saya</h1>
          <p className="font-body text-espresso-600/60 mt-1">Riwayat semua pesanan Anda</p>
        </div>

        {loadingOrders ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-cream-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-espresso-600/20 mb-4" />
            <h3 className="font-display text-2xl text-espresso-700/50 mb-2">Belum ada pesanan</h3>
            <p className="font-body text-espresso-600/40">Mulai belanja untuk melihat pesanan di sini</p>
            <button onClick={() => router.push('/')} className="btn-primary mt-6">
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-cream-50 transition-colors text-left">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${status.bg}`}>
                        <StatusIcon size={18} className={status.color} />
                      </div>
                      <div>
                        <p className="font-body font-medium text-espresso-900 text-sm">
                          #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs font-mono text-espresso-600/50 mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="font-display font-bold text-espresso-900">{formatRupiah(order.total)}</p>
                        <span className={`text-xs font-mono ${status.color}`}>{status.label}</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-espresso-600/40" /> : <ChevronDown size={16} className="text-espresso-600/40" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 border-t border-amber-brand/8 animate-fade-in">
                      <div className="pt-4 space-y-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-body text-sm text-espresso-800">{item.name}</p>
                              <p className="font-mono text-xs text-espresso-600/50">{item.qty}x {formatRupiah(item.price)}</p>
                            </div>
                            <p className="font-body font-medium text-espresso-900 text-sm">{formatRupiah(item.price * item.qty)}</p>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-amber-brand/10 flex justify-between">
                          <span className="font-body text-sm text-espresso-600/60">Total</span>
                          <span className="font-display font-bold text-espresso-900">{formatRupiah(order.total)}</span>
                        </div>
                        {order.note && (
                          <div className="mt-3 p-3 bg-cream-100 rounded-xl">
                            <p className="font-mono text-xs text-espresso-600/60 mb-1">Catatan:</p>
                            <p className="font-body text-sm text-espresso-800">{order.note}</p>
                          </div>
                        )}
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
