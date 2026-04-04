// pages/login.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    const { user: u, error } = await signInWithGoogle();
    if (error) {
      toast.error('Login gagal: ' + error);
    } else {
      toast.success('Selamat datang, ' + u.displayName + '!');
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center noise-texture"
      style={{ background: 'linear-gradient(135deg, #1A0F07 0%, #2C1A0E 40%, #3D2314 100%)' }}>

      {/* Decorative circles */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #C8873A, transparent)' }} />
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #E6A855, transparent)' }} />
      
      {/* Floating dots */}
      {[...Array(6)].map((_, i) => (
        <div key={i}
          className="absolute w-2 h-2 rounded-full bg-amber-brand/30 animate-float"
          style={{
            left: `${10 + i * 16}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        />
      ))}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass rounded-3xl p-10 text-center shadow-2xl"
          style={{ background: 'rgba(254,252,247,0.05)', border: '1px solid rgba(200,135,58,0.2)' }}>

          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C8873A, #E6A855)' }}>
              <span className="text-3xl">🛍️</span>
            </div>
            <h1 className="font-display text-4xl font-bold text-cream-50 mb-2">
              Selamat Datang
            </h1>
            <p className="text-cream-200/60 font-body text-sm">
              Masuk untuk melanjutkan belanja
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-amber-brand/20" />
            <span className="text-cream-200/40 text-xs font-mono uppercase tracking-wider">Login</span>
            <div className="flex-1 h-px bg-amber-brand/20" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-body font-medium text-espresso-900 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #FEFCF7, #FDF8EE)' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Masuk dengan Google
          </button>

          <p className="mt-6 text-cream-200/30 text-xs font-body">
            Dengan masuk, Anda menyetujui syarat &amp; ketentuan kami
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-cream-200/25 text-xs font-mono">
          © 2024 Store · Powered by Firebase
        </p>
      </div>
    </div>
  );
}
