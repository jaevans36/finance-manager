# Feature Specification: Stocks & Shares

**Feature ID**: `011-stocks-shares`  
**Created**: 2026-05-19  
**Status**: Draft  
**Priority**: P2  
**Dependencies**: Authentication Service, Application Hub (dashboard widget)

## Overview

A Stocks & Shares micro-application that lets users discover trending market activity, track a personal watchlist, and manage an investment portfolio. Alongside the full application, a configurable dashboard widget provides at-a-glance market insights or portfolio status directly from the Life Manager hub.

The application is intentionally scoped for the **retail investor** use-case — someone who wants to stay informed and track their own holdings — not professional trading tooling.

---

## Rationale

Investment and financial awareness is a core life management activity. The existing Finance Application handles transaction import, budgeting, and savings goals; Stocks & Shares complements it by covering the *investment* side of personal finance: what is the market doing right now, what does the user own, and how is it performing?

Key differentiators from generic finance apps:
- **Cross-domain integration**: Portfolio value can appear on the hub dashboard alongside budget health and fitness streaks.
- **No brokerage required**: Users manually log holdings, so any broker or platform is supported.
- **Progressive detail**: A compact widget for quick glances, a full application for deep research.

---

## API Strategy

### Primary: Finnhub (`https://finnhub.io`)

Free tier (30 calls/second, 1 WebSocket connection) is sufficient for MVP. All endpoints used in this spec are available on the free tier unless noted.

| What we need | Endpoint | Free? |
|---|---|---|
| Real-time quote (price, change, % change) | `GET /quote?symbol=AAPL` | ✅ |
| Company profile (name, logo, exchange, currency, market cap) | `GET /stock/profile2?symbol=AAPL` | ✅ |
| Key fundamentals (P/E, 52-week high/low, beta) | `GET /stock/metric?symbol=AAPL&metric=all` | ✅ |
| Analyst recommendations | `GET /stock/recommendation?symbol=AAPL` | ✅ |
| Earnings surprises (last 4 quarters) | `GET /stock/earnings?symbol=AAPL` | ✅ |
| Insider transactions | `GET /stock/insider-transactions?symbol=AAPL` | ✅ |
| Insider sentiment score (MSPR) | `GET /stock/insider-sentiment?symbol=AAPL` | ✅ |
| Market-wide news | `GET /news?category=general` | ✅ |
| Company-specific news (1yr history) | `GET /company-news?symbol=AAPL&from=…&to=…` | ✅ |
| Symbol search by name/ISIN | `GET /search?q=apple` | ✅ |
| Full symbol list for an exchange | `GET /stock/symbol?exchange=US` | ✅ |
| Market open/closed status | `GET /stock/market-status?exchange=US` | ✅ |
| Peer companies | `GET /stock/peers?symbol=AAPL` | ✅ |
| Upcoming earnings calendar | `GET /calendar/earnings` | ✅ |
| Upcoming IPO calendar | `GET /calendar/ipo` | ✅ |
| Real-time price stream | `wss://ws.finnhub.io` | ✅ (1 connection) |
| OHLCV chart candles | `GET /stock/candle` | ❌ Premium |
| Dividends | `GET /stock/dividend` | ❌ Premium |
| Social sentiment (Reddit, Twitter) | `GET /stock/social-sentiment` | ❌ Premium |

### Secondary: Alpha Vantage (`https://www.alphavantage.co`)

Free tier (25 calls/minute). Used specifically for the **Market Hotlist** feature because Alpha Vantage provides a dedicated top-gainers/losers/most-active endpoint on the free tier.

| What we need | Endpoint | Free? |
|---|---|---|
| Top 20 gainers, losers, most active (US market) | `GET /query?function=TOP_GAINERS_LOSERS` | ✅ (end-of-day; real-time requires premium) |
| Company overview (description, sector, P/E, EPS, dividend yield) | `GET /query?function=OVERVIEW&symbol=AAPL` | ✅ |
| News with sentiment score per article | `GET /query?function=NEWS_SENTIMENT&tickers=AAPL` | ✅ |
| Daily OHLCV (last 100 trading days) | `GET /query?function=TIME_SERIES_DAILY&symbol=AAPL` | ✅ (compact) |

### Provider Abstraction

The backend implements an `IStockDataProvider` interface so providers can be swapped or composed without changing application logic. Finnhub handles real-time quotes and company intelligence; Alpha Vantage handles market-wide rankings and news sentiment.

```
IStockDataProvider
  ├── FinnhubStockDataProvider   (quotes, profiles, fundamentals, news, search)
  └── AlphaVantageStockDataProvider  (market movers, news sentiment, daily series)
```

