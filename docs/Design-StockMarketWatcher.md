# StockPulse - Design System & UI/UX Guidelines

## 1. Design Philosophy
The StockPulse design language embraces a **Financial Dashboard Aesthetic**, drawing inspiration from professional tools like the Bloomberg Terminal but modernized for web and mobile.

- **Dark Mode Default**: Provides a professional trading feel, reduces eye strain for long sessions, and makes data colors (green/red) pop.
- **Clean & Data-Dense**: Balances high information density without feeling cluttered by utilizing whitespace strategically and clear typography hierarchies.
- **Micro-Animations**: Subtle animations indicate data changes (e.g., green/red flashes on price updates) without distracting the user.
- **Accessible & Inclusive**: High contrast ratios, keyboard navigability, and screen-reader-friendly semantic HTML.

## 2. Color System
Our color palette uses Tailwind CSS conventions based on the `zinc` scale for neutrals, providing a sleek, modern, and cool-toned metallic feel.

### Dark Theme (Default)
| Element | Hex Code | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#09090b` | `zinc-950` | Main application background |
| **Card** | `#18181b` | `zinc-900` | Background for panels, cards, and dropdowns |
| **Border** | `#27272a` | `zinc-800` | Dividers, borders, input outlines |
| **Text Primary** | `#fafafa` | `zinc-50` | Primary headings and standard body text |
| **Text Secondary** | `#a1a1aa` | `zinc-400` | Secondary text, labels, and helper text |
| **Accent/Primary** | `#3b82f6` | `blue-500` | Interactive elements, active states, focus rings |
| **Success/Up** | `#22c55e` | `green-500` | Positive price changes, active indicators |
| **Danger/Down** | `#ef4444` | `red-500` | Negative price changes, error states, destructive actions |
| **Warning** | `#f59e0b` | `amber-500` | Alerts, warnings, pending states |
| **Chart Line** | `#8b5cf6` | `violet-500` | Neutral chart lines (e.g., volume, indices) |

### Light Theme
| Element | Hex Code | Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `#ffffff` | `white` | Main application background |
| **Card** | `#f4f4f5` | `zinc-100` | Background for panels and cards |
| **Border** | `#e4e4e7` | `zinc-200` | Dividers, borders, input outlines |
| **Text Primary** | `#09090b` | `zinc-950` | Primary headings and standard body text |
| **Text Secondary** | `#71717a` | `zinc-500` | Secondary text, labels, and helper text |

## 3. Typography
We utilize the **Geist** font family, optimized for digital interfaces and code.

- **Headings & Body**: `Geist Sans`
- **Numbers & Data**: `Geist Mono` (Crucial for tabular data alignment and readable tickers)

### Scale & Hierarchy
- `xs` (12px): Metadata, timestamps, chart axes labels.
- `sm` (14px): Secondary text, watchlist table rows.
- `base` (16px): Main body text, standard inputs.
- `lg` (18px): Subheadings, card titles.
- `xl` (20px): Modal titles, page headers.
- `2xl` (24px): Dashboard primary metrics.
- `3xl` (30px): Large price displays, primary marketing headings.

### Weights
- Regular (400): Standard body and data.
- Medium (500): Table headers, secondary buttons.
- Semibold (600): Card titles, active navigation items.
- Bold (700): Ticker symbols, critical price numbers.

## 4. Component Library (shadcn/ui based)

### StockCard
- **Appearance**: A compact rectangular card with rounded corners (`rounded-xl`).
- **Content**: Ticker symbol (bold), current price (mono), change percentage (green/red), and a small 7-day sparkline.
- **States**: 
  - *Hover*: Slight negative translation (`-translate-y-1`), shadow elevation, border highlight.
  - *Loading*: Skeleton representation of text and chart.
- **Responsive**: Adapts width to fit grid; sparkline hides on very small screens.

### PriceChart
- **Appearance**: Main interactive area chart or candlestick chart built with Recharts.
- **States**:
  - *Active*: Shows custom tooltip with exact price/volume at cursor.
  - *Loading*: Large rectangular skeleton with a subtle pulse.
- **Features**: Timeframe selector pills (1D, 1W, 1M, YTD, 1Y, 5Y) at the top right.

### WatchlistTable
- **Appearance**: Data-dense table. Columns: Ticker, Name, Price, Change (%), Volume, 52W Range.
- **States**: 
  - *Hover*: Row background slightly lightens (`bg-zinc-800/50`).
- **Responsive**: Horizontal scroll on mobile, sticky first column (Ticker).

### SearchCommand (cmdk)
- **Appearance**: Floating command palette (`Ctrl+K` / `Cmd+K` triggered), blurred backdrop.
- **States**: Empty state showing "No results found.", loading spinner during debounced API fetch.

### MarketSummary
- **Appearance**: Row of 3-4 mini cards showing major indices (S&P 500, NASDAQ, DOW). 
- **Variants**: Carousel on mobile, flex row on desktop.

