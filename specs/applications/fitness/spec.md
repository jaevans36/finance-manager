# Feature Specification: Fitness Application

**Feature ID**: `003-fitness-app`  
**Created**: 2026-02-13  
**Status**: Draft  
**Priority**: P2  
**Dependencies**: Authentication Service, Microservices Architecture

## Overview

A comprehensive fitness tracking application within the Life Manager platform. The Fitness Application enables users to track workouts, monitor nutrition, log body measurements, set and pursue fitness goals, and build healthy habits — all integrated with the platform's task management and calendar systems.

## Rationale

Health and fitness management is a critical aspect of personal productivity. By integrating fitness tracking into the Life Manager platform, users gain a unified view of their physical health alongside their tasks, events, and finances. This holistic approach encourages users to treat fitness as part of their overall life management strategy.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Activity & Workout Tracking (Priority: P1)

Users need to log workouts and physical activities, including exercise type, duration, sets/reps, and estimated calorie expenditure. AI-powered calorie estimation provides intelligent estimates based on activity type, duration, intensity, and user biometrics.

**Why this priority**: Workout tracking is the core value proposition of the fitness application. Without it, no other fitness features are meaningful.

**Independent Test**: Log various workout types (cardio, strength, flexibility), verify data persistence, calorie estimates, and history display.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a new workout entry with exercise type, duration, and intensity, **Then** the workout is saved and an AI-estimated calorie burn is calculated
2. **Given** a user logging a strength workout, **When** they enter exercises with sets, reps, and weight, **Then** volume is calculated and individual exercise progress is tracked
3. **Given** a user with historical workout data, **When** they view their activity log, **Then** workouts are displayed chronologically with summaries of duration, type, and calories
4. **Given** a user completing a workout, **When** the AI estimates calorie burn, **Then** the estimate considers exercise type, duration, intensity, user weight, age, and gender
5. **Given** a user viewing workout history, **When** they filter by exercise type or date range, **Then** only matching workouts are displayed with aggregate statistics
6. **Given** a user with a connected smartwatch, **When** workout data syncs from the device, **Then** the data is imported automatically without manual entry (see User Story 2)

---

### User Story 2 - Smartwatch & Wearable Data Import (Priority: P2)

Users can import fitness data from smartwatches and wearable devices (e.g., Apple Watch, Fitbit, Garmin) to automatically populate workout logs, heart rate data, step counts, and sleep data.

**Why this priority**: Automated data import removes significant friction from fitness tracking, dramatically improving data accuracy and user engagement. Depends on core tracking being functional first.

**Independent Test**: Connect a supported device/service, trigger data sync, verify imported data appears correctly in workout logs and dashboards.

**Acceptance Scenarios**:

1. **Given** a user with a supported smartwatch, **When** they connect their device through the settings page, **Then** the connection is established via OAuth and data sync begins
2. **Given** a connected device, **When** new workout data is available, **Then** it is automatically synced at configurable intervals (e.g., every 15 minutes, hourly, daily)
3. **Given** imported workout data, **When** the user views their activity log, **Then** imported entries are clearly marked with the source device/service
4. **Given** a user with both manual and imported workout data, **When** duplicate detection identifies an overlap, **Then** the user is prompted to merge or keep both entries
5. **Given** a user wanting to disconnect a device, **When** they revoke access in settings, **Then** the OAuth connection is terminated and future syncs stop (historical data is retained)

**Supported Platforms** (initial):
- Apple Health (via HealthKit API)
- Google Fit (via Google Fit REST API)
- Fitbit (via Fitbit Web API)
- Garmin (via Garmin Connect API)
- Strava (via Strava API)

**Enhancement**: Support for custom CSV/GPX file import for users with unsupported devices.

---

### User Story 3 - Food Tracking & Macro Estimation (Priority: P1)

Users can log meals and food intake with AI-powered macro-nutrient estimation. The system estimates calories, protein, carbohydrates, and fat content based on food descriptions, portion sizes, or photographs.

**Why this priority**: Nutrition tracking is equally important to exercise tracking for fitness goals. Together they form the complete fitness picture.

**Independent Test**: Log meals using text descriptions and portion sizes, verify macro estimates, daily totals, and nutritional breakdown displays.

**Acceptance Scenarios**:

1. **Given** a user logging a meal, **When** they enter a food description (e.g., "grilled chicken breast 200g with rice 150g"), **Then** the AI estimates calories, protein, carbs, and fat for each item
2. **Given** a user logging food, **When** they search the food database, **Then** matching items appear with pre-populated nutritional information per serving
3. **Given** a user viewing their daily nutrition, **When** they check the dashboard, **Then** they see total calories consumed, macros breakdown (protein/carbs/fat), and remaining targets
4. **Given** a user with nutritional goals, **When** daily intake approaches or exceeds targets, **Then** visual indicators (progress bars, colour changes) alert the user
5. **Given** a user wanting to log a complex meal, **When** they describe it in natural language (e.g., "large pepperoni pizza, 3 slices"), **Then** the AI parses the description and estimates per-slice macros
6. **Given** a user logging recurring meals, **When** they mark a meal as a "favourite", **Then** it can be quickly re-logged in future with one click
7. **Given** a user reviewing their nutrition history, **When** they view weekly or monthly summaries, **Then** average daily intake trends are displayed with charts

**Enhancement**: Photo-based meal logging using AI image recognition to identify foods and estimate portions.

---

### User Story 4 - Weight & Body Measurements (Priority: P2)

Users can log and track body weight, body fat percentage, and various body measurements over time, with trend visualisation and goal progress indicators.

**Why this priority**: Body measurements provide crucial feedback on whether fitness and nutrition plans are working. Important for motivation and course correction.

**Independent Test**: Log weight and measurements over multiple dates, verify trend charts, goal progress, and statistical calculations (averages, rate of change).

**Acceptance Scenarios**:

1. **Given** a user, **When** they log their body weight with today's date, **Then** the entry is saved and appears on the weight trend chart
2. **Given** a user tracking weight over time, **When** they view the weight chart, **Then** a trend line shows the direction and rate of change (e.g., "losing 0.5kg/week")
3. **Given** a user, **When** they log body measurements (chest, waist, hips, arms, thighs, calves, neck), **Then** each measurement is tracked independently over time
4. **Given** a user with a target weight, **When** they view the weight dashboard, **Then** progress towards the target is shown as a percentage with estimated time to reach the goal
5. **Given** a user logging body fat percentage, **When** they enter a value, **Then** lean body mass is calculated and tracked alongside total weight
6. **Given** a user with regular weigh-ins, **When** they view statistics, **Then** weekly/monthly averages, highest, lowest, and rate of change are displayed

---

### User Story 5 - Goal Setting & Progress Tracking (Priority: P2)

Users can set fitness goals (weight loss, muscle gain, running distance, workout frequency, etc.) and track progress with visual indicators, milestones, and reminders.

**Why this priority**: Goals provide direction and motivation for all fitness activities. Without goals, data collection becomes meaningless.

**Independent Test**: Create various goal types, log progress data, verify percentage completion calculations, milestone notifications, and goal history.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a fitness goal with a target value and deadline (e.g., "Lose 5kg by 1 June"), **Then** the goal appears on their fitness dashboard with progress tracking
2. **Given** a user with an active goal, **When** they log relevant data (weight, workouts, etc.), **Then** goal progress updates automatically as a percentage
3. **Given** a user with multiple goals, **When** they view the goals dashboard, **Then** all goals are displayed with current progress, time remaining, and projected completion date
4. **Given** a user achieving a milestone (25%, 50%, 75%), **When** they reach the threshold, **Then** a congratulatory notification is displayed and the milestone is recorded
5. **Given** a user completing a goal, **When** the target is reached, **Then** the goal is marked as achieved with a celebration animation and the option to set a new goal
6. **Given** a user with an expiring goal, **When** the deadline passes without completion, **Then** they can extend the deadline, modify the target, or archive the goal

---

### User Story 6 - Workout Planning & Scheduling (Priority: P3)

Users can create workout plans (e.g., "Push/Pull/Legs 5-day split") and schedule workouts on specific days, with integration into the platform calendar.

**Why this priority**: Planning builds on tracking to help users structure their fitness routines. Less critical than core tracking and goals.

**Independent Test**: Create workout plans with exercises, schedule them on calendar days, verify calendar integration and workout reminders.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a workout plan with named days and exercises, **Then** the plan is saved and available for scheduling
2. **Given** a user with a workout plan, **When** they assign days of the week to plan days, **Then** workouts appear automatically on the platform calendar
3. **Given** a scheduled workout day, **When** the user opens the calendar, **Then** the planned workout appears with exercise list, sets, and reps
4. **Given** a user completing a planned workout, **When** they log actual performance, **Then** planned vs actual is compared and displayed
5. **Given** a user browsing workout plans, **When** they view the plan library, **Then** community-shared plans and template plans are available to copy and customise
6. **Given** a user following a multi-week programme, **When** they view their schedule, **Then** progressive overload suggestions are provided based on previous performance