API keys are stored as environment variables (`FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`), never in source.

---

## What People Track in Stock Applications

Research into common retail investor apps (Robinhood, Trading 212, eToro, Freetrade, Yahoo Finance) reveals five consistent use patterns:

1. **Market Pulse** — What is moving right now? Top gainers and losers, highest-volume names, sector movers.
2. **Watchlist** — A curated list of symbols the user follows without necessarily owning them.
3. **Portfolio** — Owned shares: how much did I pay, what is it worth now, how much have I made or lost.
4. **News & Events** — What is driving price moves? Company announcements, earnings, analyst upgrades/downgrades.
5. **Stock Deep-Dive** — Fundamental data (P/E, EPS, dividend yield), historical price chart, insider activity, peer comparison.

This spec covers all five patterns across a full application and a configurable dashboard widget.

---

## Caching Strategy

Quotes are not stored permanently; they are ephemeral snapshots. The backend caches aggressively to protect rate limits.

| Data type | Cache duration | Rationale |
|---|---|---|
| Quote (price/change) — market open | 60 seconds | Acceptable delay for retail use; protects 30 req/s limit |
| Quote (price/change) — market closed | 15 minutes | Price does not change |
| Company profile / fundamentals | 24 hours | Rarely changes |
| Analyst recommendations | 24 hours | Published infrequently |
| Market movers (top gainers/losers) | 5 minutes (market open) | Alpha Vantage updates throughout the day |
| News | 10 minutes | New articles are infrequent |
| Market status | 1 hour | Exchange hours are predictable |
| Symbol search results | 1 hour | Symbol list changes rarely |

All cache entries are keyed per symbol (or per data type for market-wide data) and stored in a distributed cache (Redis or in-memory for development).

---

## Handling Many Stocks (Scale Considerations)

A user may follow 100+ symbols. Strategies to keep the UI fast and API calls manageable:

**Backend**:
- Quotes are fetched in batches using Finnhub's quote endpoint (1 symbol/call); a background job refreshes all watched/portfolio symbols on a schedule rather than per-request.
- The per-user symbol set is bounded: max 200 watchlist + portfolio items. This is disclosed in the UI.
- WebSocket streaming is reserved for the stock detail page (1 active symbol at a time) rather than the full list.

**Frontend**:
- Portfolio and watchlist lists use **virtual scrolling** (TanStack Virtual) so 100+ rows render with consistent performance.
- The dashboard widget shows at most **8 items** with a "View all" link to the full application.
- List views paginate server-side (page size: 50) with infinite scroll as fallback.
- Quote refreshes are batched: a single `useQuery` call with all watched symbols, not one per row.

---

## User Stories

---

### User Story 1 — Browse the Market Hotlist (Priority: P1)

Users can see what is trending in the market right now: the top gainers, top losers, and most actively traded stocks, updated throughout the trading day. This requires no account or portfolio setup.

**Why this priority**: It is the first thing a user with no holdings wants to see. It provides immediate value and encourages deeper engagement.

**Independent Test**: Load the hotlist with no portfolio configured; verify top gainers/losers/most-active lists populate from Alpha Vantage `TOP_GAINERS_LOSERS`, show correct symbols with % change and volume, and refresh on demand.

**Acceptance Scenarios**:

1. **Given** a user opens the Stocks application, **When** the hotlist loads, **Then** three tabs display: "Top Gainers", "Top Losers", and "Most Active", each showing up to 20 US-listed symbols
2. **Given** the hotlist is loaded, **When** the user views a row, **Then** each row shows: ticker symbol, company name, current price, change (£/$/€), % change, and today's trading volume
3. **Given** the market is open, **When** the user clicks "Refresh", **Then** the list updates with the latest data (respecting the 5-minute cache)
4. **Given** the market is closed, **When** the user views the hotlist, **Then** a banner indicates "Market closed — showing end-of-day data" with the close time
5. **Given** a symbol in the hotlist, **When** the user clicks it, **Then** they navigate to the Stock Detail view for that symbol
6. **Given** any symbol in the hotlist, **When** the user long-presses or right-clicks, **Then** a context menu offers "Add to Watchlist" and "Add to Portfolio"
7. **Given** the user is on mobile, **When** the hotlist renders, **Then** the layout condenses to a compact card format (symbol, price, % change) that fits without horizontal scrolling

---

### User Story 2 — Search and Discover Stocks (Priority: P1)

Users can search for any stock, ETF, or index fund by name or ticker symbol and navigate to its detail page or add it to their watchlist.

**Why this priority**: Search is the entry point for all other features. Without it, users cannot add holdings or watchlist items.

