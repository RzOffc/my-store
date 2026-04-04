# 🛍️ MyStore — Web Store dengan Pakasir Integration

Website toko online siap deploy ke Vercel dengan fitur lengkap:
- ✅ Login Google (Firebase Auth)
- ✅ Tampilan produk yang menarik
- ✅ Sistem auto-order terintegrasi Pakasir POS
- ✅ Dashboard Owner (khusus agungseji@gmail.com)
- ✅ Manajemen produk, harga, media, diskon, stok
- ✅ Manajemen pesanan & update status
- ✅ Responsive (mobile & desktop)

---

## ⚡ Langkah Setup (Ikuti Urutan Ini)

### 1. Setup Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → beri nama → buat project
3. Di sidebar kiri, klik ⚙️ **Project Settings** → tab **General**
4. Scroll ke bawah → **Your apps** → klik ikon Web `</>`
5. Daftarkan app → salin **firebaseConfig** (api key, auth domain, dst)

#### Aktifkan Authentication:
- Sidebar → **Authentication** → **Sign-in method**
- Enable **Google** → simpan

#### Aktifkan Firestore Database:
- Sidebar → **Firestore Database** → **Create database**
- Pilih **Production mode** → pilih region terdekat (asia-southeast1)
- Setelah dibuat, klik tab **Rules** → paste aturan ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: siapa saja yang login bisa baca, hanya owner yang bisa tulis
    match /products/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'agungseji@gmail.com';
    }
    // Orders: user bisa buat & baca milik sendiri, owner bisa semua
    match /orders/{id} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || request.auth.token.email == 'agungseji@gmail.com');
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.token.email == 'agungseji@gmail.com';
    }
    // Settings: hanya owner
    match /settings/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'agungseji@gmail.com';
    }
  }
}
```

#### Aktifkan Storage:
- Sidebar → **Storage** → **Get started**
- Pilih **Production mode** → selesai
- Tab **Rules** → paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == 'agungseji@gmail.com';
    }
  }
}
```

---

### 2. Buat File .env.local

Di folder project, buat file `.env.local` (salin dari `.env.local.example`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nama-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nama-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nama-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

NEXT_PUBLIC_PAKASIR_API_URL=https://api.pakasir.com/v1
NEXT_PUBLIC_PAKASIR_OUTLET_ID=outlet_id_anda
PAKASIR_API_KEY=api_key_dari_pakasir
```

---

### 3. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

### 4. Deploy ke Vercel

#### Cara 1: Via GitHub (Rekomendasi)
1. Push project ini ke GitHub repo
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repo GitHub Anda
4. Di bagian **Environment Variables**, tambahkan semua variabel dari `.env.local`
5. Klik **Deploy**

#### Cara 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
# Ikuti instruksi → tambahkan env variables saat diminta
```

#### Tambahkan Domain Firebase Auth:
Setelah deploy, Anda perlu menambahkan domain Vercel ke Firebase:
1. Firebase Console → Authentication → **Settings** → **Authorized domains**
2. Klik **Add domain** → masukkan domain Vercel Anda (contoh: `my-store.vercel.app`)

---

## 🏗️ Struktur Project

```
store-project/
├── pages/
│   ├── index.js          # Halaman utama (tampilan produk)
│   ├── login.js          # Halaman login Google
│   ├── orders.js         # Riwayat pesanan user
│   ├── 404.js            # Halaman not found
│   └── owner/
│       ├── index.js      # Dashboard owner
│       ├── orders.js     # Manajemen semua pesanan
│       ├── settings.js   # Pengaturan toko & Pakasir
│       └── products/
│           ├── index.js  # Daftar produk
│           └── [id].js   # Form tambah/edit produk
├── components/
│   ├── Navbar.js         # Navigasi utama
│   ├── ProductCard.js    # Kartu produk
│   └── CartSidebar.js    # Keranjang belanja + checkout
├── lib/
│   ├── firebase.js       # Konfigurasi Firebase
│   ├── AuthContext.js    # Context auth
│   ├── products.js       # Firestore helpers
│   └── pakasir.js        # Integrasi Pakasir API
└── styles/
    └── globals.css       # Global styles
```

---

## 🔑 Hak Akses

| Fitur | User Biasa | Owner (agungseji@gmail.com) |
|-------|-----------|----------------------------|
| Lihat produk | ✅ | ✅ |
| Beli / pesan | ✅ | ✅ |
| Lihat pesanan sendiri | ✅ | ✅ |
| Dashboard owner | ❌ | ✅ |
| Tambah/edit/hapus produk | ❌ | ✅ |
| Lihat semua pesanan | ❌ | ✅ |
| Update status pesanan | ❌ | ✅ |
| Pengaturan toko | ❌ | ✅ |

---

## 🔌 Integrasi Pakasir

Saat customer melakukan checkout, sistem secara otomatis:
1. Menyimpan pesanan ke Firestore
2. Mengirim data pesanan ke Pakasir API (endpoint `/transactions`)
3. Sinkronisasi produk ke Pakasir saat produk ditambahkan

Jika API Pakasir tidak tersedia, pesanan tetap tersimpan di Firestore.

Untuk menyesuaikan endpoint Pakasir, edit file `lib/pakasir.js`.

---

## 🎨 Kustomisasi

- **Nama toko**: Owner Dashboard → Pengaturan → Nama Toko
- **Logo/favicon**: Ganti emoji 🛍️ di `Navbar.js` dan `login.js`
- **Warna aksen**: Owner Dashboard → Pengaturan → Warna Aksen
- **Produk**: Owner Dashboard → Produk → Tambah Produk

---

## 📞 Dukungan

Jika ada pertanyaan seputar konfigurasi Firebase atau Pakasir, silakan hubungi developer.