### AlertBadge
- **Appearance**: Pill-shaped badge indicating active price alerts.
- **States**: Active (filled), Inactive (outlined).

### NavigationBar
- **Appearance**: Top sticky header. Contains logo, search trigger, navigation links, theme toggle, and user avatar.
- **Responsive**: Collapses into a hamburger menu (Sheet component) on mobile.

### ThemeToggle
- **Appearance**: Sun/Moon icon button. Smooth rotational and cross-fade animation on toggle.

### StockTicker
- **Appearance**: Infinite scrolling marquee at the very top or bottom of the dashboard showing live indices.

### LoadingSkeleton / ErrorFallback / EmptyState
- **LoadingSkeleton**: Soft pulsing `bg-zinc-800/50`.
- **ErrorFallback**: Centered card with a subtle red border, error icon, and "Retry" button.
- **EmptyState**: Centered illustration (or generic icon) with muted text, e.g., "Your watchlist is empty."

## 5. Magic UI Components
Integrating Magic UI for premium, delightful interactions:

- **AnimatedNumber**: Used for the main price display on the Stock Detail Page and Portfolio value, animating smoothly between values instead of jumping.
- **Sparkline**: Integrated within the `StockCard` and `MarketSummary` for quick visual context.
- **GradientBorder**: Used to highlight the most actively traded stock or a user's biggest gainer for the day.
- **ShimmerButton**: Primary Call to Action on the landing page ("Start Watching").
- **Globe**: Rendered in the background of the landing page or "Global Markets" section.
- **TextReveal**: Used on the marketing/landing page for scroll-triggered value proposition reveal.
- **DotPattern**: Subtle background pattern for the authentication pages and landing page.

## 6. Layout System

- **Dashboard Grid**: Uses CSS Grid. Standard 12-column layout. Main content spans 8 cols, sidebar/watchlist spans 4 cols on desktop.
- **Breakpoints**: 
  - `sm`: 640px (Mobile landscape)
  - `md`: 768px (Tablet)
  - `lg`: 1024px (Laptop)
  - `xl`: 1280px (Desktop)
- **Mobile Layout**: Top navbar transforms into a bottom tab bar (Home, Search, Watchlist, Profile) for easier thumb reach.

## 7. Page Wireframes

### Dashboard Page
```text
[ Navbar: Logo | Search (Cmd+K) | User Menu ]
[ StockTicker: SPY +1.2% | QQQ -0.4% | DIA +0.8% ]
---------------------------------------------------
[ Market Summary Cards (SPY, QQQ, VIX)            ]
---------------------------------------------------
[ Main Chart (Default: SPY)  ] [ Mini Watchlist   ]
[ Timeframes: 1D 1W 1M YTD   ] [ AAPL  $150  +1%  ]
[                            ] [ MSFT  $310  -2%  ]
[      <Recharts Area>       ] [ TSLA  $200  +5%  ]
[                            ] [                  ]
---------------------------------------------------
[ Top Movers (Grid of StockCards)                 ]
```

### Stock Detail Page
```text
[ Navbar ]
---------------------------------------------------
[ < Ticker > < Company Name >   [ + Add to Watchlist ]
[ $Price (AnimatedNumber)       ]
[ + Change / - Change           ]
---------------------------------------------------
[ PriceChart Component (Full Width)               ]
---------------------------------------------------
[ Key Statistics Grid                             ]
[ Mkt Cap | P/E Ratio | 52W High | 52W Low | Vol  ]
```

## 8. Micro-interactions & Animations
- **Price Change Flash**: When a websocket/polling update occurs, the text background flashes `bg-green-500/20` (up) or `bg-red-500/20` (down) for 500ms before fading out.
- **Chart Hover**: Custom tooltip snaps to data points; vertical crosshair line follows the cursor.
- **Page Transitions**: Next.js App Router layout transitions (fade-in, slight slide-up).
- **Pull-to-refresh**: On mobile, pulling down triggers a spinner and force-refreshes data.

## 9. Icon System
- **Library**: Lucide React.
- **Size Standards**: 
  - `16px` (inline with text)
  - `20px` (standard buttons, nav items)
  - `24px` (header icons, mobile tabs).
- **Stroke Width**: `2px` consistently.

## 10. Data Visualization Standards
- **Color Schemes**: Up (Green), Down (Red), Neutral Volume (Zinc-500).
- **Axis Formatting**: Y-axis should abbreviate large numbers (1M, 1B). X-axis dates should format intelligently based on timeframe (e.g., 1D shows HH:MM, 1Y shows Month Year).
- **Tooltips**: Must display the exact timestamp, OHLC values, and volume.
- **Number Formatting**: 
  - Currency: `$1,234.56`
  - Percentage: `+1.23%` (always include sign for changes)
  - Volume: `1.2M`
