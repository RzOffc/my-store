// pages/owner/products/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/AuthContext';
import { addProduct, updateProduct, getProducts } from '../../../lib/products';
import { syncProductToPakasir } from '../../../lib/pakasir';
import { OwnerNavbar } from '../index';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, X, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['Makanan', 'Minuman', 'Pakaian', 'Elektronik', 'Kecantikan', 'Aksesoris', 'Rumah Tangga', 'Lainnya'];

export default function ProductFormPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '',
    discount: 0, stock: '', isNew: false, rating: 5, reviews: 0,
    imageUrl: '', pakasirProductId: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!user.isOwner) router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isNew && id && user?.isOwner) {
      getProducts().then((products) => {
        const product = products.find((p) => p.id === id);
        if (product) {
          setForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            category: product.category || '',
            discount: product.discount || 0,
            stock: product.stock !== undefined ? product.stock : '',
            isNew: product.isNew || false,
            rating: product.rating || 5,
            reviews: product.reviews || 0,
            imageUrl: product.imageUrl || '',
            pakasirProductId: product.pakasirProductId || '',
          });
          if (product.imageUrl) setImagePreview(product.imageUrl);
        } else {
          toast.error('Produk tidak ditemukan');
          router.replace('/owner/products');
        }
        setLoadingData(false);
      });
    }
  }, [id, isNew, user]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nama produk wajib diisi');
    if (!form.price || isNaN(Number(form.price))) return toast.error('Harga tidak valid');

    setSaving(true);
    try {
      const productData = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount) || 0,
        stock: form.stock !== '' ? Number(form.stock) : undefined,
        rating: Number(form.rating) || 5,
        reviews: Number(form.reviews) || 0,
      };

      let result;
      if (isNew) {
        result = await addProduct(productData, imageFile);
      } else {
        result = await updateProduct(id, productData, imageFile);
      }

      if (result.success) {
        // Sync to Pakasir
        if (!productData.pakasirProductId) {
          const pakasirResult = await syncProductToPakasir({
            ...productData,
            id: result.id || id,
          });
          if (pakasirResult.success && result.id) {
            await updateProduct(result.id || id, { ...productData, pakasirProductId: pakasirResult.pakasirId }, null);
          }
        }
        toast.success(isNew ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diperbarui!');
        router.push('/owner/products');
      } else {
        toast.error('Gagal menyimpan: ' + result.error);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (loading || !user?.isOwner || loadingData) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <OwnerNavbar active="products" />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/owner/products"
            className="p-2.5 rounded-xl border border-amber-brand/20 hover:bg-amber-brand/10 transition-colors text-espresso-700">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-0.5">
              {isNew ? 'Tambah' : 'Edit'}
            </p>
            <h1 className="font-display text-3xl font-bold text-espresso-900">
              {isNew ? 'Produk Baru' : form.name || 'Edit Produk'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6">
            <h2 className="font-display text-lg font-semibold text-espresso-900 mb-4">Gambar Produk</h2>
            <div className="flex items-start gap-5">
              {/* Preview */}
              <div className="w-32 h-32 rounded-2xl bg-cream-100 overflow-hidden flex-shrink-0 border border-amber-brand/10">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <span className="text-3xl">🖼️</span>
                    <span className="text-xs font-mono text-espresso-600/30">No image</span>
                  </div>
                )}
              </div>

              {/* Upload */}
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-brand/25 rounded-2xl cursor-pointer hover:border-amber-brand/50 hover:bg-amber-brand/5 transition-all group">
                  <Upload size={20} className="text-amber-brand/50 group-hover:text-amber-brand mb-2 transition-colors" />
                  <span className="font-body text-sm text-espresso-700/60 group-hover:text-espresso-700">
                    Klik untuk upload gambar
                  </span>
                  <span className="font-mono text-xs text-espresso-600/30 mt-1">JPG, PNG, WebP — Maks 5MB</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setForm(f => ({ ...f, imageUrl: '' })); }}
                    className="mt-2 flex items-center gap-1.5 text-xs font-body text-red-400 hover:text-red-600 transition-colors">
                    <X size={12} />
                    Hapus gambar
                  </button>
                )}
                <p className="mt-2 text-xs font-mono text-espresso-600/40">Atau tempel URL gambar:</p>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => {
                    set('imageUrl')(e);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="input-field text-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Info Dasar */}
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-espresso-900">Informasi Produk</h2>

            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Nama Produk *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Masukkan nama produk" className="input-field" required />
            </div>

            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Deskripsi</label>
              <textarea value={form.description} onChange={set('description')} placeholder="Deskripsi singkat produk..." rows={3} className="input-field resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Kategori</label>
                <select value={form.category} onChange={set('category')} className="input-field">
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Stok</label>
                <input type="number" value={form.stock} onChange={set('stock')} placeholder="Kosongkan = ∞" min="0" className="input-field" />
              </div>
            </div>
          </div>

          {/* Harga */}
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-espresso-900">Harga & Diskon</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Harga (Rp) *</label>
                <input type="number" value={form.price} onChange={set('price')} placeholder="0" min="0" className="input-field" required />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Diskon (%)</label>
                <input type="number" value={form.discount} onChange={set('discount')} placeholder="0" min="0" max="100" className="input-field" />
              </div>
            </div>
            {form.price && form.discount > 0 && (
              <div className="p-3 bg-amber-brand/8 rounded-xl flex items-center justify-between">
                <span className="font-body text-sm text-espresso-700">Harga setelah diskon:</span>
                <span className="font-display font-bold text-amber-brand">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
                    .format(Number(form.price) * (1 - Number(form.discount) / 100))}
                </span>
              </div>
            )}
          </div>

          {/* Extra */}
          <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-espresso-900">Pengaturan Lainnya</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isNew: !f.isNew }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isNew ? 'bg-amber-brand' : 'bg-espresso-200'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.isNew ? 'translate-x-5' : ''}`} />
              </button>
              <span className="font-body text-sm text-espresso-800">Tandai sebagai produk baru</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Rating (1-5)</label>
                <input type="number" value={form.rating} onChange={set('rating')} min="1" max="5" className="input-field" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Jumlah Ulasan</label>
                <input type="number" value={form.reviews} onChange={set('reviews')} min="0" className="input-field" />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">ID Produk Pakasir (opsional)</label>
              <input type="text" value={form.pakasirProductId} onChange={set('pakasirProductId')} placeholder="Auto-sync jika dikosongkan" className="input-field" />
              <p className="mt-1 text-xs font-mono text-espresso-600/40">Produk akan otomatis disinkronkan ke Pakasir saat disimpan</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-amber-brand text-cream-50 font-body font-medium rounded-2xl hover:bg-amber-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-brand/25">
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={18} /> {isNew ? 'Tambah Produk' : 'Simpan Perubahan'}</>
              )}
            </button>
            <Link href="/owner/products" className="btn-ghost py-4">
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
