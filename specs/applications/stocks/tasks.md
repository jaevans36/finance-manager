# Tasks: Stocks & Shares Application

**Input**: `specs/applications/stocks/spec.md`  
**Prerequisites**: Authentication Service (Phase 22), Application Hub (Phase 6)  
**Continues from**: T1499 (reserved gap)

**Organisation**: Tasks grouped by phase and user story for independent implementation.

**Technology Stack**:
- **Backend**: .NET 8 Web API, EF Core 8, PostgreSQL — new `stocks` schema in the main API (or isolated microservice post-Phase 26)
- **Frontend**: React 18 + TypeScript, Vite, TanStack Query, Tailwind + shadcn/ui, TanStack Virtual
- **External APIs**: Finnhub (primary), Alpha Vantage (market movers + daily chart)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (US1–US6)

---

## Phase 56: Market Discovery & Watchlist (Priority: P1)

**Purpose**: API integration foundation, symbol search, watchlist CRUD, and market hotlist  
**Estimated Effort**: 2.5 weeks (25 tasks)  
**Dependencies**: JWT auth from existing auth middleware

### Backend: Provider Abstraction & Finnhub Integration (Week 1, Days 1-3)

- [ ] T1500 [P] [US2] Create `IStockDataProvider` interface in `apps/life-api/Features/Stocks/Providers/` with methods: `GetQuoteAsync`, `SearchSymbolsAsync`, `GetCompanyProfileAsync`, `GetBasicMetricsAsync`, `GetCompanyNewsAsync`, `GetMarketStatusAsync` — 3h
- [ ] T1501 [P] [US2] Create `FinnhubStockDataProvider` implementing `IStockDataProvider` using `HttpClient` and `FINNHUB_API_KEY` env var — 4h
- [ ] T1502 [US2] Register `IStockDataProvider` → `FinnhubStockDataProvider` in DI; configure typed `HttpClient` for `https://api.finnhub.io/api/v1/` — 1h
- [ ] T1503 [P] [US1] Create `IMarketMoversProvider` interface with `GetMarketMoversAsync` (gainers/losers/most-active) — 1h
- [ ] T1504 [US1] Create `AlphaVantageMarketMoversProvider` implementing `IMarketMoversProvider`, calling `TOP_GAINERS_LOSERS` with `ALPHA_VANTAGE_API_KEY` env var — 3h
- [ ] T1505 [US1/US2] Create `StockCacheService` wrapping both providers with in-memory cache (IMemoryCache); implement TTLs per `spec.md` caching strategy — 4h
- [ ] T1506 [P] [US2] Create Finnhub and Alpha Vantage response DTOs in `apps/life-api/Features/Stocks/Providers/Dtos/` (FinnhubQuoteDto, FinnhubProfileDto, FinnhubMetricDto, FinnhubNewsDto, AlphaVantageMoversDto) — 3h
- [ ] T1507 [US1/US2] Write unit tests for `StockCacheService` (cache hit/miss/expiry, 10+ tests) in `apps/life-api-tests/LifeApi.UnitTests/` — 3h

### Backend: Watchlist Entities & API (Week 1, Days 4-5)

- [ ] T1508 [P] [US3] Create `WatchlistItem` entity in `apps/life-api/Features/Stocks/Models/` with fields from spec data model — 2h
- [ ] T1509 [US3] Add `DbSet<WatchlistItem>` to `LifeApiDbContext`; create EF Core migration `AddStocksWatchlist` — 1h
- [ ] T1510 [US3] Implement `WatchlistService` in `apps/life-api/Features/Stocks/Services/` with: `GetWatchlistAsync`, `AddToWatchlistAsync`, `RemoveFromWatchlistAsync`, `ReorderWatchlistAsync` — 4h
- [ ] T1511 [US3] Implement `WatchlistController` (`GET /api/v1/stocks/watchlist`, `POST`, `DELETE /:id`, `PUT /reorder`) with JWT auth — 3h
- [ ] T1512 [US3] Create watchlist DTOs (`AddWatchlistItemRequest`, `WatchlistItemResponse`, `ReorderRequest`) in `apps/life-api/Features/Stocks/DTOs/` — 2h
- [ ] T1513 [US3] Enforce max 200 watchlist items per user in `WatchlistService`; return HTTP 422 with clear message when exceeded — 1h
- [ ] T1514 [US3] Write unit tests for `WatchlistService` (add/remove/duplicate/limit/reorder, 12+ tests) — 3h
- [ ] T1515 [US3] Write integration tests for `WatchlistController` (CRUD flows, 8+ tests) — 2h