---

### User Story 7 - Social & Motivation Features (Priority: P4)

Users can connect with friends, share progress, participate in challenges, and provide mutual motivation and accountability.

**Why this priority**: Social features enhance engagement but are not core to personal fitness tracking. They build on all other features being functional.

**Independent Test**: Send friend request, accept it, create a challenge, verify both participants see progress, leaderboard updates, and notifications.

**Acceptance Scenarios**:

1. **Given** a user, **When** they search for friends by username, **Then** matching users are displayed with the option to send a connection request
2. **Given** two connected users, **When** one shares a workout achievement, **Then** the friend sees it in their activity feed
3. **Given** a user, **When** they create a fitness challenge (e.g., "Most workouts in January"), **Then** they can invite friends to participate
4. **Given** participants in a challenge, **When** they log relevant activities, **Then** a leaderboard shows rankings updated in real-time
5. **Given** a user completing a personal record, **When** the PR is detected automatically, **Then** they receive a badge and can share the achievement
6. **Given** a user viewing their profile, **When** they check their badges, **Then** all earned achievements are displayed with dates and descriptions

---

### User Story 8 - Habit Tracking (Priority: P2)

Users can define personal habits, track daily completion with a GitHub-style contribution grid, set habit goals, colour-theme their habits, and optionally link habits to tasks in the task manager. Habits can be archived when no longer active whilst preserving historical data.

**Why this priority**: Habit tracking is a distinct productivity pattern that bridges fitness and task management. The GitHub-style visualisation provides strong motivation through streak visibility.

**Independent Test**: Create habits with custom colours, complete them daily, verify the contribution grid renders accurately, streaks calculate correctly, and archived habits retain their data.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a new habit with a name, colour, and target frequency (e.g., "Exercise 3x/week"), **Then** the habit appears in their habit tracker with the custom colour
2. **Given** a user viewing the habit tracker, **When** they see the contribution grid, **Then** it displays a GitHub-style block grid showing completed days over the past 12 months with colour intensity indicating completion
3. **Given** a user with a habit, **When** they mark it as completed for today, **Then** the grid updates immediately and the current streak counter increments
4. **Given** a user with a streak, **When** they miss a day, **Then** the streak resets but the historical completion data is preserved on the grid
5. **Given** a user with a habit goal (e.g., "Exercise 3x/week"), **When** they view progress, **Then** a percentage completion is shown for the current period and a trend over previous weeks
6. **Given** a user wanting to link a habit to their task manager, **When** they enable "Create task on habit days", **Then** a task is automatically created in the task manager on scheduled days
7. **Given** a user with customisable habit colours, **When** they edit a habit's colour theme, **Then** the contribution grid and all UI elements update to reflect the chosen colour
8. **Given** a user no longer pursuing a habit, **When** they archive it, **Then** the habit is hidden from active views but all historical data is preserved and accessible via an "Archived" filter
9. **Given** a user viewing habit statistics, **When** they check an individual habit, **Then** they see total completions, longest streak, current streak, completion rate, and a monthly breakdown
10. **Given** a user with multiple habits, **When** they view the habits dashboard, **Then** all active habits are displayed in a grid layout with mini contribution charts, current streaks, and progress bars

#### Habit Categories

11. **Given** a user creating a habit, **When** they assign it a category (e.g., "Health", "Productivity", "Learning", "Financial", "Social", "Custom"), **Then** the habit is tagged and can be filtered by category across the dashboard
12. **Given** a user viewing the habits dashboard, **When** they filter by category, **Then** only habits in that category are shown with aggregate completion statistics for the selected category

#### Event Linking & Automation

13. **Given** a user linking a habit to a calendar event pattern, **When** they configure a pattern (e.g., "mark habit complete whenever I log an event matching 'Gym'"), **Then** completing that calendar event automatically marks the habit as done for that day via the event bus
14. **Given** a user linking a habit to a specific recurring calendar event, **When** they attend and mark the event complete, **Then** the `EventCompleted` event is published, the Fitness service consumes it, and the habit is marked complete without manual intervention
15. **Given** a habit configured to generate calendar events (task linking, extended), **When** the habit is due per its frequency, **Then** a calendar event is created in the Events app in addition to (or instead of) a task, at the user's configured preference
16. **Given** a task linked to a habit, **When** the task is marked complete, **Then** the `TaskCompleted` event marks the habit complete for the day; conversely, marking the habit complete for a day marks any linked task for that day as done — bidirectional sync
17. **Given** a habit with both a linked task and a linked event, **When** either the task or event is marked complete, **Then** the habit is marked complete for that day (first completion wins; subsequent completions are no-ops for that day)

