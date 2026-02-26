# Feature Specification: Weather Forecast Application

**Feature ID**: `007-weather-app`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P3  
**Dependencies**: Authentication Service, Microservices Architecture

## Overview

A weather tracking application and dashboard widget within the Life Manager platform. Provides current conditions, multi-day forecasts, severe weather alerts, air quality information, and calendar-integrated weather data. Users can save favourite locations, view historical weather trends, and receive proactive weather notifications.

## Rationale

Weather information directly impacts daily planning — commutes, outdoor activities, travel, and fitness (outdoor workouts). Integrating weather into the Life Manager platform provides context alongside tasks, events, and fitness activities, enabling better daily decision-making without switching between applications.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Current Weather Conditions (Priority: P1)

Users can view current weather conditions for their location or any searched location, including temperature, humidity, wind, precipitation, UV index, and "feels like" temperature.

**Why this priority**: Current conditions are the most frequently checked weather data and form the foundation for all other weather features.

**Independent Test**: Load weather for a location, verify temperature, humidity, wind speed, conditions icon, and UV index match the provider API response.

**Acceptance Scenarios**:

1. **Given** a user opening the Weather app, **When** location access is granted, **Then** current conditions for their location are displayed including temperature, humidity, wind speed/direction, conditions description, and weather icon
2. **Given** a user, **When** they search for a city or postcode, **Then** current conditions for that location are displayed
3. **Given** current conditions, **When** the user views the detail panel, **Then** they see: feels-like temperature, humidity, pressure, visibility, UV index, wind gust speed, dew point, and sunrise/sunset times
4. **Given** the weather widget on the platform dashboard, **When** the user views it, **Then** a compact summary shows temperature, conditions icon, and high/low for the day
5. **Given** weather data, **When** it was last fetched more than 30 minutes ago, **Then** it automatically refreshes and displays the "last updated" timestamp

---

### User Story 2 - Multi-Day Forecast (Priority: P1)

Users can view detailed hourly forecasts for the next 48 hours and daily forecasts for up to 14 days.

**Why this priority**: Forecast data is the second most essential weather feature, enabling users to plan ahead.

**Independent Test**: Load 7-day forecast, verify each day shows high/low temperatures, conditions, precipitation probability, and wind. Verify hourly breakdown for the next 48 hours.

**Acceptance Scenarios**:

1. **Given** a user viewing the forecast, **When** they see the 7-day view, **Then** each day shows high/low temperature, conditions icon, precipitation probability, and wind speed
2. **Given** a user wanting more detail, **When** they expand a forecast day, **Then** hourly breakdowns show temperature, conditions, precipitation chance, wind, and humidity
3. **Given** a 14-day extended forecast, **When** the user scrolls past 7 days, **Then** additional days are shown with decreasing confidence indicators
4. **Given** precipitation in the forecast, **When** the user views a rainy period, **Then** expected rainfall amount (mm), start/end time, and intensity are displayed
5. **Given** a user planning outdoor activities, **When** they view the hourly forecast, **Then** cloud cover percentage and UV index are available for each hour

---

### User Story 3 - Severe Weather Alerts (Priority: P1)

Users receive proactive notifications for severe weather events (storms, extreme temperatures, flooding, fog) that may affect their saved locations.

**Why this priority**: Weather alerts are safety-critical. Users need timely warnings for dangerous conditions regardless of whether they are actively checking the app.

**Independent Test**: Simulate a weather alert for a saved location, verify the notification is delivered, the alert banner appears, and the alert detail page shows correct information.

**Acceptance Scenarios**:

1. **Given** a severe weather warning issued for a user's location, **When** the app detects it, **Then** a prominent alert banner appears at the top of the weather view with severity level and summary
2. **Given** a weather alert, **When** the user clicks for details, **Then** they see the full alert text, affected area, start/end times, severity level, and recommended actions
3. **Given** a user with notification preferences configured, **When** a severe alert is issued, **Then** they receive a push notification and/or email based on their settings
4. **Given** multiple active alerts, **When** the user views the alerts list, **Then** they are ordered by severity (extreme → severe → moderate → minor) with clear colour coding
5. **Given** an expired alert, **When** the event passes, **Then** the alert is automatically removed from active display and moved to alert history

---

### User Story 4 - Calendar Integration (Priority: P2)

