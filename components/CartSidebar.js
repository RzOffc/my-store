// components/CartSidebar.js
import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { createPakasirOrder } from '../lib/pakasir';
import { saveOrder } from '../lib/products';
import toast from 'react-hot-toast';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function CartSidebar({ open, onClose, cart, setCart }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => {
    const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
    return sum + price * item.qty;
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      toast.error('Masukkan nama Anda terlebih dahulu');
      return;
    }

    setLoading(true);

    const orderData = {
      customer: {
        name: customerName,
        email: user?.email || '',
        phone: customerPhone,
      },
      items: cart.map((item) => ({
        productId: item.id,
        pakasirProductId: item.pakasirProductId,
        name: item.name,
        price: item.discount > 0 ? Math.round(item.price * (1 - item.discount / 100)) : item.price,
        qty: item.qty,
      })),
      note,
      total,
      userId: user?.uid,
    };

    try {
      // Save to Firestore
      const { id: orderId } = await saveOrder(orderData);

      // Send to Pakasir
      const pakasirRes = await createPakasirOrder({ ...orderData, orderId });

      if (pakasirRes.success) {
        toast.success('Pesanan berhasil dibuat! #' + (pakasirRes.orderId || orderId));
      } else {
        // Still success on our end, Pakasir optional
        toast.success('Pesanan berhasil disimpan! Tim kami akan segera memproses.');
        console.warn('Pakasir sync issue:', pakasirRes.error);
      }

      setCart([]);
      setNote('');
      onClose();
    } catch (err) {
      toast.error('Gagal memproses pesanan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-espresso-900/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-cream-50 z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-brand/10">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-amber-brand" />
            <h2 className="font-display text-xl font-bold text-espresso-900">
              Keranjang
            </h2>
            {cart.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-brand/15 text-amber-brand text-xs font-mono rounded-full">
                {cart.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-amber-brand/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <span className="text-6xl mb-4">🛒</span>
              <p className="font-display text-xl text-espresso-700/50">Keranjang kosong</p>
              <p className="font-body text-sm text-espresso-600/40 mt-1">Tambahkan produk untuk mulai belanja</p>
            </div>
          ) : (
            cart.map((item) => {
              const price = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
              return (
                <div key={item.id} className="flex gap-4 p-4 bg-cream-100 rounded-2xl border border-amber-brand/8">
                  <div className="w-16 h-16 rounded-xl bg-cream-200 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : '🛍️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-body font-medium text-espresso-900 text-sm truncate">{item.name}</h4>
                    <p className="font-display text-amber-brand font-bold text-sm mt-0.5">{formatRupiah(price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-amber-brand/10 hover:bg-amber-brand/20 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="font-mono text-sm w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-amber-brand/10 hover:bg-amber-brand/20 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout form + total */}
        {cart.length > 0 && (
          <div className="border-t border-amber-brand/10 px-6 py-5 space-y-4 bg-cream-50">
            {/* Customer info */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Anda *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="tel"
                placeholder="Nomor HP (opsional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input-field text-sm"
              />
              <textarea
                placeholder="Catatan pesanan (opsional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="input-field text-sm resize-none"
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-amber-brand/10">
              <span className="font-body text-sm text-espresso-700/70">Total</span>
              <span className="font-display text-xl font-bold text-espresso-900">{formatRupiah(total)}</span>
            </div>

            {/* CTA */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-amber-brand text-cream-50 font-body font-medium rounded-2xl hover:bg-amber-dark transition-all duration-200 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-brand/25">
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Memproses...</>
              ) : (
                <><ShoppingBag size={18} /> Pesan Sekarang</>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
