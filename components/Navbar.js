// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { logOut } from '../lib/firebase';
import toast from 'react-hot-toast';
import { ShoppingCart, LogOut, Settings, Menu, X, User } from 'lucide-react';
import Image from 'next/image';

export default function Navbar({ cartCount = 0, onCartOpen }) {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    toast.success('Sampai jumpa!');
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-amber-brand/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #C8873A, #E6A855)' }}>
            🛍️
          </div>
          <span className="font-display text-xl font-bold text-espresso-900 hidden sm:block">
            MyStore
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={`font-body text-sm font-medium transition-colors hover:text-amber-brand ${router.pathname === '/' ? 'text-amber-brand' : 'text-espresso-700'}`}>
            Produk
          </Link>
          <Link href="/orders" className={`font-body text-sm font-medium transition-colors hover:text-amber-brand ${router.pathname === '/orders' ? 'text-amber-brand' : 'text-espresso-700'}`}>
            Pesanan Saya
          </Link>
          {user?.isOwner && (
            <Link href="/owner" className={`font-body text-sm font-medium transition-colors hover:text-amber-brand flex items-center gap-1 ${router.pathname.startsWith('/owner') ? 'text-amber-brand' : 'text-espresso-700'}`}>
              <Settings size={14} />
              Dashboard Owner
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <button
            onClick={onCartOpen}
            className="relative p-2.5 rounded-xl hover:bg-amber-brand/10 transition-colors text-espresso-800">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="cart-badge absolute -top-1 -right-1 w-5 h-5 bg-amber-brand text-cream-50 text-xs font-mono font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-amber-brand/10 transition-colors">
                {user.photo ? (
                  <Image src={user.photo} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-brand/20 flex items-center justify-center">
                    <User size={16} className="text-amber-brand" />
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-cream-50 border border-amber-brand/15 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-amber-brand/10">
                    <p className="font-body font-medium text-espresso-900 text-sm truncate">{user.name}</p>
                    <p className="font-body text-espresso-600/60 text-xs truncate">{user.email}</p>
                    {user.isOwner && (
                      <span className="mt-1 inline-flex text-xs px-2 py-0.5 bg-amber-brand/15 text-amber-brand rounded-full font-mono">Owner</span>
                    )}
                  </div>
                  <div className="py-1.5">
                    {user.isOwner && (
                      <Link href="/owner" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-espresso-800 hover:bg-amber-brand/8 transition-colors">
                        <Settings size={15} className="text-amber-brand" />
                        Dashboard Owner
                      </Link>
                    )}
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-body text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl hover:bg-amber-brand/10">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-amber-brand/10 bg-cream-50 px-4 py-4 space-y-2 animate-fade-in">
          <Link href="/" className="block px-3 py-2.5 rounded-xl font-body text-sm font-medium hover:bg-amber-brand/10 text-espresso-800" onClick={() => setMobileOpen(false)}>
            Produk
          </Link>
          <Link href="/orders" className="block px-3 py-2.5 rounded-xl font-body text-sm font-medium hover:bg-amber-brand/10 text-espresso-800" onClick={() => setMobileOpen(false)}>
            Pesanan Saya
          </Link>
          {user?.isOwner && (
            <Link href="/owner" className="block px-3 py-2.5 rounded-xl font-body text-sm font-medium hover:bg-amber-brand/10 text-amber-brand" onClick={() => setMobileOpen(false)}>
              Dashboard Owner
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