**Enhancement**: Habit reminders via push notification or email at user-specified times. Habit templates for common patterns (daily exercise, meditation, reading, hydration).

> **Future consideration**: If habit tracking grows beyond fitness (e.g., financial habits, productivity habits), the Habits feature should be extracted to a standalone `Habits` application with its own service. The `category` field is the migration path — all habits with `category != 'fitness'` would move to the new service. This is not planned for the current roadmap but the data model supports it.

---

### User Story 9 - Meditation & Mindfulness (Priority: P4)

Users can access guided meditation and mindfulness exercises with session tracking, progress statistics, and streak maintenance.

**Why this priority**: Meditation complements physical fitness with mental wellness. It's an enhancement feature that adds platform value but isn't core to fitness tracking.

**Independent Test**: Start a meditation session, complete it, verify timer functionality, session logging, streak tracking, and progress statistics.

**Acceptance Scenarios**:

1. **Given** a user, **When** they browse the meditation library, **Then** exercises are categorised by type (breathing, body scan, guided visualisation, unguided) and duration (5/10/15/20/30 min)
2. **Given** a user starting a meditation session, **When** they select an exercise and begin, **Then** a timer displays with optional ambient sounds and completion percentage
3. **Given** a user completing a session, **When** the timer ends, **Then** the session is logged with duration, type, and optional mood rating (before and after)
4. **Given** a user with meditation history, **When** they view their mindfulness dashboard, **Then** total sessions, total minutes, current streak, and mood trend charts are displayed
5. **Given** a user, **When** they set a daily meditation reminder, **Then** they receive a notification at the configured time encouraging them to meditate

**Enhancement**: Integration with wearable heart rate data to show physiological response during meditation (heart rate variability, resting heart rate trend).

---

## Data Model

### Core Entities

