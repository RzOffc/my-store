// pages/index.js
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { getProducts } from '../lib/products';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import CartSidebar from '../components/CartSidebar';
import { Search, SlidersHorizontal, ChevronDown, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [viewProduct, setViewProduct] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getProducts().then((p) => {
        setProducts(p);
        setLoadingProducts(false);
      });
    }
  }, [user]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['Semua', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'Semua') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }

    if (sortBy === 'termurah') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'termahal') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'nama') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, selectedCategory, search, sortBy]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-float"
            style={{ background: 'linear-gradient(135deg, #C8873A, #E6A855)' }}>🛍️</div>
          <div className="w-8 h-1 bg-amber-brand/30 rounded-full overflow-hidden">
            <div className="w-full h-full bg-amber-brand rounded-full animate-shimmer shimmer-gold" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 relative overflow-hidden noise-texture"
        style={{ background: 'linear-gradient(160deg, #1A0F07 0%, #3D2314 50%, #5C3520 100%)' }}>

        {/* BG circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #E6A855, transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C8873A, transparent)', transform: 'translate(-30%, 30%)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-brand/30 bg-amber-brand/10 text-amber-light text-sm font-mono mb-6">
            <Sparkles size={13} />
            Produk Pilihan Terbaik
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-cream-50 mb-4 leading-tight">
            Temukan Produk<br />
            <span className="shimmer-gold">Impian Anda</span>
          </h1>
          <p className="font-body text-cream-200/60 text-lg max-w-xl mx-auto mb-10">
            Koleksi produk berkualitas dengan harga terbaik. Pesan sekarang dan dapatkan pengiriman cepat!
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-espresso-600/40 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl font-body text-espresso-900 placeholder-espresso-600/40 focus:outline-none focus:ring-2 focus:ring-amber-brand/40 shadow-lg"
              style={{ background: 'rgba(254,252,247,0.95)' }}
            />
          </div>
        </div>
      </section>

      {/* Categories & Filter */}
      <section className="sticky top-16 z-30 bg-cream-50/90 backdrop-blur-md border-b border-amber-brand/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-body text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-amber-brand text-cream-50 shadow-sm'
                  : 'bg-cream-100 text-espresso-700 hover:bg-amber-brand/10'
              }`}>
              {cat}
            </button>
          ))}

          <div className="ml-auto flex-shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl font-body text-sm bg-cream-100 text-espresso-800 border border-amber-brand/15 focus:outline-none focus:border-amber-brand cursor-pointer">
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Termurah</option>
                <option value="termahal">Termahal</option>
                <option value="nama">Nama A-Z</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-espresso-600/50 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-cream-100 h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="font-display text-2xl text-espresso-700/50 mb-2">Produk tidak ditemukan</h3>
            <p className="font-body text-espresso-600/40">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="font-body text-sm text-espresso-600/60">
                {filtered.length} produk ditemukan
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                  <ProductCard product={product} onAddToCart={addToCart} onView={setViewProduct} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Product detail modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-espresso-900/60 backdrop-blur-sm" onClick={() => setViewProduct(null)} />
          <div className="relative bg-cream-50 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-10 animate-fade-up">
            <button onClick={() => setViewProduct(null)} className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors">
              <Search size={16} className="rotate-45" />
            </button>
            <div className="h-64 bg-cream-100 rounded-t-3xl overflow-hidden">
              {viewProduct.imageUrl ? (
                <img src={viewProduct.imageUrl} alt={viewProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
              )}
            </div>
            <div className="p-6">
              {viewProduct.category && <span className="text-xs font-mono text-amber-brand uppercase tracking-wider">{viewProduct.category}</span>}
              <h2 className="font-display text-2xl font-bold text-espresso-900 mt-1 mb-2">{viewProduct.name}</h2>
              {viewProduct.description && <p className="font-body text-espresso-700/70 text-sm leading-relaxed mb-4">{viewProduct.description}</p>}
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-espresso-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(viewProduct.price)}
                </span>
                <button onClick={() => { addToCart(viewProduct); setViewProduct(null); }}
                  className="btn-primary">
                  Tambah ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-amber-brand/10 py-10 text-center">
        <div className="font-display text-2xl font-bold text-espresso-800 mb-2">🛍️ MyStore</div>
        <p className="font-body text-sm text-espresso-600/40">© 2024 MyStore · Semua hak dilindungi</p>
      </footer>

      {/* Cart */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />
    </div>
  );
}
