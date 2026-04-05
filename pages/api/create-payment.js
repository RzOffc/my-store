// pages/api/create-payment.js
// Server-side API route - API key aman tidak terekspos ke browser

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId dan amount wajib diisi' });
  }

  try {
    const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: process.env.NEXT_PUBLIC_PAKASIR_PROJECT || 'rzoffc',
        order_id: orderId,
        amount: Math.round(amount),
        api_key: process.env.PAKASIR_API_KEY,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.payment) {
      return res.status(400).json({ error: data.message || 'Gagal membuat QRIS' });
    }

    return res.status(200).json({
      success: true,
      qrString: data.payment.payment_number,
      totalPayment: data.payment.total_payment,
      fee: data.payment.fee,
      expiredAt: data.payment.expired_at,
      orderId: data.payment.order_id,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
