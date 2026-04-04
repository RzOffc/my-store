// pages/owner/products/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/AuthContext';
import { getProducts, deleteProduct } from '../../../lib/products';
import { OwnerNavbar } from '../index';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function OwnerProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!user.isOwner) router.replace('/');
    }
  }, [user, loading, router]);

  const loadProducts = () => {
    getProducts().then((p) => {
      setProducts(p);
      setLoadingProducts(false);
    });
  };

  useEffect(() => {
    if (user?.isOwner) loadProducts();
  }, [user]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus produk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    const { success, error } = await deleteProduct(id);
    if (success) {
      toast.success('Produk berhasil dihapus');
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast.error('Gagal menghapus: ' + error);
    }
    setDeleting(null);
  };

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || !user?.isOwner) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <OwnerNavbar active="products" />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-1">Manajemen</p>
            <h1 className="font-display text-4xl font-bold text-espresso-900">Produk</h1>
          </div>
          <Link href="/owner/products/new" className="btn-primary">
            <Plus size={16} />
            Produk Baru
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-600/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="input-field pl-10"
          />
        </div>

        {/* Table */}
        {loadingProducts ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-cream-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-espresso-600/20 mb-4" />
            <h3 className="font-display text-2xl text-espresso-700/50 mb-2">
              {search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </h3>
            {!search && (
              <Link href="/owner/products/new" className="btn-primary mt-4 inline-flex">
                <Plus size={16} />
                Tambah Produk Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-brand/10 bg-cream-50">
                    <th className="text-left px-6 py-4 font-mono text-xs text-espresso-600/50 uppercase tracking-wider">Produk</th>
                    <th className="text-left px-6 py-4 font-mono text-xs text-espresso-600/50 uppercase tracking-wider">Kategori</th>
                    <th className="text-left px-6 py-4 font-mono text-xs text-espresso-600/50 uppercase tracking-wider">Harga</th>
                    <th className="text-left px-6 py-4 font-mono text-xs text-espresso-600/50 uppercase tracking-wider">Stok</th>
                    <th className="text-right px-6 py-4 font-mono text-xs text-espresso-600/50 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className="border-b border-amber-brand/5 last:border-0 hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-cream-100 overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                            )}
                          </div>
                          <div>
                            <p className="font-body font-medium text-espresso-900 text-sm">{product.name}</p>
                            {product.description && (
                              <p className="font-body text-xs text-espresso-600/50 line-clamp-1 max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="px-2.5 py-1 bg-amber-brand/10 text-amber-brand text-xs font-mono rounded-full">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-espresso-600/30 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-display font-bold text-espresso-900 text-sm">{formatRupiah(product.price)}</p>
                        {product.discount > 0 && (
                          <p className="text-xs font-mono text-red-500">-{product.discount}%</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.stock !== undefined ? (
                          <span className={`flex items-center gap-1 text-xs font-mono ${
                            product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.stock <= 5 && <AlertTriangle size={11} />}
                            {product.stock === 0 ? 'Habis' : product.stock}
                          </span>
                        ) : (
                          <span className="text-xs text-espresso-600/30">∞</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/owner/products/${product.id}`}
                            className="p-2 rounded-xl text-espresso-600 hover:bg-amber-brand/10 hover:text-amber-brand transition-colors">
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deleting === product.id}
                            className="p-2 rounded-xl text-espresso-600 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
