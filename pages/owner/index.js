// pages/owner/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/AuthContext';
import { getProducts, getOrders } from '../../lib/products';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Plus, Eye, BarChart3, Settings } from 'lucide-react';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function OwnerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!user.isOwner) router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isOwner) {
      Promise.all([getProducts(), getOrders()]).then(([products, orders]) => {
        const revenue = orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.total || 0), 0);
        const pending = orders.filter((o) => o.status === 'pending').length;
        setStats({ products: products.length, orders: orders.length, revenue, pending });
        setRecentOrders(orders.slice(0, 5));
        setLowStock(products.filter((p) => p.stock !== undefined && p.stock <= 5));
      });
    }
  }, [user]);

  if (loading || !user?.isOwner) return null;

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: Package, color: '#C8873A', href: '/owner/products' },
    { label: 'Total Pesanan', value: stats.orders, icon: ShoppingBag, color: '#7A8C6E', href: '/owner/orders' },
    { label: 'Pendapatan', value: formatRupiah(stats.revenue), icon: TrendingUp, color: '#5C7AEA', href: '/owner/orders' },
    { label: 'Pesanan Pending', value: stats.pending, icon: AlertTriangle, color: '#E05252', href: '/owner/orders' },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      <OwnerNavbar active="dashboard" />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-1">Owner Panel</p>
            <h1 className="font-display text-4xl font-bold text-espresso-900">Dashboard</h1>
          </div>
          <Link href="/owner/products/new" className="btn-primary">
            <Plus size={16} />
            Produk Baru
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href}
                className="bg-white rounded-2xl p-6 border border-amber-brand/8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: card.color + '15' }}>
                    <Icon size={20} style={{ color: card.color }} />
                  </div>
                  <Eye size={14} className="text-espresso-600/20 group-hover:text-espresso-600/50 transition-colors" />
                </div>
                <p className="font-display text-2xl font-bold text-espresso-900">{card.value}</p>
                <p className="font-body text-sm text-espresso-600/60 mt-0.5">{card.label}</p>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-espresso-900">Pesanan Terbaru</h2>
              <Link href="/owner/orders" className="text-sm font-body text-amber-brand hover:text-amber-dark transition-colors">Lihat semua →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="font-body text-espresso-600/40 text-sm text-center py-8">Belum ada pesanan</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-amber-brand/8 last:border-0">
                    <div>
                      <p className="font-mono text-sm font-medium text-espresso-800">#{order.id.slice(-8).toUpperCase()}</p>
                      <p className="font-body text-xs text-espresso-600/50">{order.customer?.name || 'Customer'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-espresso-900 text-sm">{formatRupiah(order.total)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-espresso-900">Stok Rendah</h2>
              <AlertTriangle size={16} className="text-amber-brand" />
            </div>
            {lowStock.length === 0 ? (
              <p className="font-body text-espresso-600/40 text-sm text-center py-8">Semua stok aman ✓</p>
            ) : (
              <div className="space-y-3">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <p className="font-body text-sm text-espresso-800 truncate max-w-[140px]">{p.name}</p>
                    <span className={`font-mono text-xs px-2 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.stock === 0 ? 'Habis' : `Sisa ${p.stock}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    done: 'text-green-600 bg-green-50',
    cancelled: 'text-red-500 bg-red-50',
  };
  const labels = { pending: 'Pending', processing: 'Proses', done: 'Selesai', cancelled: 'Batal' };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export function OwnerNavbar({ active }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/owner', label: 'Dashboard', id: 'dashboard', icon: BarChart3 },
    { href: '/owner/products', label: 'Produk', id: 'products', icon: Package },
    { href: '/owner/orders', label: 'Pesanan', id: 'orders', icon: ShoppingBag },
    { href: '/owner/settings', label: 'Pengaturan', id: 'settings', icon: Settings },
  ];

  const { logOut } = require('../../lib/firebase');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-amber-brand/15 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #C8873A, #E6A855)' }}>
              🛍️
            </div>
            <div>
              <span className="font-display font-bold text-espresso-900 text-sm">MyStore</span>
              <span className="block font-mono text-[10px] text-amber-brand leading-none">OWNER</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.id} href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm font-medium transition-all ${
                    active === link.id ? 'bg-amber-brand/15 text-amber-brand' : 'text-espresso-700 hover:bg-amber-brand/8'
                  }`}>
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="btn-ghost text-xs py-2 px-3">
            <Eye size={13} />
            Lihat Toko
          </Link>
          {user?.photo && (
            <img src={user.photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
          )}
        </div>
      </div>
    </nav>
  );
}
