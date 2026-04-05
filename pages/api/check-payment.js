// pages/api/check-payment.js
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, amount } = req.query;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId dan amount wajib diisi' });
  }

  try {
    const url = `https://app.pakasir.com/api/transactiondetail?project=${process.env.NEXT_PUBLIC_PAKASIR_PROJECT || 'rzoffc'}&amount=${amount}&order_id=${orderId}&api_key=${process.env.PAKASIR_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.transaction) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      status: data.transaction.status,
      paymentMethod: data.transaction.payment_method,
      completedAt: data.transaction.completed_at,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