Weather forecasts are integrated with the platform's calendar, showing weather conditions alongside events to help users plan activities appropriately.

**Why this priority**: Calendar integration is a key differentiator that provides actionable context, but it depends on core weather functionality being in place.

**Independent Test**: Create a calendar event for a future date, verify weather forecast data appears alongside the event details.

**Acceptance Scenarios**:

1. **Given** a user viewing their calendar, **When** they hover over a future date (within forecast range), **Then** a weather summary appears showing predicted conditions and temperature
2. **Given** an outdoor event on the calendar, **When** the forecast predicts rain for that time/location, **Then** a weather warning icon appears on the event
3. **Given** a user creating a new event, **When** they select a date and location, **Then** the forecast for that date/location is shown in the event creation form
4. **Given** weather data changing, **When** the forecast updates for an event's date, **Then** the calendar weather indicators update accordingly
5. **Given** a user viewing a weekly calendar, **When** they see the weather row, **Then** each day shows a mini weather icon with high/low temperature

---

### User Story 5 - Favourite Locations (Priority: P2)

Users can save multiple locations as favourites for quick access, with the ability to set a primary location and view conditions for all saved locations at a glance.

**Why this priority**: Users often track weather for multiple locations (home, office, family, holiday destinations). Favourites remove repetitive searching.

**Independent Test**: Add multiple favourite locations, verify they persist, display correctly in the favourites panel, and can be reordered and deleted.

**Acceptance Scenarios**:

1. **Given** a user, **When** they search for a location and click "Save to favourites", **Then** the location is added to their favourites list
2. **Given** a user with saved favourites, **When** they open the Weather app, **Then** a sidebar or tab shows all favourites with current temperature and conditions
3. **Given** multiple favourites, **When** the user designates one as "primary", **Then** that location is shown by default when opening the app
4. **Given** a user with favourites, **When** they drag to reorder, **Then** the order is saved and persisted
5. **Given** a user, **When** they delete a favourite, **Then** it is removed from the list with an undo option available for 10 seconds

---

### User Story 6 - Air Quality Index (Priority: P3)

Users can view current air quality data for their location, including AQI levels, pollutant breakdowns, and health recommendations.

**Why this priority**: Air quality is increasingly important for health-conscious users, especially those using the Fitness app for outdoor activities.

**Independent Test**: Load AQI data for a location, verify the index value, pollutant levels, and health recommendations are displayed correctly.

**Acceptance Scenarios**:

1. **Given** a user viewing weather details, **When** they check the AQI section, **Then** the current AQI value is displayed with a colour-coded indicator (Good/Moderate/Unhealthy/Hazardous)
2. **Given** AQI data, **When** the user expands the details, **Then** individual pollutant levels (PM2.5, PM10, O₃, NO₂, SO₂, CO) are shown
3. **Given** poor air quality, **When** the AQI exceeds "Unhealthy for Sensitive Groups", **Then** a health advisory is displayed with recommendations (e.g., "Avoid prolonged outdoor exercise")
4. **Given** a fitness app integration, **When** the user plans an outdoor workout and AQI is poor, **Then** a warning is shown suggesting an indoor alternative
5. **Given** AQI history, **When** the user views the trend, **Then** a 7-day AQI trend chart is displayed

---

### User Story 7 - Weather Radar & Satellite (Priority: P4)

Users can view interactive weather radar and satellite imagery showing precipitation patterns, cloud cover, and storm tracking in real-time.

**Why this priority**: Radar is a visual enhancement feature. Core weather data is available through forecasts; radar provides supplementary visual context.

**Independent Test**: Load radar view for a location, verify precipitation overlay renders on the map, animation controls work, and imagery updates.

**Acceptance Scenarios**:

1. **Given** a user selecting the radar tab, **When** the view loads, **Then** a map displays the user's location with a precipitation radar overlay
2. **Given** the radar map, **When** the user clicks the animation button, **Then** the previous 2 hours of radar data animate across the map
3. **Given** the radar map, **When** the user pans and zooms, **Then** the radar overlay updates for the visible area
4. **Given** satellite imagery, **When** the user toggles between radar and satellite, **Then** cloud cover imagery replaces the precipitation overlay
5. **Given** a storm system visible on radar, **When** the user taps on it, **Then** they see estimated precipitation amount, direction of travel, and estimated arrival time

---

### User Story 8 - Historical Weather Data (Priority: P4)

