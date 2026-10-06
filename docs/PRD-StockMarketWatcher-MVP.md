# PRD: StockPulse - Real-Time Stock Market Watcher (MVP)

## Product Overview
- **App Name:** StockPulse - Real-Time Stock Market Watcher
- **Tagline:** Dashboard analitik saham real-time yang berjalan tanpa server berbayar.
- **Launch Goal:** Membangun portofolio cloud full stack yang komprehensif sekaligus meluncurkan produk nyata dan fungsional untuk memantau pergerakan harga saham secara efisien.
- **Target Launch:** 1 bulan dari sekarang (Timeline pengembangan intensif).
- **Budget:** 100% Free tier (Zero-cost operation). Menggunakan layanan cloud gratis dari Vercel, Google Cloud Run, dan free-tier database (Supabase/Neon).

## Who It's For
- **Primary User:** Retail investor pemula hingga menengah di Indonesia yang membutuhkan akses cepat ke data pasar dan pergerakan saham secara visual tanpa kompleksitas berlebih.
- **Pain Points:** 
  - Harus membuka banyak tab atau aplikasi berbeda untuk melihat harga saham, grafik, dan berita.
  - Data portofolio dan *watchlist* tidak terorganisir dengan baik.
  - Platform profesional yang ada di pasaran (seperti Bloomberg Terminal atau platform premium lainnya) terlalu mahal untuk retail investor.
- **Needs:** 
  - Dashboard terpusat yang responsif dan intuitif.
  - Grafik interaktif yang mudah dipahami.
  - Notifikasi atau *visual cues* langsung untuk perubahan harga.

## Problem Statement
Saat ini, banyak investor retail kesulitan memantau portofolio mereka secara efisien karena informasi yang terfragmentasi. Data harga, grafik teknikal, dan berita seringkali tersebar di banyak platform yang berbeda. Di sisi lain, platform finansial kelas profesional menawarkan fitur lengkap namun dengan biaya berlangganan yang jauh dari jangkauan investor retail biasa. Hal ini menciptakan kebutuhan akan solusi pemantauan saham yang ringan, real-time, dapat diakses dari mana saja (web-based), namun tetap 100% gratis.

## User Stories
1. **As a** retail investor, **I want to** view a main dashboard with a market summary **so that** I can quickly understand the overall market condition at a glance.
2. **As a** user, **I want to** search for specific stock tickers **so that** I can find companies I am interested in monitoring.
3. **As a** user, **I want to** add and remove stock tickers to my personal watchlist **so that** I can track my preferred stocks easily without searching for them every time.
4. **As a** user, **I want to** see interactive historical price charts (1D, 1W, 1M, 3M, 1Y) **so that** I can analyze the stock's performance over different time horizons.
5. **As a** user, **I want to** see price cards with real-time updates indicated by colors (green for up, red for down) **so that** I immediately know if a stock is gaining or losing value.
6. **As a** user, **I want to** have the data auto-refresh periodically **so that** I don't have to manually reload the page to get the latest prices.
7. **As a** mobile user, **I want to** access the dashboard comfortably on my smartphone **so that** I can check my stocks while on the go.
8. **As a** user, **I want to** know that historical data is cached and loads instantly **so that** I don't experience lag when opening the application.
9. **As a** registered user, **I want to** log in with my Google account **so that** my watchlist is saved and synced across devices. (Should-have)
10. **As a** user, **I want to** toggle between dark mode and light mode **so that** I can view the dashboard comfortably regardless of my environment's lighting. (Should-have)