```typescript
interface Workout {
  id: string;
  userId: string;
  title: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  startTime: string;         // ISO 8601
  endTime: string;           // ISO 8601
  durationMinutes: number;
  caloriesBurned: number | null;  // AI-estimated or manual
  calorieSource: 'ai' | 'manual' | 'device';
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  notes: string | null;
  sourceDevice: string | null;  // e.g., 'apple_watch', 'fitbit', 'manual'
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

interface WorkoutExercise {
  id: string;
  workoutId: string;
  name: string;
  sets: ExerciseSet[];
  orderIndex: number;
}

interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;        // kg
  durationSeconds: number | null;
  distanceMetres: number | null;
  notes: string | null;
}

interface FoodEntry {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string | null;
  calories: number;
  protein: number;    // grams
  carbs: number;      // grams
  fat: number;        // grams
  fibre: number | null;
  portionSize: string | null;
  isFavourite: boolean;
  source: 'manual' | 'ai' | 'database';
  loggedAt: string;   // ISO 8601
  createdAt: string;
  updatedAt: string;
}

interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;
  weight: number | null;        // kg
  bodyFatPercentage: number | null;
  chest: number | null;         // cm
  waist: number | null;
  hips: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  leftCalf: number | null;
  rightCalf: number | null;
  neck: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FitnessGoal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'endurance' | 'strength' | 'habit' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string;                 // 'kg', 'reps', 'minutes', 'days', etc.
  startDate: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'expired' | 'archived';
  progressPercentage: number;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetPercentage: number;     // 25, 50, 75, 100
  achievedAt: string | null;
}

interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: 'health' | 'fitness' | 'productivity' | 'learning' | 'financial' | 'social' | 'custom';
  colour: string;               // Hex colour for the contribution grid
  icon: string | null;          // Lucide icon name
  frequency: 'daily' | 'weekly' | 'custom';
  targetPerWeek: number | null; // e.g., 3 for "3 times a week"
  customDays: number[] | null;  // [1,3,5] for Mon/Wed/Fri (ISO weekday)
  linkedTaskGroupId: string | null; // Optional link to task manager (creates tasks on habit days)
  linkedEventPattern: string | null; // Optional event title pattern — completing matching events marks habit complete
  linkedEventIds: string[];     // Explicit calendar event IDs that auto-complete this habit when marked done
  autoCompleteSource: 'task' | 'event' | 'both' | null; // Which sources trigger automatic completion
  isArchived: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  createdAt: string;
  updatedAt: string;
}

interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;                 // YYYY-MM-DD
  notes: string | null;
  createdAt: string;
}

interface MeditationSession {
  id: string;
  userId: string;
  type: 'breathing' | 'body_scan' | 'guided' | 'unguided';
  durationMinutes: number;
  moodBefore: number | null;    // 1-5
  moodAfter: number | null;     // 1-5
  notes: string | null;
  completedAt: string;
  createdAt: string;
}

interface DeviceConnection {
  id: string;
  userId: string;
  provider: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'strava';
  accessToken: string;          // Encrypted
  refreshToken: string | null;  // Encrypted
  expiresAt: string | null;
  syncInterval: 'realtime' | '15min' | 'hourly' | 'daily';
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### Workout Endpoints
```
POST   /api/v1/fitness/workouts              Create workout
GET    /api/v1/fitness/workouts              List workouts (paginated, filtered)
GET    /api/v1/fitness/workouts/:id          Get workout detail
PUT    /api/v1/fitness/workouts/:id          Update workout
DELETE /api/v1/fitness/workouts/:id          Delete workout
POST   /api/v1/fitness/workouts/estimate     AI calorie estimation
```

### Food Tracking Endpoints
```
POST   /api/v1/fitness/food                  Log food entry
GET    /api/v1/fitness/food                  List food entries (date-filtered)
GET    /api/v1/fitness/food/:id             Get food entry detail
PUT    /api/v1/fitness/food/:id             Update food entry
DELETE /api/v1/fitness/food/:id             Delete food entry
POST   /api/v1/fitness/food/estimate         AI macro estimation
GET    /api/v1/fitness/food/search           Search food database
GET    /api/v1/fitness/food/favourites       List favourite foods
POST   /api/v1/fitness/food/:id/favourite    Toggle favourite
GET    /api/v1/fitness/food/daily-summary    Daily nutrition summary
```

### Body Measurements Endpoints
```
POST   /api/v1/fitness/measurements          Log measurements
GET    /api/v1/fitness/measurements          List measurements (paginated)
GET    /api/v1/fitness/measurements/latest   Get latest measurements
GET    /api/v1/fitness/measurements/trends   Get measurement trends
```

### Goals Endpoints
```
POST   /api/v1/fitness/goals                 Create goal
GET    /api/v1/fitness/goals                 List goals (filtered by status)
GET    /api/v1/fitness/goals/:id             Get goal detail with milestones
PUT    /api/v1/fitness/goals/:id             Update goal
PATCH  /api/v1/fitness/goals/:id/archive     Archive goal
DELETE /api/v1/fitness/goals/:id             Delete goal
```

### Habit Endpoints
```
POST   /api/v1/fitness/habits                          Create habit
GET    /api/v1/fitness/habits                          List habits (active/archived, filterable by category)
GET    /api/v1/fitness/habits/:id                      Get habit with completions
PUT    /api/v1/fitness/habits/:id                      Update habit
PATCH  /api/v1/fitness/habits/:id/archive              Archive/unarchive habit
DELETE /api/v1/fitness/habits/:id                      Delete habit
POST   /api/v1/fitness/habits/:id/complete             Mark habit complete for date
DELETE /api/v1/fitness/habits/:id/complete             Remove completion for date
GET    /api/v1/fitness/habits/:id/grid                 Get contribution grid data (12 months)
GET    /api/v1/fitness/habits/:id/stats                Get habit statistics
POST   /api/v1/fitness/habits/:id/link-event           Link habit to a calendar event ID or title pattern
DELETE /api/v1/fitness/habits/:id/link-event/:eventId  Remove a specific event link
GET    /api/v1/fitness/habits/categories               List all category values with completion counts
```

#### Internal Event Bus Endpoints (consumed by Fitness service, not directly exposed)
```
SUBSCRIBE  events/task.completed     → auto-complete linked habit for that day
SUBSCRIBE  events/event.completed    → auto-complete pattern/linked habit for that day
PUBLISH    events/habit.completed    → notify other services when habit is marked done
```

### Meditation Endpoints
```
POST   /api/v1/fitness/meditation            Log meditation session
GET    /api/v1/fitness/meditation            List sessions (paginated)
GET    /api/v1/fitness/meditation/stats      Get meditation statistics
GET    /api/v1/fitness/meditation/library    Browse exercise library
```

### Device Connection Endpoints
```
GET    /api/v1/fitness/devices               List connected devices
POST   /api/v1/fitness/devices/connect       Initiate OAuth connection
POST   /api/v1/fitness/devices/callback      OAuth callback handler
DELETE /api/v1/fitness/devices/:id           Disconnect device
POST   /api/v1/fitness/devices/:id/sync      Trigger manual sync
```

### Dashboard & Statistics Endpoints
```
GET    /api/v1/fitness/dashboard             Get fitness dashboard data
GET    /api/v1/fitness/statistics/weekly      Weekly fitness summary
GET    /api/v1/fitness/statistics/monthly     Monthly fitness summary
```

## Technical Considerations

### AI Integration
- **Calorie Estimation**: Use OpenAI GPT-4 or similar LLM API for natural language food/exercise parsing
- **Fallback Database**: Maintain a local nutritional database (e.g., USDA FoodData Central) for common foods
- **Rate Limiting**: Limit AI API calls per user to control costs
- **Caching**: Cache AI responses for identical food descriptions to reduce API calls

### Wearable Integration
- Use OAuth 2.0 for all device connections
- Store tokens encrypted at rest (AES-256)
- Implement retry logic with exponential backoff for API failures
- Background sync service using a job scheduler (Hangfire for .NET)

### Performance
- Pagination for all list endpoints (default 20, max 100)
- Database indexing on userId, date fields, and foreign keys
- Contribution grid data should be pre-aggregated for fast rendering
- Consider Redis caching for frequently accessed dashboard data

### Privacy & Security
- All health data is personal and sensitive — apply strict access controls
- No health data sharing without explicit user consent
- GDPR-compliant data export and deletion
- Audit logging for all data access

---

## Module: Fasting Tracker

### Overview

A dedicated fasting timer and scheduling module within the Fitness Application. It tracks active and historical fasts, displays real-time body-state awareness through fasting stages, manages hydration, and provides coaching nudges. It is tightly integrated with the Nutrition & Macro Tracker below.

---

### User Story 10 — Fasting Timer & Scheduling (Priority: P1)

Users can start, stop, and schedule fasting windows using popular protocols, with real-time countdown and streak tracking.

**Acceptance Scenarios**:

1. **Given** a user, **When** they start a fast with one tap, **Then** a timer begins counting up from zero with the current elapsed time shown prominently
2. **Given** a user selecting a fasting protocol (16:8, 18:6, 20:4, 5:2, OMAD, or custom), **When** the protocol is active, **Then** the timer shows time remaining within the fasting window and time remaining in the eating window
3. **Given** a user ending a fast, **When** they tap "Break Fast", **Then** the fast is recorded (start time, end time, duration, protocol), the eating window begins, and an optional break-fast meal suggestion is offered from the Recipe Collection
4. **Given** a user wanting to plan their week, **When** they open the fasting schedule planner, **Then** they can assign fasting protocols to specific days of the week, with awareness of busy days or social events
5. **Given** a user viewing their fasting history, **When** they open the stats view, **Then** they see: current streak, longest streak, total hours fasted (daily / weekly / monthly), and a calendar heat map of fasting days

---

### User Story 11 — Fasting Stages — Body State Awareness (Priority: P1)

Users see a real-time display of their current fasting stage with plain-language descriptions of what is happening in the body.

**Acceptance Scenarios**:

1. **Given** an active fast, **When** the user views the fasting screen, **Then** the current stage is displayed with a name, elapsed-time range, and a plain-English description of what the body is doing at this stage
2. **Given** the user transitioning from one stage to another, **When** the threshold is crossed, **Then** a notification is sent: "You've entered ketosis — fat burning is now your primary fuel source"
3. **Given** a visual progress arc or timeline, **When** displayed, **Then** it shows all stages on a timeline with the current position marked clearly

#### Fasting Stages Reference

| Stage | Time Range | Body State |
|---|---|---|
| Fed state / digestion | 0–4 hrs | Digestion active, blood glucose elevated |
| Post-absorptive | 4–8 hrs | Blood glucose stabilising, liver glycogen in use |
| Early fasting | 8–12 hrs | Glycogen depletion begins, gluconeogenesis starts |
| Ketosis begins | 12–18 hrs | Ketone bodies rising, fat burning increasing |
| Deep ketosis | 18–24 hrs | Significant ketosis, autophagy begins |
| Enhanced autophagy | 24+ hrs | Cellular repair and recycling accelerating |

---

### User Story 12 — Hydration Tracker (Priority: P2)

Users can track daily water intake against a configurable goal, with regular reminders during fasting windows.

**Acceptance Scenarios**:

1. **Given** a user, **When** they log a water intake (ml or cups), **Then** the daily total updates and a visual progress indicator shows progress towards their daily goal
2. **Given** a user with a daily water goal set, **When** the goal is reached, **Then** a congratulatory notification is sent
3. **Given** an active fast, **When** hydration reminders are enabled, **Then** notifications are sent at configurable intervals (e.g., every 2 hours) prompting the user to drink water
4. **Given** the daily hydration view, **When** displayed, **Then** intake events are shown on a timeline alongside the fasting window for context

---

### Data Model Additions — Fasting Tracker

```typescript
interface FastingSession {
  id: string;
  userId: string;
  protocol: '16_8' | '18_6' | '20_4' | '5_2' | 'omad' | 'custom';
  targetFastingHours: number;
  startedAt: string;           // ISO 8601
  endedAt: string | null;      // null while fast is active
  actualDurationMinutes: number | null;
  completedTarget: boolean;
  notes: string | null;
  createdAt: string;
}

