// pages/payment/[orderId].js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Navbar from '../../components/Navbar';
import { CheckCircle, Clock, XCircle, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function PaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { orderId } = router.query;

  const [order, setOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrString, setQrString] = useState('');
  const [totalPayment, setTotalPayment] = useState(0);
  const [fee, setFee] = useState(0);
  const [expiredAt, setExpiredAt] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending | completed | expired
  const [loadingQr, setLoadingQr] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [checking, setChecking] = useState(false);
  const checkInterval = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Load order & generate QRIS
  useEffect(() => {
    if (!orderId || !user) return;

    const loadOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) {
          toast.error('Pesanan tidak ditemukan');
          router.replace('/orders');
          return;
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        // Jika sudah ada QRIS data tersimpan di order
        if (orderData.qrString && orderData.paymentStatus !== 'expired') {
          setQrString(orderData.qrString);
          setTotalPayment(orderData.totalPayment || orderData.total);
          setFee(orderData.fee || 0);
          setExpiredAt(new Date(orderData.expiredAt));
          const dataUrl = await QRCode.toDataURL(orderData.qrString, { width: 280, margin: 2 });
          setQrDataUrl(dataUrl);
          setLoadingQr(false);

          if (orderData.status === 'done') {
            setPaymentStatus('completed');
          }
          return;
        }

        // Buat QRIS baru
        const res = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderDoc.id,
            amount: orderData.total,
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        // Generate QR image dari string
        const dataUrl = await QRCode.toDataURL(data.qrString, { width: 280, margin: 2 });
        setQrDataUrl(dataUrl);
        setQrString(data.qrString);
        setTotalPayment(data.totalPayment);
        setFee(data.fee);
        setExpiredAt(new Date(data.expiredAt));

        // Simpan QRIS data ke Firestore
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          qrString: data.qrString,
          totalPayment: data.totalPayment,
          fee: data.fee,
          expiredAt: data.expiredAt,
          pakasirOrderId: data.orderId,
          paymentStatus: 'pending',
        });

        setLoadingQr(false);
      } catch (err) {
        toast.error('Gagal membuat QRIS: ' + err.message);
        setLoadingQr(false);
      }
    };

    loadOrder();
  }, [orderId, user]);

  // Timer countdown
  useEffect(() => {
    if (!expiredAt) return;
    const update = () => {
      const now = new Date();
      const diff = expiredAt - now;
      if (diff <= 0) {
        setTimeLeft('Kadaluarsa');
        setPaymentStatus('expired');
        clearInterval(timerInterval.current);
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    update();
    timerInterval.current = setInterval(update, 1000);
    return () => clearInterval(timerInterval.current);
  }, [expiredAt]);

  // Auto check payment status every 5 seconds
  useEffect(() => {
    if (!orderId || !order || paymentStatus === 'completed' || paymentStatus === 'expired') return;

    const check = async () => {
      try {
        const res = await fetch(`/api/check-payment?orderId=${orderId}&amount=${order.total}`);
        const data = await res.json();
        if (data.success && data.status === 'completed') {
          setPaymentStatus('completed');
          clearInterval(checkInterval.current);
          // Update Firestore
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'done',
            paymentStatus: 'completed',
            paidAt: data.completedAt,
            paymentMethod: data.paymentMethod,
          });
          toast.success('Pembayaran berhasil! 🎉');
        }
      } catch (e) { /* silent */ }
    };

    checkInterval.current = setInterval(check, 5000);
    return () => clearInterval(checkInterval.current);
  }, [orderId, order, paymentStatus]);

  const handleManualCheck = async () => {
    if (!order) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/check-payment?orderId=${orderId}&amount=${order.total}`);
      const data = await res.json();
      if (data.success && data.status === 'completed') {
        setPaymentStatus('completed');
        await updateDoc(doc(db, 'orders', orderId), { status: 'done', paymentStatus: 'completed', paidAt: data.completedAt });
        toast.success('Pembayaran berhasil! 🎉');
      } else {
        toast('Belum ada pembayaran masuk', { icon: '⏳' });
      }
    } catch (e) {
      toast.error('Gagal cek status');
    }
    setChecking(false);
  };

  const copyQrString = () => {
    navigator.clipboard.writeText(qrString).then(() => toast.success('QR string disalin!'));
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-24 pb-16">

        {/* Status: Berhasil */}
        {paymentStatus === 'completed' && (
          <div className="text-center py-12 animate-fade-up">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-espresso-900 mb-2">Pembayaran Berhasil!</h1>
            <p className="font-body text-espresso-600/60 mb-2">Pesanan Anda sedang diproses</p>
            <p className="font-mono text-sm text-amber-brand">#{orderId?.slice(-8).toUpperCase()}</p>
            <div className="mt-8 space-y-3">
              <button onClick={() => router.push('/orders')} className="btn-primary w-full justify-center">
                Lihat Pesanan Saya
              </button>
              <button onClick={() => router.push('/')} className="btn-ghost w-full justify-center">
                Kembali Belanja
              </button>
            </div>
          </div>
        )}

        {/* Status: Loading */}
        {paymentStatus !== 'completed' && loadingQr && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl animate-float"
              style={{ background: 'linear-gradient(135deg, #C8873A, #E6A855)' }}>🛍️</div>
            <p className="font-body text-espresso-600/60">Membuat QRIS...</p>
          </div>
        )}

        {/* Status: Kadaluarsa */}
        {paymentStatus === 'expired' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-espresso-900 mb-2">QRIS Kadaluarsa</h1>
            <p className="font-body text-espresso-600/60 mb-8">Waktu pembayaran telah habis</p>
            <button onClick={() => router.push('/')} className="btn-primary w-full justify-center">
              Pesan Ulang
            </button>
          </div>
        )}

        {/* QRIS Display */}
        {paymentStatus === 'pending' && !loadingQr && qrDataUrl && (
          <div className="animate-fade-up">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="font-mono text-xs text-amber-brand uppercase tracking-wider mb-1">Pembayaran</p>
              <h1 className="font-display text-3xl font-bold text-espresso-900">Scan QRIS</h1>
              <p className="font-body text-espresso-600/60 text-sm mt-1">
                #{orderId?.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* QR Card */}
            <div className="bg-white rounded-3xl border border-amber-brand/10 shadow-lg overflow-hidden mb-5">
              {/* Timer */}
              <div className={`flex items-center justify-center gap-2 py-3 text-sm font-mono font-medium ${
                timeLeft === 'Kadaluarsa' ? 'bg-red-50 text-red-500' : 'bg-amber-brand/8 text-amber-brand'
              }`}>
                <Clock size={14} />
                {timeLeft === 'Kadaluarsa' ? 'Kadaluarsa' : `Berlaku ${timeLeft}`}
              </div>

              {/* QR Image */}
              <div className="p-6 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-espresso-900/8 shadow-sm">
                  <img src={qrDataUrl} alt="QRIS" className="w-56 h-56" />
                </div>
                <p className="mt-4 text-xs font-mono text-espresso-600/40 text-center">
                  Scan dengan aplikasi apapun yang mendukung QRIS
                </p>
              </div>

              {/* Amount */}
              <div className="px-6 pb-6 space-y-2">
                <div className="flex justify-between text-sm font-body text-espresso-700/60">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order?.total || 0)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between text-sm font-body text-espresso-700/60">
                    <span>Biaya admin</span>
                    <span>{formatRupiah(fee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-amber-brand/10">
                  <span className="font-body font-semibold text-espresso-900">Total Bayar</span>
                  <span className="font-display text-xl font-bold text-amber-brand">
                    {formatRupiah(totalPayment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-2 p-3 bg-amber-brand/8 rounded-2xl mb-5 border border-amber-brand/15">
              <AlertTriangle size={16} className="text-amber-brand flex-shrink-0 mt-0.5" />
              <p className="text-xs font-body text-espresso-700/70 leading-relaxed">
                Jangan tutup halaman ini sebelum pembayaran selesai. Status akan diperbarui otomatis.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button onClick={handleManualCheck} disabled={checking}
                className="w-full flex items-center justify-center gap-2 py-4 bg-amber-brand text-cream-50 font-body font-medium rounded-2xl hover:bg-amber-dark transition-all disabled:opacity-60 shadow-lg shadow-amber-brand/25">
                <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                {checking ? 'Mengecek...' : 'Cek Status Pembayaran'}
              </button>

              <button onClick={copyQrString}
                className="w-full flex items-center justify-center gap-2 py-3 border border-amber-brand/25 text-espresso-800 font-body text-sm rounded-2xl hover:bg-amber-brand/8 transition-all">
                <Copy size={14} />
                Salin QR String
              </button>

              <button onClick={() => router.push('/orders')}
                className="w-full text-center text-sm font-body text-espresso-600/50 hover:text-espresso-600 py-2 transition-colors">
                Bayar nanti → Lihat pesanan saya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
