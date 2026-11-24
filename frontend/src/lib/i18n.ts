export type Language = 'en' | 'id'

export const translations = {
  en: {
    // Navigation & Common
    dashboard: 'Dashboard',
    watchlist: 'Watchlist',
    search: 'Search',
    account: 'Account',
    guide: 'Guide',
    telemetryTitle: 'Market Telemetry & Quant Terminal',
    searchPlaceholder: 'Search stocks (e.g. AAPL, BBCA)...',
    quickFxConversion: 'Quick FX Conversion',
    clickToCopy: 'Click to copy',
    copiedToClipboard: 'Copied to clipboard!',

    // Currency Switcher
    displayCurrency: 'Display Currency',
    nativeCurrency: 'Native',
    nativeDesc: 'Listing Exchange Currency',

    // Market Ribbon
    marketStatus: 'Real-Time Market Status',
    open: 'Open',
    closed: 'Closed',
    fxTicker: 'FX',

    // Dashboard Overview
    benchmarkOverview: 'Global & IDX Benchmark Overview',
    activeEquities: 'Active Equities Universe',
    topBluechips: 'TOP BLUECHIPS (US, SGX & IDX)',
    allFilter: 'All',
    stocksCount: 'Stocks',
    resetDefaults: 'Restore Default 32 Bluechips',
    loadFeatured: 'Load 32 Featured Stocks (US & IDX)',

    // Stock Detail & Order Ticket
    technicalDesk: 'Technical Desk',
    paperTrading: 'Paper Trading',
    chartAndStats: 'Chart & Stats',
    lotCalculator: 'IDX Lot Calculator',
    from52wHigh: 'From 52W High',
    denomination: 'DENOMINATION',
    autoRejectionLimits: 'Auto Rejection Limits (IDX)',
    araUpper: 'ARA (Upper)',
    arbLower: 'ARB (Lower)',
    tickSize: 'Tick',
    multiHorizonPerf: 'Multi-Horizon Performance',

    // Trading Desk
    buy: 'Buy',
    sell: 'Sell',
    shares: 'Shares',
    lots: 'Lots',
    orderType: 'Order Type',
    limitPrice: 'Limit Price',
    takeProfit: 'Take Profit',
    stopLoss: 'Stop Loss',
    estimatedTotal: 'Estimated Total',
    cashBalance: 'Virtual Cash',
    executeOrder: 'Execute Simulated Order',
    institutionalImpact: 'Institutional Impact Analysis (Almgren-Chriss)',
    retailOrderNotice: 'Standard Retail Order: Zero Price Impact',
  },
  id: {
    // Navigation & Common
    dashboard: 'Dasbor',
    watchlist: 'Daftar Pantau',
    search: 'Cari',
    account: 'Akun',
    guide: 'Panduan',
    telemetryTitle: 'Telemetri Pasar & Terminal Kuantitatif',
    searchPlaceholder: 'Cari saham (misal: AAPL, BBCA)...',
    quickFxConversion: 'Konversi Valas Instan',
    clickToCopy: 'Klik untuk salin',
    copiedToClipboard: 'Berhasil disalin ke clipboard!',

    // Currency Switcher
    displayCurrency: 'Mata Uang Tampilan',
    nativeCurrency: 'Asli (Native)',
    nativeDesc: 'Mata Uang Listing Asli Bursa',

    // Market Ribbon
    marketStatus: 'Status Pasar Real-Time',
    open: 'Buka',
    closed: 'Tutup',
    fxTicker: 'Valas',

    // Dashboard Overview
    benchmarkOverview: 'Ikhtisar Benchmark Global & IHSG',
    activeEquities: 'Semesta Saham Aktif',
    topBluechips: 'SAHAM UNGGULAN (US, SGX & BEI)',
    allFilter: 'Semua',
    stocksCount: 'Saham',
    resetDefaults: 'Pulihkan 32 Saham Unggulan',
    loadFeatured: 'Muat 32 Saham Unggulan (US & BEI)',

    // Stock Detail & Order Ticket
    technicalDesk: 'Meja Analisis Teknikal',
    paperTrading: 'Simulasi Trading',
    chartAndStats: 'Grafik & Statistik',
    lotCalculator: 'Kalkulator Lot BEI',
    from52wHigh: 'Dari Rekor 52 Minggu',
    denomination: 'DENOMINASI',
    autoRejectionLimits: 'Batasan Auto Rejection (BEI)',
    araUpper: 'ARA (Batas Atas)',
    arbLower: 'ARB (Batas Bawah)',
    tickSize: 'Fraksi',
    multiHorizonPerf: 'Kinerja Multi-Horizon',

    // Trading Desk
    buy: 'Beli',
    sell: 'Jual',
    shares: 'Lembar',
    lots: 'Lot',
    orderType: 'Tipe Pesanan',
    limitPrice: 'Harga Limit',
    takeProfit: 'Take Profit',
    stopLoss: 'Stop Loss',
    estimatedTotal: 'Estimasi Total Nilai',
    cashBalance: 'Saldo Virtual',
    executeOrder: 'Eksekusi Simulasi Pesanan',
    institutionalImpact: 'Analisis Dampak Institusional (Almgren-Chriss)',
    retailOrderNotice: 'Pesanan Ritel Standar: Tanpa Dampak Harga',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function getTranslation(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key
}