interface FastingSchedule {
  id: string;
  userId: string;
  dayOfWeek: number;           // 1 = Monday … 7 = Sunday
  protocol: string;
  targetFastingHours: number;
  isActive: boolean;
}

interface HydrationEntry {
  id: string;
  userId: string;
  amountMl: number;
  loggedAt: string;
}

interface HydrationGoal {
  userId: string;
  dailyTargetMl: number;
  reminderIntervalMinutes: number | null;
}
```

### API Endpoints — Fasting

```
POST   /api/v1/fitness/fasting/sessions/start   Start a fast
POST   /api/v1/fitness/fasting/sessions/end     End the current fast
GET    /api/v1/fitness/fasting/sessions         List fasting history
GET    /api/v1/fitness/fasting/sessions/current Get active fast (null if none)
GET    /api/v1/fitness/fasting/stats            Fasting statistics (streaks, totals, calendar)
GET    /api/v1/fitness/fasting/schedules        Get weekly fasting schedule
PUT    /api/v1/fitness/fasting/schedules        Update weekly fasting schedule

POST   /api/v1/fitness/hydration                Log water intake
GET    /api/v1/fitness/hydration/today          Today's hydration summary
GET    /api/v1/fitness/hydration/goals          Get hydration goal
PUT    /api/v1/fitness/hydration/goals          Update hydration goal
```

---

## Module: Nutrition & Macro Tracker (Enhanced)

### Overview

A full food and nutrition tracking module. The existing User Story 3 (Food Tracking & Macro Estimation) is the foundation; this section adds the detailed feature set specified from real-world reference apps (MyFitnessPal, Cronometer, Nutracheck) with a UK-first food database and barcode scanning.

---

### User Story 13 — Food Database & Barcode Scanning (Priority: P1)

Users can log food by searching a large UK-focused food database or scanning a product barcode, with portion size adjustment and favourite foods for quick re-logging.

**Acceptance Scenarios**:

1. **Given** a user logging food, **When** they search by name, **Then** UK-branded products, supermarket own-brands, and common foods appear with auto-complete
2. **Given** a user with a packaged food product, **When** they scan the barcode, **Then** the food is looked up via Open Food Facts and nutritional data pre-populates
3. **Given** a food item, **When** the user selects it, **Then** they can adjust portion size in: grams, ml, cups, pieces, or defined serving sizes — and see macros update in real time
4. **Given** a food the user logs regularly, **When** they mark it as a favourite, **Then** it appears at the top of the food search for fast re-logging
5. **Given** a food not in the database, **When** the user adds it manually, **Then** they can enter name, serving size, and all macro values — saved as a custom food for future use
6. **Given** a user in a hurry, **When** they use the quick-add option, **Then** they can log calories only without full macro breakdown

---

### User Story 14 — Personalised Macro Targets (Priority: P1)

Users can set personalised macro targets based on their goals, body stats, and dietary preferences, with TDEE auto-calculation.

**Acceptance Scenarios**:

1. **Given** a user completing the nutrition onboarding, **When** they provide: current weight, goal weight, height, age, activity level, and goal type, **Then** TDEE (Total Daily Energy Expenditure) and macro split are calculated using the Mifflin-St Jeor equation
2. **Given** calculated targets, **When** the user views them, **Then** they can accept the auto-calculated values or override any macro target manually
3. **Given** a user on a fasting protocol, **When** macro targets are displayed, **Then** targets are noted as applying to the eating window — not the full 24-hour period
4. **Given** dietary preferences set (standard / low-carb / keto / high-protein / vegetarian / vegan), **When** targets are calculated, **Then** the macro split reflects the chosen dietary style
5. **Given** a change in goal weight or activity level, **When** the user updates their profile, **Then** macro targets are recalculated and the user is notified of the change

---

### User Story 15 — Daily Macro Dashboard (Priority: P1)

Users see a real-time summary of macros consumed vs targets for the current day, with per-meal breakdown.

**Acceptance Scenarios**:

1. **Given** food logged for the day, **When** the user views the nutrition dashboard, **Then** they see: calories consumed vs target, protein / carbs / fat as both grams and percentage of target — displayed as a ring or bar chart
2. **Given** remaining macros, **When** displayed, **Then** the dashboard shows: "You have Xg protein / Xcal remaining today"
3. **Given** per-meal logging, **When** the user views the daily log, **Then** macros are broken down by meal: breakfast, lunch, dinner, snacks — with per-meal subtotals
4. **Given** weekly macro tracking, **When** the user views the weekly summary, **Then** daily averages are shown to smooth day-to-day variation

---

### User Story 16 — AI Nutrition Insights (Priority: P3)

The system generates personalised coaching insights by analysing nutrition patterns, fasting data, and body composition trends.

**Acceptance Scenarios**:

1. **Given** a good nutrition day, **When** the daily summary runs, **Then** a positive coaching message is generated: "Good day — you hit your protein target and stayed under calories"
2. **Given** a detectable pattern, **When** the AI identifies one, **Then** an insight is generated: "You consistently under-eat protein on days you fast past 18 hours"
3. **Given** a fast ending, **When** the eating window begins, **Then** an AI-suggested break-fast meal is offered based on: fast duration, remaining macros, and available recipes from the Recipe Collection
4. **Given** a potential nutritional deficiency, **When** detected from food logs, **Then** a coach alert is shown: "You haven't logged a good source of Vitamin D this week"
5. **Given** fasting and nutrition data in combination, **When** the AI analyses both, **Then** a correlation insight is generated: "Your best fasting days nutritionally follow a high-protein dinner the night before"

**UX Note**: All AI insights must use **positive, coaching framing** — never judgemental. The tone should feel like an informed friend, not a calorie auditor.

---

### Data Model Additions — Nutrition Module

```typescript
interface MacroTarget {
  userId: string;
  dailyCalories: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  dailyFibreG: number | null;
  dietaryPreference: 'standard' | 'low_carb' | 'keto' | 'high_protein' | 'vegetarian' | 'vegan';
  tdee: number;                    // Total Daily Energy Expenditure
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | 'general_health';
  updatedAt: string;
}