### Backend: Market Hotlist & Quotes API (Week 2, Days 1-2)

- [ ] T1516 [US1] Implement `StocksController` with `GET /api/v1/stocks/market/movers` (calls `AlphaVantageMarketMoversProvider` via cache) — 2h
- [ ] T1517 [US2] Implement `GET /api/v1/stocks/search?q={query}` using `FinnhubStockDataProvider.SearchSymbolsAsync` (validated symbol pattern, min 2 chars) — 2h
- [ ] T1518 [US2] Implement `GET /api/v1/stocks/quotes` accepting `symbols[]` query param (batch, max 50); returns cached quotes for all requested symbols — 3h
- [ ] T1519 [US1] Implement `GET /api/v1/stocks/market/status?exchange=US` using cached `GetMarketStatusAsync` — 1h
- [ ] T1520 [US1/US2] Write integration tests for `StocksController` (movers, search, quotes, market-status, 10+ tests) — 3h

### Frontend: Stocks Feature Foundation (Week 2, Days 3-5)

- [ ] T1521 [P] [US1/US2] Create TypeScript interfaces in `apps/web/src/types/stocks.ts`: `Quote`, `CompanyProfile`, `MarketMover`, `MarketMovers`, `WatchlistItem`, `SearchResult`, `MarketStatus` — 2h
- [ ] T1522 [P] [US1/US2] Create `stocksService.ts` in `apps/web/src/services/` with functions mapping to all backend endpoints — 2h
- [ ] T1523 [US1/US2] Create `StocksPage` component with tabs: "Hotlist", "Watchlist", "Portfolio"; add `/stocks` route in router — 2h
- [ ] T1524 [US1] Create `MarketHotlist` component — three sub-tabs (Gainers/Losers/Most Active), renders `MarketMoverRow` cards with symbol, price, % change, volume — 4h
- [ ] T1525 [US2] Create `StockSearch` component with debounced input (300ms), dropdown results with symbol/name/exchange/type, "Add to Watchlist/Portfolio" actions — 4h

### Frontend: Watchlist UI (Week 2, Days 4-5)

- [ ] T1526 [US3] Create `WatchlistList` component using TanStack Virtual for virtualised row rendering; each row: logo, symbol, name, price, change, % change — 5h
- [ ] T1527 [US3] Implement 60-second auto-refresh with `useQuery` polling (paused when market is closed or tab is hidden) — 2h
- [ ] T1528 [US3] Implement drag-and-drop reorder on watchlist using `@dnd-kit/sortable`; persists order to backend on drop — 3h
- [ ] T1529 [US3] Write Jest tests for `MarketHotlist`, `StockSearch`, `WatchlistList` (15+ tests) — 3h

---

## Phase 57: Portfolio Tracking (Priority: P1)

**Purpose**: Holding CRUD, P&L calculation, currency conversion, sector allocation chart  
**Estimated Effort**: 2 weeks (20 tasks)  
**Dependencies**: Phase 56 (quotes, cache, frontend foundation)

### Backend: Holding Entities & API (Week 1)