## Core MVP Features (Must-Have)
1. **Dashboard Utama dengan Ringkasan Pasar:** Menampilkan indeks utama (misal: S&P 500, NASDAQ, IHSG jika didukung) dan rangkuman sentimen pasar.
2. **Search & Add Ticker ke Watchlist:** Fitur pencarian auto-complete untuk mencari simbol ticker saham dan menyimpannya ke dalam *watchlist* lokal (localStorage) atau database.
3. **Grafik Harga Historis Interaktif:** Menggunakan Recharts untuk menampilkan grafik (1D, 1W, 1M, 3M, 1Y) dengan tooltips saat di-hover.
4. **Price Cards (Real-time Visuals):** Kartu untuk setiap saham di *watchlist* yang menampilkan harga saat ini, persentase perubahan, dan indikator warna dinamis (hijau/merah).
5. **Auto-refresh Data Berkala:** Mekanisme polling atau SSE (Server-Sent Events) ringan ke backend untuk memperbarui harga secara berkala (misal: tiap 1-5 menit) selama jam buka pasar.
6. **Responsive Design (Mobile-first):** UI yang dirancang menggunakan Tailwind CSS agar terlihat rapi dan berfungsi penuh di ukuran layar smartphone.
7. **Penyimpanan Data Historis:** Menyimpan (caching) data historis di database (Supabase/Neon) untuk mengurangi *API calls* ke Yahoo Finance dan mempercepat response time.

## Should-Have Features
1. **OAuth Google Login:** Integrasi autentikasi dasar untuk menyimpan konfigurasi *watchlist* secara persisten per user di database.
2. **Simple Price Alert (Threshold Notification):** Notifikasi in-app (toast/UI alert) jika harga saham melewati batas persentase tertentu.
3. **Dark/Light Mode Toggle:** Pilihan tema antarmuka sesuai preferensi pengguna.
4. **Export Data ke CSV:** Kemampuan untuk mengunduh data *watchlist* atau riwayat harga ke format CSV untuk analisis di Excel.

## Could-Have Features (v2)
1. **Crypto Market Support:** Penambahan data dari CoinGecko API untuk memantau aset kripto.
2. **Portfolio Tracker dengan P&L Calculation:** Pengguna dapat memasukkan harga beli dan jumlah lembar saham untuk menghitung Profit & Loss secara otomatis.
3. **News Aggregator per Ticker:** Menarik berita keuangan terbaru terkait saham yang ada di *watchlist*.
4. **Technical Indicators:** Overlay indikator seperti RSI, MACD, atau Bollinger Bands di atas grafik harga.
5. **Social Sharing:** Fitur untuk membagikan performa *watchlist* atau chart ke media sosial.
6. **Push Notifications:** Notifikasi via email atau web push saat kondisi *price alert* terpenuhi.

## Won't Have (This Release)
1. **Trading Execution:** Tidak akan ada integrasi dengan broker untuk melakukan eksekusi beli/jual secara langsung.
2. **Payment/Subscription Model:** Aplikasi akan tetap gratis sepenuhnya untuk versi MVP ini.
3. **Advanced Algorithmic Analysis:** Analisis kuantitatif mendalam atau prediksi menggunakan AI tidak disertakan.
4. **Mobile Native App:** Tidak ada rencana membuat aplikasi iOS (Swift) atau Android (Kotlin); fokus pada Progressive Web App (PWA) / web responsif.

## Success Metrics
- **Activation:** User baru berhasil menambahkan 3+ ticker ke dalam *watchlist* pada 5 menit pertama penggunaan.
- **Engagement:** Pengguna aktif melakukan 3+ kunjungan per minggu ke dashboard.
- **Data Freshness:** Data harga berhasil diperbarui setiap 1-5 menit secara konsisten saat pasar sedang buka.
- **Performance:** 
  - Waktu muat halaman (Page load) < 2 detik.
  - Respons backend API < 500ms (setelah *cold start*).
- **Reliability:** Mencapai 99% uptime tanpa kegagalan sistem yang fatal.

## Technical Constraints
- **100% Free Tier Stack:** Semua infrastruktur harus menggunakan kuota gratis (Vercel Hobby, GCP Free Tier, Supabase/Neon Free Tier).
- **Yahoo Finance API Rate Limits:** Harus mengimplementasikan strategi *caching* dan *batch request* di backend Python untuk menghindari blokir dari *yfinance*.
- **Google Cloud Run Cold Start:** Harus mempertimbangkan waktu tunda saat instance backend pertama kali bangun, mungkin dengan teknik *keep-alive* sederhana atau loading state yang baik di frontend.
- **Vercel Serverless Timeout (10s Hobby):** Frontend API Routes (jika ada) tidak boleh mengeksekusi operasi panjang. Semua *heavy lifting* dilakukan di Python backend.