Users can view historical weather data for locations, enabling them to identify patterns and plan for seasonal activities.

**Why this priority**: Historical data is a "nice-to-have" feature for power users. It provides value for trip planning and seasonal analysis but is not a core weather need.

**Independent Test**: Request historical weather for a date and location, verify temperature, conditions, and precipitation data match known historical records.

**Acceptance Scenarios**:

1. **Given** a user selecting a past date, **When** they request historical weather for a location, **Then** actual recorded conditions are displayed including temperature, precipitation, and wind
2. **Given** a user viewing monthly history, **When** they select a month and location, **Then** average temperatures, total rainfall, and typical conditions are shown
3. **Given** a user planning a trip to a destination, **When** they check historical weather for the travel dates, **Then** "typical weather" for that period is displayed based on multi-year averages
4. **Given** historical data, **When** the user compares with current year, **Then** anomalies are highlighted (e.g., "10°C warmer than average for this date")

---

## Data Model

### Core Entities

```typescript
interface FavouriteLocation {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string | null;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface WeatherAlert {
  id: string;
  locationId: string;
  provider: string;
  eventType: string;             // 'thunderstorm', 'heat_wave', 'flood', etc.
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  headline: string;
  description: string;
  instruction: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

interface NotificationPreference {
  id: string;
  userId: string;
  alertSeverityThreshold: 'minor' | 'moderate' | 'severe' | 'extreme';
  notifyByPush: boolean;
  notifyByEmail: boolean;
  quietHoursStart: string | null;  // HH:mm
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Weather Data (cached, proxied from provider)
```
GET    /api/v1/weather/current              Current conditions (lat/lon or location ID)
GET    /api/v1/weather/forecast/hourly      48-hour hourly forecast
GET    /api/v1/weather/forecast/daily       14-day daily forecast
GET    /api/v1/weather/aqi                  Current air quality index
GET    /api/v1/weather/alerts               Active weather alerts for location
GET    /api/v1/weather/radar                Radar imagery URLs
GET    /api/v1/weather/historical           Historical data for date + location
```

### Favourite Locations
```
POST   /api/v1/weather/locations            Save favourite location
GET    /api/v1/weather/locations            List favourite locations
PUT    /api/v1/weather/locations/:id        Update location (name, order, primary)
DELETE /api/v1/weather/locations/:id        Remove favourite location
PATCH  /api/v1/weather/locations/:id/primary  Set as primary location
```

### Notifications
```
GET    /api/v1/weather/notifications/preferences    Get notification preferences
PUT    /api/v1/weather/notifications/preferences    Update notification preferences
GET    /api/v1/weather/notifications/history        Get past alert notifications
```

### Search
```
GET    /api/v1/weather/search               Search locations by name/postcode
GET    /api/v1/weather/geocode              Reverse geocode (lat/lon → location name)
```

## Technical Considerations

### Weather Data Provider
- **Primary**: OpenWeatherMap API (One Call API 3.0) or WeatherAPI.com
- **Fallback**: Met Office DataPoint API (for UK locations)
- API key stored in environment variables, never client-side

### Data Caching Strategy
- Current conditions: Cache for 10 minutes
- Hourly forecast: Cache for 30 minutes
- Daily forecast: Cache for 1 hour
- AQI: Cache for 30 minutes
- Alerts: Cache for 5 minutes (safety-critical)
- Historical: Cache for 24 hours (data doesn't change)
- Cache per location using Redis

### Rate Limiting
- Free tier limits (e.g., OpenWeatherMap: 1000 calls/day)
- Server-side caching to minimise API calls
- User rate limiting: Max 60 weather requests per user per hour

### Map Integration
- **Leaflet.js**: Open-source map library for radar/satellite views
- **Mapbox** or **OpenStreetMap** tiles for base map
- Radar overlay as tile layer from provider API

### Accessibility
- All weather data must be screen-reader accessible
- Colour-coded indicators must also have text labels
- Weather icons must have descriptive alt text
- AQI health recommendations must be clear and actionable

### Sunrise/Sunset & Astronomy
- Calculate using SunCalc library (no API needed)
- Display sunrise, sunset, golden hour, moon phase
- Day length and change from previous day

### Units
- Support Celsius/Fahrenheit, km/h/mph, mm/inches
- Default to user's locale preference
- Persist unit preference in user settings
