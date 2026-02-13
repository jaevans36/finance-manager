# Tasks: Weather Forecast Application

**Input**: `specs/applications/weather/spec.md`  
**Prerequisites**: Authentication Service, Microservices Architecture  
**Continues from**: T1054 (Test Automation tasks)

**Organisation**: Tasks grouped by phase for weather data, forecasts, alerts, and visualisation.

**Technology Stack**:
- **Backend**: .NET Core 8.0 Web API, Entity Framework Core, PostgreSQL
- **Frontend**: React 18 with TypeScript, Leaflet.js (maps)
- **External API**: OpenWeatherMap or WeatherAPI.com
- **Caching**: Redis

## Format: `[ID] [P?] [Story] Description`

---

## Phase 32: Weather Core — Current Conditions & Forecast (Priority: P1)

**Purpose**: Current weather and multi-day forecast for user locations  
**Estimated Effort**: 1.5 weeks (16 tasks)  
**Dependencies**: API gateway routing `/api/v1/weather/*`

### Backend: Weather Service (Week 1, Days 1-3)

- [ ] T1055 [P] [US1] Create Weather microservice project (`apps/weather-api/WeatherApi.csproj`) with EF Core - 3h
- [ ] T1056 [P] [US1] Define FavouriteLocation entity in `apps/weather-api/Data/Entities/` - 2h
- [ ] T1057 [US1] Create WeatherDbContext and initial migration - 1h
- [ ] T1058 [US1] Implement WeatherProviderService (OpenWeatherMap adapter with caching) - 6h
- [ ] T1059 [US1] Implement CurrentWeatherController (GET /current with lat/lon or location query) - 3h
- [ ] T1060 [US2] Implement ForecastController (hourly 48h, daily 14-day) - 3h
- [ ] T1061 [US5] Implement LocationsController (CRUD, primary, reorder) - 3h
- [ ] T1062 [US1] Implement location search endpoint (geocoding API) - 2h
- [ ] T1063 [P] [US1] Configure Redis for weather data caching (10-60 min TTLs by data type) - 3h
- [ ] T1064 [US1/US2] Write unit tests for WeatherProviderService (10+ tests) - 3h
- [ ] T1065 [US1/US2/US5] Write integration tests for weather and location endpoints (12+ tests) - 3h

### Frontend: Weather UI (Week 1, Days 4-5)

- [ ] T1066 [P] [US1] Create Weather TypeScript interfaces (CurrentWeather, Forecast, Location) - 1h
- [ ] T1067 [P] [US1] Create weatherService API methods in `apps/web/src/services/weatherService.ts` - 2h
- [ ] T1068 [US1] Create CurrentConditions component (temperature, conditions, feels-like, details) - 4h
- [ ] T1069 [US2] Create ForecastView component (7-day cards, expandable hourly, precipitation) - 5h
- [ ] T1070 [US1] Create WeatherPage layout with location search and favourite bar - 3h

**Checkpoint**: Users can view current weather and forecasts for any location

---

## Phase 33: Weather Alerts & Favourite Locations (Priority: P1-P2)

**Purpose**: Severe weather alerts, favourite location management, notifications  
**Estimated Effort**: 1 week (12 tasks)  
**Dependencies**: Phase 32 complete

### Backend: Alerts & Notifications (Days 1-3)

- [ ] T1071 [P] [US3] Define WeatherAlert and NotificationPreference entities - 2h
- [ ] T1072 [US3] Create EF Core migration for alerts and notification tables - 1h
- [ ] T1073 [US3] Implement AlertService (fetch alerts from provider, store, notify) - 4h
- [ ] T1074 [US3] Implement AlertsController (active alerts, alert detail, alert history) - 2h
- [ ] T1075 [US3] Implement notification delivery service (push notification integration) - 3h
- [ ] T1076 [US3] Write unit tests for AlertService (8+ tests) - 2h
- [ ] T1077 [US3/US5] Write integration tests for alerts and notifications (8+ tests) - 2h

### Frontend: Alerts & Favourites UI (Days 3-5)