**Independent Test**: Search "Tesla", "NVDA", and "London Stock Exchange" — verify results appear within 500ms, show the exchange and instrument type, and tapping a result navigates to Stock Detail.

**Acceptance Scenarios**:

1. **Given** the user types in the search bar, **When** they have entered at least 2 characters, **Then** results appear within 500ms using Finnhub's symbol search, debounced at 300ms
2. **Given** search results, **When** the user views the list, **Then** each result shows: ticker, company name, exchange, and instrument type (Common Stock / ETF / Fund)
3. **Given** results from multiple exchanges (e.g., TSLA on NASDAQ, TSLA.MX on Mexican exchange), **When** displayed, **Then** results are grouped by exchange with the US exchange prioritised
4. **Given** no matching results, **When** the search completes, **Then** an empty state shows "No results for '[query]'" with a suggestion to check the spelling
5. **Given** a search result, **When** the user selects it, **Then** they navigate to the Stock Detail view for that symbol
6. **Given** a search result, **When** the user taps the "+" icon on the result, **Then** they are prompted to add it to their Watchlist or Portfolio without leaving the search flow

---

### User Story 3 — Manage a Watchlist (Priority: P1)

Users can maintain a personal watchlist of symbols they are monitoring, with live price updates, without recording any ownership.

**Why this priority**: A watchlist is the most common stock-app feature. It requires no financial data (no purchase price) so it is lower friction than portfolio tracking.

**Independent Test**: Add 5 symbols to watchlist, reload the page, verify all 5 persist with current prices. Remove one symbol; verify it disappears immediately. Add a duplicate symbol; verify it is rejected.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they add a symbol to their watchlist, **Then** it persists in the database and appears on next login
2. **Given** the watchlist, **When** it loads, **Then** each symbol displays: price, change, % change (all colour-coded green/red), company logo (from Finnhub profile), and exchange
3. **Given** the market is open, **When** the watchlist is visible, **Then** prices refresh automatically every 60 seconds via polling (no WebSocket needed for list view)
4. **Given** a watchlist with more than 20 items, **When** the user scrolls the list, **Then** virtual scrolling ensures smooth performance with 100+ items
5. **Given** the user attempts to add a duplicate symbol, **When** they confirm, **Then** the system shows "Already in your watchlist" and does not create a duplicate
6. **Given** the user wants to remove a symbol, **When** they click the remove icon and confirm, **Then** it is removed immediately from the list
7. **Given** the user wants to reorder watchlist items, **When** they drag and drop rows, **Then** the custom order persists across sessions
8. **Given** a watchlist item, **When** the user clicks it, **Then** they navigate to Stock Detail for that symbol

---

### User Story 4 — Track a Personal Portfolio (Priority: P1)

Users can log stock holdings manually (symbol, number of shares, average purchase price), track the current market value of each position, and view their overall portfolio performance.

**Why this priority**: This is the core financial tracking feature — turning market data into personally relevant information about the user's own investments.

**Independent Test**: Add 3 holdings (AAPL: 10 shares at £150, TSCO.LON: 50 shares at £280, VWRL.LON: 5 shares at £80). Verify total value updates with current prices; verify unrealised gain/loss and % return calculate correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they add a holding, **Then** they enter: symbol (via search), number of shares, average purchase price, and currency (pre-filled from company profile)
2. **Given** a holding exists, **When** the user views their portfolio, **Then** each row shows: symbol, company name, shares held, average cost, current price, current value, unrealised gain/loss (£), and return (%)
3. **Given** multiple holdings, **When** the portfolio loads, **Then** a summary header shows: total invested, total current value, total unrealised gain/loss (£ and %), and number of positions
4. **Given** holdings in multiple currencies, **When** displaying the portfolio total, **Then** values are converted to the user's preferred currency using live FX rates (Finnhub forex endpoint)
5. **Given** a holding, **When** the user edits the number of shares or average cost (e.g., after adding more shares), **Then** the values recalculate immediately
6. **Given** a holding, **When** the user deletes it, **Then** it is removed from the portfolio and the totals update accordingly
7. **Given** the portfolio, **When** the user wants to understand asset allocation, **Then** a doughnut chart shows their portfolio split by sector (from Finnhub company profiles)
8. **Given** a portfolio position, **When** the user taps it, **Then** they navigate to Stock Detail for that symbol, with the portfolio context (cost basis) shown on the detail page
9. **Given** the user has more than 20 positions, **When** the portfolio table renders, **Then** virtual scrolling ensures smooth performance