// FoodEntry (existing, extending)
interface FoodEntry {
  // ... existing fields ...
  barcodeScanned: boolean;
  openFoodFactsId: string | null;  // For barcode-sourced entries
  fastingSessionId: string | null; // Links food entry to the eating window it was consumed in
}
```

### API Endpoints — Nutrition (Additions)

```
GET    /api/v1/fitness/nutrition/targets          Get macro targets
PUT    /api/v1/fitness/nutrition/targets          Update macro targets
POST   /api/v1/fitness/nutrition/targets/calculate  Auto-calculate from body stats
GET    /api/v1/fitness/nutrition/weekly-summary   Weekly macro averages and adherence rate
GET    /api/v1/fitness/food/barcode/:barcode      Look up food by EAN barcode
GET    /api/v1/fitness/nutrition/insights         AI-generated nutrition insights
```

---

## MCP Tools — `fitness_*` Namespace (Nutrition Extension)

| Tool | Description |
|---|---|
| `fitness_get_active_fast` | Return the current fasting session including elapsed time and current fasting stage |
| `fitness_get_fasting_stats` | Return fasting statistics (streak, total hours, history) |
| `fitness_get_nutrition_log` | Get food log entries for a given date or range |
| `fitness_get_macro_summary` | Get daily macro totals vs targets for a date |
| `fitness_get_weekly_nutrition` | Weekly nutrition averages and adherence |
| `fitness_log_food` | Add a food entry to today's log |
| `fitness_get_macro_targets` | Return current personalised macro targets |
| `fitness_get_nutrition_insights` | Return AI-generated nutrition and fasting insights |
| `fitness_get_meal_plan` | Return planned meals for a date (from Recipe Collection) |
| `fitness_suggest_meals` | Suggest meals based on remaining macros, available pantry stock, and fasting context |
| `fitness_get_hydration` | Return today's hydration log and progress vs goal |

---

## Reference Apps (Fasting & Nutrition)

| App | What to Learn From |
|---|---|
| BodyFast | Fasting timer UX, stage visualisation, coaching tone |
| MyFitnessPal | Food database scale, barcode scanning, macro ring UI |
| Cronometer | Micronutrient depth, nutritional accuracy |
| Nutracheck | UK-specific food database — very strong for branded products |
| Lose It! | Clean macro UI, meal planning UX |