- [ ] T1078 [US3] Create AlertBanner component (severity-coloured banner, detail expansion) - 3h
- [ ] T1079 [US3] Create AlertList component (active/historical alerts, severity sorting) - 3h
- [ ] T1080 [US5] Create FavouritesSidebar component (location list, current temps, drag reorder) - 4h
- [ ] T1081 [US3] Create NotificationPreferences settings component - 2h
- [ ] T1082 [US3/US5] Write Jest tests for alert and favourite components (8+ tests) - 2h

**Checkpoint**: Users receive weather alerts, manage favourite locations

---

## Phase 34: Calendar Integration & Dashboard Widget (Priority: P2)

**Purpose**: Weather on calendar events, platform dashboard widget  
**Estimated Effort**: 1 week (10 tasks)  
**Dependencies**: Phase 32 weather data, platform calendar

### Backend: Calendar & Widget API (Days 1-2)

- [ ] T1083 [US4] Implement calendar weather endpoint (forecast for specific dates/locations) - 3h
- [ ] T1084 [US4] Implement widget endpoint (compact summary for dashboard) - 2h
- [ ] T1085 [US4] Write integration tests for calendar and widget endpoints (6+ tests) - 2h

### Frontend: Calendar & Widget UI (Days 3-5)

- [ ] T1086 [US4] Create CalendarWeather component (weather icons/temps on calendar days) - 4h
- [ ] T1087 [US4] Integrate weather overlay on platform calendar events - 3h
- [ ] T1088 [US4] Create WeatherWidget for Application Hub dashboard (compact current + forecast) - 3h
- [ ] T1089 [US4] Write Jest tests for calendar and widget components (6+ tests) - 2h
- [ ] T1090 [US4] Write E2E test for weather on calendar integration - 3h
- [ ] T1091 [US1-US5] Add `/weather` route and navigation menu entry - 1h
- [ ] T1092 [US1-US5] Write comprehensive E2E test for weather app end-to-end flow - 3h

**Checkpoint**: Weather appears on calendar, widget on dashboard

---

## Phase 35: AQI, Radar & Historical Data (Priority: P3-P4)

**Purpose**: Air quality, radar maps, and historical weather data  
**Estimated Effort**: 1.5 weeks (12 tasks)  
**Dependencies**: Phase 32 complete

### Backend: Extended Weather Data (Week 1, Days 1-3)

- [ ] T1093 [US6] Implement AQI endpoint (air quality index, pollutant breakdown) - 3h
- [ ] T1094 [US7] Implement radar imagery endpoint (tile URLs from provider) - 3h
- [ ] T1095 [US8] Implement historical weather endpoint (past dates, monthly averages) - 3h
- [ ] T1096 [US6] Implement AQI health advisory logic (recommendations based on level) - 2h
- [ ] T1097 [US6-US8] Write unit and integration tests for extended endpoints (10+ tests) - 3h

### Frontend: Extended Weather UI (Week 1, Days 4-5)

- [ ] T1098 [US6] Create AQICard component (index value, colour coding, pollutants, health advice) - 3h
- [ ] T1099 [US7] Create RadarMap component (Leaflet.js map with precipitation overlay, animation) - 6h
- [ ] T1100 [US8] Create HistoricalWeather component (date picker, past conditions, averages) - 4h
- [ ] T1101 [US6] Implement fitness app AQI warning integration (outdoor workout advisory) - 2h
- [ ] T1102 [US6-US8] Write Jest tests for AQI, radar, and historical components (8+ tests) - 2h
- [ ] T1103 [US6-US8] Write E2E tests for AQI display and radar interaction - 3h
- [ ] T1104 [US1] Add sunrise/sunset, UV index, and moon phase using SunCalc library - 2h

**Checkpoint**: Complete weather app with AQI, radar, historical data, and astronomical info

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 32 | Weather Core | P1 | T1055-T1070 (16) | 1.5 weeks |
| 33 | Alerts & Favourites | P1-P2 | T1071-T1082 (12) | 1 week |
| 34 | Calendar & Widget | P2 | T1083-T1092 (10) | 1 week |
| 35 | AQI, Radar, History | P3-P4 | T1093-T1104 (12) | 1.5 weeks |
| **Total** | | | **50 tasks** | **~5 weeks** |
