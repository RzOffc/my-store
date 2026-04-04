// pages/owner/settings.js
import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { OwnerNavbar } from './index';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { Save, Loader2, Store, Palette, Link2, BellRing } from 'lucide-react';

export default function OwnerSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({
    storeName: 'MyStore',
    storeDesc: '',
    storeWhatsapp: '',
    storeInstagram: '',
    pakasirApiKey: '',
    pakasirOutletId: '',
    pakasirApiUrl: 'https://api.pakasir.com/v1',
    accentColor: '#C8873A',
    bannerText: 'Produk Pilihan Terbaik',
    enableNotif: true,
  });

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!user.isOwner) router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.isOwner) {
      getDoc(doc(db, 'settings', 'store')).then((snap) => {
        if (snap.exists()) {
          setSettings((s) => ({ ...s, ...snap.data() }));
        }
        setLoadingSettings(false);
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), settings);
      toast.success('Pengaturan berhasil disimpan!');
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) =>
    setSettings((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (loading || !user?.isOwner || loadingSettings) return null;

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-amber-brand/8 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-amber-brand" />
        <h2 className="font-display text-lg font-semibold text-espresso-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <OwnerNavbar active="settings" />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-1">Owner Panel</p>
          <h1 className="font-display text-4xl font-bold text-espresso-900">Pengaturan</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Store Info */}
          <Section icon={Store} title="Informasi Toko">
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Nama Toko</label>
              <input type="text" value={settings.storeName} onChange={set('storeName')} className="input-field" />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Deskripsi Toko</label>
              <textarea value={settings.storeDesc} onChange={set('storeDesc')} rows={2} className="input-field resize-none" placeholder="Deskripsi singkat toko Anda..." />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Teks Banner Hero</label>
              <input type="text" value={settings.bannerText} onChange={set('bannerText')} className="input-field" />
            </div>
          </Section>

          {/* Social */}
          <Section icon={Link2} title="Kontak & Media Sosial">
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">WhatsApp (dengan kode negara)</label>
              <input type="text" value={settings.storeWhatsapp} onChange={set('storeWhatsapp')} placeholder="6281234567890" className="input-field" />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Instagram (tanpa @)</label>
              <input type="text" value={settings.storeInstagram} onChange={set('storeInstagram')} placeholder="username_toko" className="input-field" />
            </div>
          </Section>

          {/* Pakasir */}
          <Section icon={BellRing} title="Integrasi Pakasir POS">
            <div className="p-3 bg-amber-brand/8 rounded-xl border border-amber-brand/15">
              <p className="font-body text-xs text-espresso-700/70">
                Konfigurasi API Pakasir untuk sinkronisasi otomatis pesanan. Dapatkan API Key dari dashboard Pakasir Anda.
              </p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Pakasir API URL</label>
              <input type="url" value={settings.pakasirApiUrl} onChange={set('pakasirApiUrl')} className="input-field" />
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Pakasir API Key</label>
              <input type="password" value={settings.pakasirApiKey} onChange={set('pakasirApiKey')} placeholder="pk_live_xxxxxxxxxxxx" className="input-field" />
              <p className="mt-1 text-xs font-mono text-espresso-600/40">
                Simpan juga ke Vercel Environment Variables sebagai PAKASIR_API_KEY
              </p>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Outlet ID Pakasir</label>
              <input type="text" value={settings.pakasirOutletId} onChange={set('pakasirOutletId')} placeholder="outlet_xxxxxxx" className="input-field" />
            </div>
          </Section>

          {/* Tampilan */}
          <Section icon={Palette} title="Tampilan">
            <div className="flex items-center gap-4">
              <div>
                <label className="font-body text-sm font-medium text-espresso-800 mb-1.5 block">Warna Aksen</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.accentColor} onChange={set('accentColor')}
                    className="w-12 h-10 rounded-xl border border-amber-brand/20 cursor-pointer p-1" />
                  <span className="font-mono text-sm text-espresso-700">{settings.accentColor}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button type="button" onClick={() => setSettings(s => ({ ...s, enableNotif: !s.enableNotif }))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.enableNotif ? 'bg-amber-brand' : 'bg-espresso-200'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${settings.enableNotif ? 'translate-x-5' : ''}`} />
              </button>
              <span className="font-body text-sm text-espresso-800">Aktifkan notifikasi toast saat ada pesanan baru</span>
            </div>
          </Section>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-amber-brand text-cream-50 font-body font-medium rounded-2xl hover:bg-amber-dark transition-all disabled:opacity-60 shadow-lg shadow-amber-brand/25">
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={18} /> Simpan Pengaturan</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
