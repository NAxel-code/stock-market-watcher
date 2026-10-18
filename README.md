# 📈 StockPulse — Real-Time Stock Market Watcher

> **StockPulse** adalah platform analitik dan pemantau pasar saham real-time untuk bursa Amerika Serikat (US) dan Indonesia (IDX / BEI). Dibangun dengan arsitektur modern berdensitas tinggi, stack serverless gratis (*100% free tier*), visualisasi performa ala CoinGecko/TradingView, serta kalkulator mekanika bursa BEI.

---

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016%20(Turbopack)-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Styling](https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Vitest-57%20Passed%20(100%25)-green?logo=vitest)](https://vitest.dev)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Cloud%20Run-blue?logo=vercel)](https://vercel.com)
[![AI-Assisted](https://img.shields.io/badge/Development-AI--Assisted-8A2BE2)](#-ai-assisted-development)

---

## 📸 Bukti Tampilan Terbaru & Fitur Unggulan

Berikut adalah bukti tangkapan layar langsung (*live screenshot captures*) dari antarmuka StockPulse terbaru:

### 1. 🌟 Interactive Spotlight Tour (Langkah 1 & 2)
Panduan interaktif visual langsung di atas elemen DOM aktif dengan *luminous spotlight ring* (`ring-2 ring-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.45)]`), *backdrop* gelap, kartu tooltip mengambang, serta navigasi keyboard lengkap (<kbd>Esc</kbd>, <kbd>→</kbd>, <kbd>←</kbd>).

| Langkah 1: Pita Status Bursa Real-Time | Langkah 2: Command Palette Ticker Search |
| :---: | :---: |
| ![Spotlight Tour - Step 1](./docs/screenshots/spotlight-tour.png) | ![Spotlight Tour - Step 2](./docs/screenshots/spotlight-tour-step2.png) |

---

### 2. 📊 Detail Saham, Mekanika BEI, & Kinerja Multi-Horizon
Halaman analitik lengkap untuk emiten (contoh: `BBCA.JK` - Bank Central Asia), menampilkan batas Auto Rejection (ARA/ARB), bar rentang 52 minggu, kalkulator lot BEI, dan matriks imbal hasil multi-periode.

![Stock Detail Full](./docs/screenshots/stock-detail-full.png)

---

### 3. 🧭 Modal Panduan & Cheat Sheet Ticker Populer
Modal terintegrasi dengan 2 tab: tur panduan fitur 4-langkah dan *cheat sheet* emiten favorit US & BEI dengan tombol salin ticker 1-klik.

![Tutorial Modal](./docs/screenshots/tutorial-modal.png)

---

### 4. 🔍 Pencarian Cepat Command Palette (<kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd>)
Pencarian instan dengan navigasi keyboard, *autocomplete*, badge bursa, dan deteksi otomatis saham US vs IDX (.JK).

![Command Palette](./docs/screenshots/command-palette.png)

---

## ⚡ Fitur Utama

### 🌟 1. Onboarding & Interactive Spotlight Tour
- **5-Step Live Element Spotlight**: Menyorot elemen nyata secara dinamis (`getBoundingClientRect()`) dengan transisi *smooth scroll*:
  1. `tour-market-status`: Jam perdagangan BEI (09:00 - 16:00 WIB) & Wall Street US (21:30 - 04:00 WIB).
  2. `tour-search-command`: Shortcut <kbd>Cmd+K</kbd> / <kbd>Ctrl+K</kbd> dan format suffix `.JK`.
  3. `tour-market-summary`: 4 indeks pasar utama (S&P 500, Nasdaq, Dow Jones, IHSG) & mini sparklines.
  4. `tour-sector-filter`: Filter instan bursa (US / IDX) dan sektor industri.
  5. `tour-stock-grid`: Kartu saham real-time, link grafik Recharts, kalkulator lot, dan alert harga.
- **Onboarding Banner Beranda**: Sambutan pengguna baru yang dapat ditutup (*dismissible*) dengan penyimpanan persisten di `localStorage`.
- **Aksesibilitas Penuh**: Navigasi keyboard (<kbd>Esc</kbd> untuk keluar, panah kiri/kanan untuk berpindah).

### 🇮🇩 2. Mekanika Khusus Pasar Indonesia (Bursa Efek Indonesia / IDX)
- **Kalkulator Lot BEI**: Simulasi transaksi saham presisi standar 1 lot = 100 lembar saham dengan opsi Beli/Jual, chip cepat (1, 5, 10, 50, 100 lot), estimasi fee broker (0.15%), levy bursa, dan PPh final.
- **Batas Auto Rejection Simetris (ARA & ARB)**: Kalkulasi batas kenaikan tertinggi (*Auto Rejection Atas*) dan penurunan terendah (*Auto Rejection Bawah*) berdasarkan fraksi harga resmi BEI.
- **Format Ticker Terstandarisasi**: Dukungan mulus suffix `.JK` untuk semua emiten BEI (misal: `BBCA.JK`, `BBRI.JK`, `TLKM.JK`).

### 📈 3. Analitik Finansial Bergaya CoinGecko & TradingView
- **7-Day Sparkline SVG**: Mini chart kurva Bezier kubik dengan gradien dinamis hijau/merah pada setiap kartu saham.
- **Kinerja Multi-Horizon**: Tabel persentase imbal hasil terukur lintas horizon waktu: **1D (24 Jam)**, **1W (7 Hari)**, **1M (30 Hari)**, **1Y (1 Tahun)**, dan **YTD**.
- **52-Week Range Bar**: Bar visual posisi harga terkini terhadap titik terendah dan tertinggi 52 minggu, dilengkapi persentase penurunan dari rekor harga tertinggi (*drawdown from peak*).

### 🎯 4. Presisi Format Poin Indeks vs Mata Uang Ganda
- **Poin Indeks Pasar**: Indeks global (`^GSPC`, `^IXIC`, `^DJI`) dan IHSG (`^JKSE`) diformat akurat dalam satuan poin (`pts`), bukan simbol uang.
- **Dukungan Mata Uang Ganda**: Format cerdas USD (`$`) untuk saham Wall Street dan Rupiah integer tanpa desimal janggal (`Rp`) untuk saham Indonesia.

### 🏷️ 5. Filter Sektor & 32 Saham Unggulan Bluechip
- Filter cepat berdasarkan bursa (**Semua**, **US**, **IDX**) atau sektor industri (**Technology**, **Financial Services**, **Energy**, **Consumer Cyclical**, **Healthcare**).
- Katalog pantauan pre-seeded berisi 32 saham berkapitalisasi pasar terbesar dan teraktif.

### ⏱️ 6. Smart Polling & Resilient Caching
- **Polling Cerdas**: Frekuensi pembaruan otomatis 1 menit saat bursa buka dan diperlambat ke 15 menit di luar jam operasional.
- **Cache Fallback & Circuit Breaker**: Menggunakan cache TTL di backend untuk menjamin ketersediaan data saat Yahoo Finance mengalami rate limit.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi | Deskripsi |
|---|---|---|
| **Frontend Framework** | **Next.js 16.3.8 (App Router)** | Framework React fullstack dengan bundler Turbopack super cepat |
| **UI Library** | **React 19** & **Tailwind CSS v4** | Komponen modern dengan styling utility-first dan token terminal zinc-950 |
| **Primitives & Icons** | **Radix UI**, **CMDK**, **Lucide React** | Dialog, dropdown, accessible command palette, dan icon set presisi |
| **State Management** | **TanStack Query v5** & **Zustand v5** | Sinkronisasi server-state otomatis dan client store persisten |
| **Chart Engine** | **Recharts** & **Custom SVG Bezier** | Grafik interaktif multi-periode (1D/1W/1M/3M/1Y) + mini sparklines |
| **Backend API** | **FastAPI (Python 3.11)** | REST API asinkron dengan schema validasi Pydantic v2 |
| **Data Provider** | **yfinance (Yahoo Finance)** + **cachetools** | Sumber data pasar bebas biaya dengan layer in-memory TTL caching |
| **Database & Auth** | **Supabase (PostgreSQL)** | Penyimpanan portofolio/alert dan sistem otentikasi siap pakai |
| **Testing** | **Vitest** (Unit/Integration) & **Playwright** (E2E) | 57 unit tests dengan tingkat kelulusan 100% |
| **Deployment** | **Vercel** (Monorepo Serverless) / **Cloud Run** | Setup monorepo `vercel.json` dengan proxy routing otomatis |

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Prasyarat
- **Node.js** v20+ dan npm
- **Python** 3.11+

---

### 1. Clone Repositori
```bash
git clone https://github.com/NAxel-code/stock-market-watcher.git
cd stock-market-watcher
```

---

### 2. Jalankan Backend (FastAPI)
```bash
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Salin konfigurasi environment
cp .env.example .env

# Jalankan server API
uvicorn app.main:app --reload --port 8000
```
- API Backend berjalan di: `http://localhost:8000`
- Dokumentasi interaktif Swagger/OpenAPI: `http://localhost:8000/docs`

---

### 3. Jalankan Frontend (Next.js 16)
Buka terminal baru di root proyek:
```bash
cd frontend

# Install dependensi npm
npm install

# Salin konfigurasi environment
cp .env.example .env.local

# Jalankan server development
npm run dev
```
- Buka browser di: `http://localhost:3000`

---

## 🧪 Pengujian Otomatis (Testing)

Proyek ini menerapkan *Test-Driven Development (TDD)* yang ketat untuk menjamin stabilitas setiap fitur.

### Frontend Unit & Component Tests (Vitest)
```bash
cd frontend
npm test
```
> **Hasil Uji Terkini**: **57 / 57 tests passed (100% PASS)** di 11 test suites:
> - `SpotlightTour.test.tsx` (5 tests)
> - `TutorialModal.test.tsx` (5 tests)
> - `SectorFilterBar.test.tsx` (6 tests)
> - `Sparkline.test.tsx` (3 tests)
> - `MultiHorizonReturns.test.tsx` (4 tests)
> - `StockCard.test.tsx` (4 tests)
> - `formatters.test.ts` (14 tests)
> - `useUIStore.test.ts` (7 tests)
> - `Navbar.test.tsx`, `SearchCommand.test.tsx`, `PriceAlertModal.test.tsx`

### Backend Unit & Service Tests (Pytest)
```bash
cd backend
pytest -v
```

---

## 📁 Struktur Monorepo

```
stock-market-watcher/
├── package.json               # Root monorepo npm workspaces
├── vercel.json                # Vercel deployment & serverless proxy routing
├── docs/                      # Dokumentasi arsitektur, PRD, dan visual
│   └── screenshots/           # Bukti visual UI & spotlight tour
├── frontend/                  # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout dengan dark mode & query client
│   │   │   ├── page.tsx       # Beranda dashboard utama
│   │   │   ├── stocks/[ticker]# Halaman analitik detail emiten
│   │   │   └── watchlist/     # Halaman khusus daftar pantauan
│   │   ├── components/
│   │   │   ├── features/      # SpotlightTour, TutorialModal, IdxLotCalculator, dll.
│   │   │   ├── layout/        # Navbar, MarketStatusRibbon, ThemeToggle
│   │   │   └── ui/            # Primitive components (Button, Dialog, Badge, Skeleton)
│   │   ├── hooks/             # TanStack Query custom hooks
│   │   ├── lib/               # API client, formatters mata uang/indeks, utils
│   │   ├── stores/            # Zustand stores (useUIStore)
│   │   └── types/             # TypeScript interfaces (StockQuote, Returns, dll.)
│   └── next.config.ts         # Konfigurasi Turbopack & API proxy rewrites
└── backend/                   # FastAPI Python backend
    ├── pyproject.toml         # Standar PEP 621 packaging (uv/hatchling)
    ├── app/
    │   ├── api/v1/            # Endpoint stocks, market, watchlist, alerts
    │   ├── core/              # Config, exceptions, structured logging
    │   ├── models/            # Pydantic schemas (StockQuote, AutoRejection, dll.)
    │   ├── services/          # yfinance provider, multi-period return calculators
    │   └── db/                # SQL migrations untuk Supabase
    └── tests/                 # Pytest test suite
```

---

## 📌 Riwayat Masalah & Solusi (GitHub Issues Tracking)

Seluruh perubahan dan penambahan fitur telah terdokumentasi secara rinci pada GitHub Issue Tracker repositori:

| Issue | Judul & Topik | Label | Commit Penyelesaian |
| :---: | :--- | :--- | :---: |
| [**#1**](https://github.com/NAxel-code/stock-market-watcher/issues/1) | `feat(tutorial): Interactive Spotlight Tour with live DOM element highlighting` | `enhancement`, `accessibility` | [`9dd1236`](https://github.com/NAxel-code/stock-market-watcher/commit/9dd1236) |
| [**#2**](https://github.com/NAxel-code/stock-market-watcher/issues/2) | `feat(tutorial): Interactive feature guide and ticker cheat sheet modal` | `enhancement`, `documentation` | [`67936c5`](https://github.com/NAxel-code/stock-market-watcher/commit/67936c5) |
| [**#3**](https://github.com/NAxel-code/stock-market-watcher/issues/3) | `fix(currency): Market indices formatted as currency and USD/IDR inconsistency across views` | `bug` | [`628c04a`](https://github.com/NAxel-code/stock-market-watcher/commit/628c04a) |
| [**#4**](https://github.com/NAxel-code/stock-market-watcher/issues/4) | `refactor(ui): UI/UX audit for financial terminal aesthetic and contrast compliance` | `enhancement` | [`666d010`](https://github.com/NAxel-code/stock-market-watcher/commit/666d010) |
| [**#5**](https://github.com/NAxel-code/stock-market-watcher/issues/5) | `feat(watchlist): Sector and market filter explorer for US & IDX bluechip tickers` | `enhancement` | [`7c9e456`](https://github.com/NAxel-code/stock-market-watcher/commit/7c9e456) |
| [**#6**](https://github.com/NAxel-code/stock-market-watcher/issues/6) | `feat(analytics): 7-day sparklines, multi-horizon returns, and 52-week peak distance` | `enhancement` | [`cb16a4a`](https://github.com/NAxel-code/stock-market-watcher/commit/cb16a4a) |
| [**#7**](https://github.com/NAxel-code/stock-market-watcher/issues/7) | `fix(deploy): Vercel monorepo configuration, python uv packaging, and serverless routing` | `bug` | [`26788c2`](https://github.com/NAxel-code/stock-market-watcher/commit/26788c2) |
| [**#8**](https://github.com/NAxel-code/stock-market-watcher/issues/8) | `fix(nextjs16): Next.js 16 dynamic route params Promise and CommandDialog context wrap` | `bug` | [`36b919d`](https://github.com/NAxel-code/stock-market-watcher/commit/36b919d) |

---

## 🤖 AI-Assisted Development

Proyek ini dikembangkan menggunakan kolaborasi *AI-assisted pair programming* (Google DeepMind Antigravity) untuk arsitektur sistem, desain komponen, dan verifikasi berbasis pengujian (*Test-Driven Development*), dengan arahan rekayasa perangkat lunak (*human engineering*) yang berpegang pada prinsip kebersihan kode, pencegahan *over-engineering*, dan presisi domain finansial.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Lihat berkas [LICENSE](./LICENSE) untuk detail lebih lanjut.