**Data Model — Holdings**:
```
Holding {
  id: Guid
  userId: string
  symbol: string          // e.g. "AAPL"
  exchange: string        // e.g. "NASDAQ"
  companyName: string     // cached from profile
  sharesHeld: decimal
  averageCostPrice: decimal
  currency: string        // ISO 4217, e.g. "USD"
  addedAt: DateTime
  updatedAt: DateTime
  notes: string?
}
```

**Derived at query time (not stored)**:
- `currentPrice` — fetched from quote cache
- `currentValue` = `sharesHeld × currentPrice`
- `unrealisedGainLoss` = `currentValue − (sharesHeld × averageCostPrice)`
- `returnPercent` = `unrealisedGainLoss / (sharesHeld × averageCostPrice) × 100`

---

### User Story 5 — View Stock Detail (Priority: P1)

Users can view a comprehensive detail page for any stock, covering the current price, a price history chart, company overview, recent news, analyst recommendations, and key fundamentals.

**Why this priority**: The detail page is the destination for all navigation flows (from watchlist, portfolio, hotlist, search). It is also the highest-value page for user engagement.

**Independent Test**: Navigate to AAPL detail. Verify price, 52-week range, and company profile load from Finnhub. Verify last 3 company news articles display. Verify analyst recommendation bar renders. Verify the page displays a "Price History" chart (daily data from Alpha Vantage `TIME_SERIES_DAILY`, compact, last 100 days).

**Acceptance Scenarios**:

1. **Given** a user navigates to a stock detail page, **When** it loads, **Then** the header shows: company logo, name, ticker, exchange, current price, change (£), and % change (colour-coded)
2. **Given** the detail page, **When** the fundamental section loads, **Then** it shows: market cap, P/E ratio, 52-week high, 52-week low, beta, and EPS (sourced from Finnhub `stock/metric` and Alpha Vantage `OVERVIEW`)
3. **Given** the detail page, **When** the chart section loads, **Then** a line chart shows the closing price for the last 100 trading days (from Alpha Vantage `TIME_SERIES_DAILY` free tier)
4. **Given** the detail page, **When** the news section loads, **Then** the last 5 company-specific news articles display with headline, source, timestamp, and link to the full article
5. **Given** the detail page, **When** the analyst section loads, **Then** a horizontal bar shows the distribution of analyst recommendations: Strong Buy, Buy, Hold, Sell, Strong Sell (from Finnhub `stock/recommendation`)
6. **Given** the detail page, **When** the insider sentiment section loads, **Then** the MSPR score is shown with a plain-language label (e.g., "Insiders are net buyers") and a tooltip explaining the metric
7. **Given** the user has the stock in their portfolio, **When** they view the detail page, **Then** a "Your Position" card appears showing: shares held, average cost, current value, and unrealised P&L
8. **Given** the user does not hold the stock, **When** they view the detail page, **Then** an "Add to Portfolio" and "Add to Watchlist" button appears in the header
9. **Given** the detail page is open, **When** the WebSocket is available, **Then** the current price and change tick update in real-time via `wss://ws.finnhub.io` (only 1 symbol streamed at a time)
10. **Given** peer companies are available, **When** the detail page loads, **Then** a "Similar Companies" section shows up to 5 peers from Finnhub `stock/peers`

---

### User Story 6 — Configure the Dashboard Widget (Priority: P2)

Users can add a Stocks & Shares widget to the Life Manager hub dashboard. The widget is switchable between two modes: **Market Hotlist** (see what is trending) and **My Portfolio** (see personal holdings at a glance).

**Why this priority**: Dashboard integration is the "daily driver" use case — users who do not want to open the full app should still get relevant financial information on their hub.

**Independent Test**: Add widget in hotlist mode — verify top 5 movers display. Switch to portfolio mode — verify holdings list renders. Configure to show only top 3 portfolio positions sorted by % return.

**Acceptance Scenarios**:

