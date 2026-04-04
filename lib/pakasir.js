// lib/pakasir.js
// Pakasir POS Integration
// Docs: https://pakasir.com/api (sesuaikan endpoint dengan API Pakasir Anda)

const PAKASIR_API_URL = process.env.NEXT_PUBLIC_PAKASIR_API_URL || 'https://api.pakasir.com/v1';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

/**
 * Buat transaksi baru di Pakasir
 * @param {Object} orderData - Data pesanan
 * @param {Array} orderData.items - Item yang dipesan [{productId, name, price, qty}]
 * @param {Object} orderData.customer - Data pelanggan {name, email, phone}
 * @param {string} orderData.note - Catatan order
 */
export const createPakasirOrder = async (orderData) => {
  try {
    const payload = {
      outlet_id: process.env.NEXT_PUBLIC_PAKASIR_OUTLET_ID,
      customer_name: orderData.customer?.name || 'Customer',
      customer_email: orderData.customer?.email || '',
      customer_phone: orderData.customer?.phone || '',
      note: orderData.note || '',
      items: orderData.items.map((item) => ({
        product_id: item.pakasirProductId || item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty,
      })),
      total: orderData.items.reduce((sum, item) => sum + item.price * item.qty, 0),
      payment_method: orderData.paymentMethod || 'cash',
      source: 'webstore',
    };

    const response = await fetch(`${PAKASIR_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAKASIR_API_KEY}`,
        'X-Outlet-ID': process.env.NEXT_PUBLIC_PAKASIR_OUTLET_ID,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal membuat order di Pakasir');
    }

    const data = await response.json();
    return { success: true, data, orderId: data.id || data.transaction_id };
  } catch (error) {
    console.error('Pakasir order error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ambil daftar produk dari Pakasir
 */
export const getPakasirProducts = async () => {
  try {
    const response = await fetch(`${PAKASIR_API_URL}/products?outlet_id=${process.env.NEXT_PUBLIC_PAKASIR_OUTLET_ID}`, {
      headers: {
        Authorization: `Bearer ${PAKASIR_API_KEY}`,
      },
    });
    const data = await response.json();
    return { success: true, products: data.data || [] };
  } catch (error) {
    return { success: false, products: [], error: error.message };
  }
};

/**
 * Sync produk ke Pakasir
 */
export const syncProductToPakasir = async (product) => {
  try {
    const payload = {
      outlet_id: process.env.NEXT_PUBLIC_PAKASIR_OUTLET_ID,
      name: product.name,
      price: product.price,
      sku: product.id,
      category: product.category || 'Umum',
      stock: product.stock || 999,
    };

    const response = await fetch(`${PAKASIR_API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAKASIR_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return { success: true, pakasirId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
