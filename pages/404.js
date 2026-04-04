// pages/404.js
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-mono text-8xl font-bold text-amber-brand/20 mb-4">404</p>
        <h1 className="font-display text-3xl font-bold text-espresso-900 mb-2">Halaman tidak ditemukan</h1>
        <p className="font-body text-espresso-600/60 mb-8">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
        <Link href="/" className="btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