1. **Given** the user is configuring their hub dashboard, **When** they add a new widget, **Then** "Stocks & Shares" appears in the widget catalogue with a preview thumbnail
2. **Given** the widget is added, **When** the user first configures it, **Then** they choose: mode (`Hotlist` or `Portfolio`), items to show (3, 5, or 8), and preferred size (`compact` or `standard`)
3. **Given** `Hotlist` mode, **When** the widget renders, **Then** it shows the selected number of items from a configurable sub-mode: `Top Gainers`, `Top Losers`, or `Most Active`
4. **Given** `Hotlist` mode, **When** the user taps an item, **Then** they navigate directly to the Stock Detail page for that symbol within the Stocks & Shares application
5. **Given** `Portfolio` mode, **When** the widget renders, **Then** it shows holdings sorted by the user's choice: by absolute gain (default), by % return, or by current value
6. **Given** `Portfolio` mode, **When** the market is open, **Then** values refresh every 60 seconds; when closed, a "Market closed" indicator is shown
7. **Given** `Portfolio` mode with no holdings configured, **When** the widget renders, **Then** an empty state shows "Add your first holding" with a link to the Stocks application
8. **Given** `compact` size (1-column widget), **When** it renders, **Then** each row shows only: symbol, current price, and % change; no company name or absolute P&L
9. **Given** `standard` size (2-column widget), **When** it renders, **Then** each row shows: company logo, symbol, price, % change, and (in portfolio mode) P&L
10. **Given** the user wants to switch mode, **When** they click the widget settings gear, **Then** they can toggle between Hotlist and Portfolio modes without removing and re-adding the widget
11. **Given** the widget header, **When** any mode is active, **Then** a "View all" link navigates to the full Stocks & Shares application

**Widget Configuration Model**:
```
StocksWidgetConfig {
  id: Guid
  userId: string
  mode: 'hotlist' | 'portfolio'
  hotlistSubMode: 'gainers' | 'losers' | 'mostActive'
  itemCount: 3 | 5 | 8
  size: 'compact' | 'standard'
  portfolioSortBy: 'gainAbsolute' | 'gainPercent' | 'currentValue'
}
```

---

## Data Models (Summary)

### Backend Entities

```
WatchlistItem {
  id: Guid
  userId: string
  symbol: string
  exchange: string
  companyName: string     // cached snapshot
  displayOrder: int       // user-defined order
  addedAt: DateTime
}

Holding {
  id: Guid
  userId: string
  symbol: string
  exchange: string
  companyName: string
  sharesHeld: decimal
  averageCostPrice: decimal
  currency: string
  notes: string?
  addedAt: DateTime
  updatedAt: DateTime
}

StocksWidgetConfig {
  id: Guid
  userId: string
  mode: string
  hotlistSubMode: string
  itemCount: int
  size: string
  portfolioSortBy: string
  updatedAt: DateTime
}
```

### Cached / Ephemeral (not persisted beyond TTL)

```
QuoteCache {
  symbol: string
  price: decimal
  change: decimal
  changePercent: decimal
  high: decimal
  low: decimal
  open: decimal
  previousClose: decimal
  cachedAt: DateTime
  ttlSeconds: int
}

MarketMoversCache {
  topGainers: MarketMoverItem[]    // up to 20
  topLosers: MarketMoverItem[]     // up to 20
  mostActive: MarketMoverItem[]    // up to 20
  cachedAt: DateTime
}

MarketMoverItem {
  symbol: string
  name: string
  price: decimal
  changePercent: decimal
  volume: long
}
```

---

## Security Considerations

- API keys for Finnhub and Alpha Vantage are backend-only secrets; the frontend never receives or exposes them.
- All stock data endpoints require JWT authentication — no unauthenticated public API.
- Holdings data (financial positions) is private; queries always scope to `userId` from the JWT claim.
- Rate-limit checks are enforced server-side before calling external APIs to avoid accidental key bans.
- The symbol field is validated against a known-format pattern (`/^[A-Z0-9.]{1,20}$/`) before being used in API calls to prevent injection.

---

## Out of Scope (MVP)

The following are intentionally deferred for future phases:

- **Real-time WebSocket streaming for portfolio list** — polling is sufficient; WebSocket reserved for 1 symbol on detail page only
- **Intraday charts** — requires Finnhub premium candles or Alpha Vantage premium intraday
- **Dividend tracking** — requires Finnhub premium dividends endpoint
- **Options data** — premium only and beyond retail investor scope
- **Brokerage API integration** (automatic portfolio sync) — very complex; manual entry is the MVP
- **Price alerts / notifications** — Phase 2 feature
- **Social sentiment** (Reddit/WallStreetBets trending) — Finnhub premium
- **Technical indicators** (RSI, MACD, Bollinger Bands) — available free from Alpha Vantage but adds complexity; deferred
- **Crypto tracking** — separate concern; deferred to a Crypto module

---

## Phases

| Phase | Name | Priority | Depends On |
|-------|------|----------|-----------|
| **Phase 56** | Market Discovery & Watchlist | P1 | Auth Service |
| **Phase 57** | Portfolio Tracking | P1 | Phase 56 |
| **Phase 58** | Stock Detail & Analysis | P1 | Phase 56 |
| **Phase 59** | Dashboard Widget | P2 | Phase 57, Phase 58, Application Hub |

**Tasks**: `applications/stocks/tasks.md` (T1500–T1580, ~80 tasks, ~9 weeks)
