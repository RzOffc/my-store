// pages/api/webhook-pakasir.js
// Pakasir akan POST ke URL ini saat pembayaran berhasil
// Set Webhook URL di dashboard Pakasir: https://your-domain.vercel.app/api/webhook-pakasir

import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, order_id, project, status, payment_method, completed_at } = req.body;

    // Validasi project
    if (project !== (process.env.NEXT_PUBLIC_PAKASIR_PROJECT || 'rzoffc')) {
      return res.status(400).json({ error: 'Project tidak valid' });
    }

    if (status !== 'completed') {
      return res.status(200).json({ message: 'Status bukan completed, diabaikan' });
    }

    // Cari order di Firestore berdasarkan pakasirOrderId atau id
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('pakasirOrderId', '==', order_id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Coba cari berdasarkan id langsung
      const q2 = query(ordersRef, where('__name__', '==', order_id));
      const snap2 = await getDocs(q2);
      if (snap2.empty) {
        console.log('Order tidak ditemukan untuk:', order_id);
        return res.status(200).json({ message: 'Order tidak ditemukan' });
      }
    }

    // Update status order ke 'done'
    const orderDoc = snapshot.empty ? null : snapshot.docs[0];
    if (orderDoc) {
      await updateDoc(doc(db, 'orders', orderDoc.id), {
        status: 'done',
        paidAt: completed_at || new Date().toISOString(),
        paymentMethod: payment_method,
        updatedAt: serverTimestamp(),
      });
    }

    return res.status(200).json({ success: true, message: 'Status pesanan diperbarui' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