- [ ] T1530 [P] [US4] Create `Holding` entity in `apps/life-api/Features/Stocks/Models/` with all fields from spec data model — 2h
- [ ] T1531 [US4] Add `DbSet<Holding>` to `LifeApiDbContext`; create EF Core migration `AddStocksHoldings` — 1h
- [ ] T1532 [US4] Implement `PortfolioService` in `apps/life-api/Features/Stocks/Services/` with: `GetPortfolioAsync`, `AddHoldingAsync`, `UpdateHoldingAsync`, `DeleteHoldingAsync` — 4h
- [ ] T1533 [US4] Implement portfolio summary calculation in `PortfolioService`: enrich holdings with current quotes (via `StockCacheService`), calculate `currentValue`, `unrealisedGainLoss`, `returnPercent` — 4h
- [ ] T1534 [US4] Implement currency conversion in `PortfolioService` using Finnhub forex rate (convert non-preferred-currency holdings to user's preferred currency) — 3h
- [ ] T1535 [US4] Implement `PortfolioController` (`GET /api/v1/stocks/portfolio`, `POST /api/v1/stocks/portfolio/holdings`, `PUT /:id`, `DELETE /:id`) with JWT auth — 3h
- [ ] T1536 [US4] Create portfolio DTOs (`AddHoldingRequest`, `UpdateHoldingRequest`, `HoldingResponse`, `PortfolioSummaryResponse`) in `apps/life-api/Features/Stocks/DTOs/` — 2h
- [ ] T1537 [US4] Enforce max 200 portfolio items per user; validate symbol format on input (`/^[A-Z0-9.]{1,20}$/`) — 1h
- [ ] T1538 [US4] Write unit tests for `PortfolioService` (P&L calculations, currency conversion, limit enforcement, 15+ tests) — 3h
- [ ] T1539 [US4] Write integration tests for `PortfolioController` (CRUD flows, summary endpoint, 8+ tests) — 2h

### Frontend: Portfolio UI (Week 2)

- [ ] T1540 [P] [US4] Create TypeScript interfaces: `Holding`, `HoldingWithQuote`, `PortfolioSummary` in `apps/web/src/types/stocks.ts` — 1h
- [ ] T1541 [US4] Create `PortfolioSummaryBar` component showing: total invested, current value, total P&L (£ and %), position count — 3h
- [ ] T1542 [US4] Create `PortfolioTable` component with TanStack Virtual; columns: symbol, name, shares, avg cost, current price, current value, P&L £, P&L %, actions — 5h
- [ ] T1543 [US4] Create `AddHoldingModal` with symbol search (reuses `StockSearch`), shares input, average cost input, currency display — 4h
- [ ] T1544 [US4] Create `SectorAllocationChart` doughnut chart (Recharts) using sector from company profiles; sectors grouped client-side — 3h
- [ ] T1545 [US4] Implement 60-second auto-refresh for portfolio quotes using `useQuery` polling — 2h
- [ ] T1546 [US4] Write Jest tests for `PortfolioTable`, `AddHoldingModal`, `SectorAllocationChart` (12+ tests) — 3h

---

## Phase 58: Stock Detail & Analysis (Priority: P1)

**Purpose**: Per-symbol detail page: price header, 100-day chart, fundamentals, news, analyst consensus  
**Estimated Effort**: 2 weeks (18 tasks)  
**Dependencies**: Phase 56 foundation; Alpha Vantage `TIME_SERIES_DAILY` for chart data

### Backend: Detail Endpoints

- [ ] T1547 [P] [US5] Add `GET /api/v1/stocks/{symbol}/profile` to `StocksController` — returns merged `FinnhubProfile` + `AlphaVantageOverview` — 3h
- [ ] T1548 [P] [US5] Add `GET /api/v1/stocks/{symbol}/metrics` to `StocksController` — returns Finnhub `stock/metric` fundamentals (P/E, 52wk high/low, beta, EPS) — 2h
- [ ] T1549 [P] [US5] Add `GET /api/v1/stocks/{symbol}/news` to `StocksController` — returns last 10 company news items from Finnhub — 2h
- [ ] T1550 [P] [US5] Add `GET /api/v1/stocks/{symbol}/recommendations` to `StocksController` — returns Finnhub analyst recommendation distribution — 1h
- [ ] T1551 [P] [US5] Add `GET /api/v1/stocks/{symbol}/insider-sentiment` to `StocksController` — returns Finnhub insider sentiment MSPR score — 1h
- [ ] T1552 [P] [US5] Add `GET /api/v1/stocks/{symbol}/chart` to `StocksController` — fetches Alpha Vantage `TIME_SERIES_DAILY` (compact, 100 days), cached 24h — 3h
- [ ] T1553 [P] [US5] Add `GET /api/v1/stocks/{symbol}/peers` to `StocksController` — returns Finnhub peers list (up to 5) — 1h
- [ ] T1554 [US5] Write integration tests for all detail endpoints (symbol validation, cache behaviour, 10+ tests) — 3h

### Frontend: Stock Detail Page

- [ ] T1555 [P] [US5] Create TypeScript interfaces: `StockDetail`, `CompanyMetrics`, `NewsArticle`, `AnalystRecommendation`, `InsiderSentiment`, `ChartDataPoint` in `apps/web/src/types/stocks.ts` — 2h
- [ ] T1556 [US5] Create `StockDetailPage` with route `/stocks/:symbol`; parallel data fetching via multiple `useQuery` calls (profile, metrics, chart, news, recommendations) — 4h
- [ ] T1557 [US5] Create `PriceHeader` component: company logo, name, symbol, exchange, real-time price (ticking from WebSocket when available, otherwise 60s polling), change £, change % — 3h
- [ ] T1558 [US5] Implement Finnhub WebSocket connection for 1 symbol (`wss://ws.finnhub.io`): subscribe on mount, unsubscribe on unmount/navigation, update `PriceHeader` in real-time — 4h
- [ ] T1559 [US5] Create `PriceChart` component — Recharts `LineChart` rendering 100-day closing price series; responsive, labelled axes, hover tooltip with date and price — 4h
- [ ] T1560 [US5] Create `FundamentalsGrid` component — market cap, P/E, 52-week range (high/low bar), beta, EPS — each metric with label, value, and tooltip description — 3h
- [ ] T1561 [US5] Create `AnalystConsensus` component — horizontal segmented bar (Recharts `BarChart`) showing Strong Buy/Buy/Hold/Sell/Strong Sell counts and percentages — 3h
- [ ] T1562 [US5] Create `NewsSection` component — scrollable list of news cards (headline, source, timestamp, external link); opens in new tab — 2h
- [ ] T1563 [US5] Create `InsiderSentimentCard` component — MSPR score gauge, plain-language summary, link to tooltip explanation — 2h
- [ ] T1564 [US5] Write Jest tests for `StockDetailPage`, `PriceChart`, `AnalystConsensus` (12+ tests) — 3h

---

## Phase 59: Dashboard Widget (Priority: P2)

**Purpose**: Configurable hub widget switchable between Market Hotlist and Portfolio modes  
**Estimated Effort**: 1.5 weeks (15 tasks)  
**Dependencies**: Phase 57 (portfolio), Phase 58 (detail page navigation), Application Hub widget infrastructure (Phase 6)

### Backend: Widget Configuration

- [ ] T1565 [P] [US6] Create `StocksWidgetConfig` entity in `apps/life-api/Features/Stocks/Models/` with all fields from spec — 1h
- [ ] T1566 [US6] Add `DbSet<StocksWidgetConfig>` to context; create EF Core migration `AddStocksWidgetConfig` — 1h
- [ ] T1567 [US6] Implement `WidgetConfigService` with `GetOrCreateConfigAsync`, `UpdateConfigAsync` (one config per user) — 2h
- [ ] T1568 [US6] Implement `GET /api/v1/stocks/widget/config` and `PUT /api/v1/stocks/widget/config` endpoints — 1h
- [ ] T1569 [US6] Write unit tests for `WidgetConfigService` (create/update/default values, 6+ tests) — 1h

### Frontend: Stocks Widget

- [ ] T1570 [US6] Create `StocksWidget` component accepting `config: StocksWidgetConfig`; renders either `StocksWidgetHotlist` or `StocksWidgetPortfolio` based on `mode` — 2h
- [ ] T1571 [US6] Create `StocksWidgetHotlist` component — renders top N market movers in compact/standard sizes; maps to `MarketMover` from shared service — 3h
- [ ] T1572 [US6] Create `StocksWidgetPortfolio` component — renders top N holdings sorted by config; shows `MarketStatus` badge; handles empty state — 4h
- [ ] T1573 [US6] Create `StocksWidgetSettings` panel — mode selector, sub-mode selector, item count picker, size toggle, sort order; saves via `PUT /api/v1/stocks/widget/config` — 3h
- [ ] T1574 [US6] Register `StocksWidget` in the Application Hub widget catalogue — add to widget picker, provide preview thumbnail — 2h
- [ ] T1575 [US6] Implement 60-second quote refresh in widget (paused when widget is not visible via IntersectionObserver) — 2h
- [ ] T1576 [US6] Write Jest tests for `StocksWidget`, `StocksWidgetHotlist`, `StocksWidgetPortfolio`, `StocksWidgetSettings` (12+ tests) — 3h

---

## Phase Summary

| Phase | Name | Tasks | IDs | Effort |
|-------|------|-------|-----|--------|
| 56 | Market Discovery & Watchlist | 30 | T1500–T1529 | 2.5 weeks |
| 57 | Portfolio Tracking | 17 | T1530–T1546 | 2 weeks |
| 58 | Stock Detail & Analysis | 18 | T1547–T1564 | 2 weeks |
| 59 | Dashboard Widget | 12 | T1565–T1576 | 1.5 weeks |

**Total**: 77 tasks (T1500–T1576), ~8 weeks estimated effort