## UI/UX Requirements
- **Design System:** Menggunakan `shadcn/ui` untuk komponen dasar dan `Magic UI` untuk elemen visual yang lebih menarik.
- **Color Palette:** *Dark mode default* yang memberikan estetika dashboard finansial profesional (didominasi warna gelap, neon hijau/merah).
- **Typography:** Menggunakan *font family* Inter atau Geist untuk keterbacaan data numerik yang optimal.
- **Charts:** Menggunakan `Recharts` dengan animasi transisi yang mulus (*smooth animations*) saat pergantian rentang waktu (1D ke 1W, dst).
- **Mobile Responsive:** Navigasi bawah (*bottom navigation bar*) untuk versi *mobile* agar mudah dijangkau oleh jempol.
- **Accessibility:** Memenuhi standar WCAG 2.1 AA (kontras warna teks memadai, dukungan navigasi keyboard).

## Non-Functional Requirements
- **Performance Targets:** UI tidak boleh *freeze* saat melakukan polling data; gunakan *Optimistic UI* atau *Skeleton loaders* saat memuat grafik.
- **Security Requirements:** Implementasi CORS di backend FastAPI agar hanya menerima request dari domain frontend Vercel. Perlindungan dasar terhadap injeksi jika menggunakan input *search*.
- **Scalability Considerations:** Desain skema database yang efisien agar pembacaan *cached price* cepat meskipun jumlah pengguna bertambah dalam batas free tier.
- **Data Privacy:** Jika menggunakan login, hanya simpan data minimal (Email, Google ID). Pastikan *watchlist* tidak bocor ke user lain.

## Open Questions & Risks
- **Risk:** Yahoo Finance API (melalui `yfinance`) sering mengubah struktur HTML/API internal yang dapat merusak *scraping* atau pengambilan data tiba-tiba.
  - *Mitigation:* Buat mekanisme *fallback* atau error handling yang informatif di UI jika backend gagal mengambil harga terbaru.
- **Decision:** Apakah sebaiknya menggunakan Supabase (PostgreSQL + Auth terintegrasi) atau Neon (PostgreSQL serverless dengan Drizzle ORM)?
  - *Pending Action:* Lakukan komparasi performa *cold start* antara keduanya untuk menentukan backend DB utama.
- **Question:** Bagaimana cara terbaik memperbarui data *real-time*? Polling frontend ke backend, atau WebSockets dari GCP Cloud Run?
  - *Consideration:* WebSockets di Cloud Run mungkin meningkatkan cost / mengurangi idle time, polling (SWR/React Query) tiap 1 menit mungkin lebih aman untuk free tier.

## Out of Scope (Not in MVP)
Bagian-bagian yang secara tegas **tidak** dikerjakan selama masa pengembangan MVP (Bulan 1):
- Pembuatan sistem pendaftaran (sign up) dengan email/password biasa (hanya OAuth).
- Fitur forum atau chat antar pengguna.
- Integrasi data Fundamental (Laporan Keuangan, EPS, P/E Ratio, dsb.) secara detail (hanya harga dan *chart* di MVP).
- Dukungan Multi-bahasa (i18n).

## Handoff Context
Bagian ini disediakan untuk AI/Developer di fase implementasi selanjutnya.
- **Frontend Stack:** Next.js App Router (React 18+), Tailwind CSS, TypeScript, `shadcn/ui`, Recharts, SWR/TanStack Query untuk *data fetching*.
- **Backend Stack:** Python 3.10+, FastAPI (Asynchronous), `yfinance` library, SQLAlchemy/SQLModel (jika pakai DB relasional).
- **Deployment:** 
  - Frontend: Vercel (Hobby)
  - Backend: Dockerized FastAPI -> Google Artifact Registry -> Google Cloud Run.
  - Database: TBD (Supabase/Neon).
- **Next Step Action:** Inisialisasi repositori Git, *setup* kerangka proyek Next.js dengan shadcn/ui, dan *setup* lingkungan virtual Python untuk backend FastAPI.
