# Tasks: Fitness Application

**Input**: `specs/applications/fitness/spec.md`  
**Prerequisites**: Authentication Service, Microservices Architecture  
**Continues from**: T799 (To Do App tasks)

**Organisation**: Tasks grouped by phase and user story for independent implementation.

**Technology Stack**:
- **Backend**: .NET Core 8.0 Web API with C#, Entity Framework Core, PostgreSQL
- **Frontend**: React 18 with TypeScript, Vite
- **Architecture**: Fitness microservice with own database

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 14: Fitness Foundation — Workout Tracking (Priority: P1)

**Purpose**: Core workout logging, exercise tracking, and AI calorie estimation  
**Estimated Effort**: 2 weeks (20 tasks)  
**Dependencies**: Auth service issuing JWTs, API gateway routing `/api/v1/fitness/*`

### Backend: Workout Entities & API (Week 1, Days 1-3)

- [ ] T800 [P] [US1] Create Fitness microservice project (`apps/fitness-api/FitnessApi.csproj`) with EF Core, PostgreSQL - 4h
- [ ] T801 [P] [US1] Define Workout, WorkoutExercise, ExerciseSet entities in `apps/fitness-api/Data/Entities/` - 3h
- [ ] T802 [US1] Create FitnessDbContext with Workout, Exercise, Set DbSets in `apps/fitness-api/Data/` - 2h
- [ ] T803 [US1] Create initial EF Core migration for Workout tables - 1h
- [ ] T804 [US1] Implement WorkoutService with CRUD operations in `apps/fitness-api/Features/Workouts/Services/` - 4h
- [ ] T805 [US1] Implement WorkoutsController (POST, GET, GET/:id, PUT, DELETE) in `apps/fitness-api/Features/Workouts/Controllers/` - 3h
- [ ] T806 [US1] Create workout DTOs (CreateWorkoutRequest, WorkoutResponse, WorkoutSummary) in `apps/fitness-api/Features/Workouts/DTOs/` - 2h
- [ ] T807 [US1] Implement AI calorie estimation endpoint (POST `/estimate`) using OpenAI integration - 4h
- [ ] T808 [US1] Write unit tests for WorkoutService (15+ tests) - 3h
- [ ] T809 [US1] Write integration tests for WorkoutsController (10+ tests) - 3h

### Frontend: Workout UI (Week 1, Days 4-5 → Week 2, Day 1)

- [ ] T810 [P] [US1] Create Workout TypeScript interfaces in `apps/web/src/types/fitness.ts` - 1h
- [ ] T811 [P] [US1] Create workoutService API methods in `apps/web/src/services/workoutService.ts` - 2h
- [ ] T812 [US1] Create WorkoutForm component (exercise type, duration, intensity, exercises/sets) - 6h
- [ ] T813 [US1] Create WorkoutHistory component with filtering and sorting - 4h
- [ ] T814 [US1] Create WorkoutDetail component (view workout with exercises/sets breakdown) - 3h
- [ ] T815 [US1] Create FitnessPage layout with tabs (Workouts, Food, Body, Habits, Meditation) - 3h
- [ ] T816 [US1] Add `/fitness` route and navigation menu entry - 1h
- [ ] T817 [US1] Write Jest tests for WorkoutForm and WorkoutHistory components (10+ tests) - 3h
- [ ] T818 [US1] Write E2E test for workout creation and viewing flow - 3h

### Docker & Infrastructure

- [ ] T819 [P] [US1] Add fitness-api service to docker-compose.yml with its own PostgreSQL database - 2h

**Checkpoint**: Users can create, view, edit, and delete workouts with AI calorie estimation

---

## Phase 15: Food Tracking & Nutrition (Priority: P1)

**Purpose**: Meal logging with AI macro estimation and daily nutrition summaries  
**Estimated Effort**: 1.5 weeks (17 tasks)  
**Dependencies**: Phase 14 complete

### Backend: Food Tracking API (Week 1, Days 1-3)

- [ ] T820 [P] [US3] Define FoodEntry entity in `apps/fitness-api/Data/Entities/FoodEntry.cs` - 2h
- [ ] T821 [US3] Create EF Core migration for FoodEntry table - 1h
- [ ] T822 [US3] Implement FoodService with CRUD, daily summary, and favourites in `apps/fitness-api/Features/Food/Services/` - 4h
- [ ] T823 [US3] Implement FoodController (POST, GET, PUT, DELETE, search, favourites, daily-summary) - 3h
- [ ] T824 [US3] Create food DTOs (CreateFoodRequest, FoodResponse, DailyNutritionSummary) - 2h
- [ ] T825 [US3] Implement AI macro estimation endpoint using OpenAI for natural language food parsing - 4h
- [ ] T826 [P] [US3] Create seed data for common foods database (nutritional database fallback) - 3h
- [ ] T827 [US3] Write unit tests for FoodService (12+ tests) - 3h
- [ ] T828 [US3] Write integration tests for FoodController (10+ tests) - 3h

### Frontend: Food Tracking UI (Week 1, Days 4-5)

- [ ] T829 [P] [US3] Create FoodEntry TypeScript interfaces in `apps/web/src/types/fitness.ts` - 1h
- [ ] T830 [P] [US3] Create foodService API methods in `apps/web/src/services/foodService.ts` - 2h
- [ ] T831 [US3] Create FoodLogForm component (meal type, description, AI estimation trigger) - 5h
- [ ] T832 [US3] Create DailyNutrition component (calorie/macro progress bars, meal breakdown) - 4h
- [ ] T833 [US3] Create FoodSearch component with autocomplete from food database - 3h
- [ ] T834 [US3] Write Jest tests for FoodLogForm and DailyNutrition (8+ tests) - 2h
- [ ] T835 [US3] Write E2E test for food logging and daily summary viewing - 3h
- [ ] T836 [US3] Add Food tab content to FitnessPage - 1h

**Checkpoint**: Users can log meals, get AI macro estimates, view daily nutrition summaries

---

## Phase 16: Body Measurements & Goals (Priority: P2)

**Purpose**: Weight/body tracking, fitness goals with progress and milestones  
**Estimated Effort**: 1.5 weeks (18 tasks)  
**Dependencies**: Phase 14 complete

### Backend: Measurements & Goals API (Week 1, Days 1-3)

- [ ] T837 [P] [US4] Define BodyMeasurement entity in `apps/fitness-api/Data/Entities/` - 2h
- [ ] T838 [P] [US5] Define FitnessGoal and GoalMilestone entities in `apps/fitness-api/Data/Entities/` - 2h
- [ ] T839 [US4/US5] Create EF Core migration for BodyMeasurement, FitnessGoal, GoalMilestone tables - 1h
- [ ] T840 [US4] Implement MeasurementService with CRUD, trends, and statistics - 4h
- [ ] T841 [US4] Implement MeasurementsController (POST, GET, latest, trends) - 3h
- [ ] T842 [US5] Implement GoalService with CRUD, progress calculation, milestone tracking - 4h
- [ ] T843 [US5] Implement GoalsController (POST, GET, PUT, archive, DELETE) - 3h
- [ ] T844 [US4] Write unit tests for MeasurementService (10+ tests) - 2h
- [ ] T845 [US5] Write unit tests for GoalService (12+ tests) - 3h
- [ ] T846 [US4/US5] Write integration tests for Measurements and Goals controllers - 3h

### Frontend: Measurements & Goals UI (Week 1, Days 4-5)

- [ ] T847 [P] [US4/US5] Create BodyMeasurement, FitnessGoal TypeScript interfaces - 1h
- [ ] T848 [P] [US4] Create measurementService API methods - 1h
- [ ] T849 [P] [US5] Create goalService API methods - 1h
- [ ] T850 [US4] Create BodyTracker component (weight chart, measurement log form, trend line) - 5h
- [ ] T851 [US5] Create GoalsDashboard component (goal cards with progress bars, milestones) - 5h
- [ ] T852 [US5] Create GoalForm component (create/edit goal with target, deadline, type) - 3h
- [ ] T853 [US4/US5] Write Jest tests for BodyTracker and GoalsDashboard (10+ tests) - 3h
- [ ] T854 [US4/US5] Write E2E test for body tracking and goal creation flow - 3h

**Checkpoint**: Users can track weight/measurements, set goals, and view progress charts

---

## Phase 17: Habit Tracking (Priority: P2)

**Purpose**: GitHub-style habit contribution grid, streaks, task manager linking  
**Estimated Effort**: 2 weeks (20 tasks)  
**Dependencies**: Phase 14 complete

### Backend: Habit API (Week 1, Days 1-3)

- [ ] T855 [P] [US8] Define Habit and HabitCompletion entities in `apps/fitness-api/Data/Entities/` - 2h
- [ ] T856 [US8] Create EF Core migration for Habit and HabitCompletion tables - 1h
- [ ] T857 [US8] Implement HabitService with CRUD, completion tracking, streak calculation, grid data generation - 6h
- [ ] T858 [US8] Implement HabitsController (CRUD, complete, uncomplete, grid, stats, archive) - 4h
- [ ] T859 [US8] Create habit DTOs (CreateHabitRequest, HabitResponse, HabitGridData, HabitStats) - 2h
- [ ] T860 [US8] Implement streak calculation algorithm (current streak, longest streak, reset logic) - 3h
- [ ] T861 [US8] Implement contribution grid data endpoint (12-month aggregation, daily completion counts) - 3h
- [ ] T862 [US8] Write unit tests for HabitService including streak calculations (15+ tests) - 3h
- [ ] T863 [US8] Write integration tests for HabitsController (12+ tests) - 3h

### Frontend: Habit Tracking UI (Week 1, Days 4-5 → Week 2, Day 2)

- [ ] T864 [P] [US8] Create Habit TypeScript interfaces in `apps/web/src/types/fitness.ts` - 1h
- [ ] T865 [P] [US8] Create habitService API methods in `apps/web/src/services/habitService.ts` - 2h
- [ ] T866 [US8] Create ContributionGrid component (GitHub-style SVG grid with colour intensity) - 6h
- [ ] T867 [US8] Create HabitCard component (mini grid, streak counter, progress bar, custom colour) - 4h
- [ ] T868 [US8] Create HabitsDashboard component (grid layout of HabitCards, add/archive) - 3h
- [ ] T869 [US8] Create HabitForm component (name, colour picker, frequency, target, icon selection) - 3h
- [ ] T870 [US8] Create HabitDetailView component (full contribution grid, statistics, history) - 4h
- [ ] T871 [US8] Implement task manager linking (create tasks on habit days via event bus) - 3h
- [ ] T872 [US8] Write Jest tests for ContributionGrid, HabitCard, HabitsDashboard (12+ tests) - 3h
- [ ] T873 [US8] Write E2E test for habit creation, completion, and grid visualisation - 3h
- [ ] T874 [US8] Add Habits tab content to FitnessPage - 1h

**Checkpoint**: Users can create colour-themed habits, complete them daily, view GitHub-style grids, track streaks

---

## Phase 18: Meditation & Mindfulness (Priority: P4)

**Purpose**: Guided meditation, session logging, mindfulness statistics  
**Estimated Effort**: 1 week (12 tasks)  
**Dependencies**: Phase 14 complete

### Backend: Meditation API (Days 1-2)

- [ ] T875 [P] [US9] Define MeditationSession entity in `apps/fitness-api/Data/Entities/` - 1h
- [ ] T876 [US9] Create EF Core migration for MeditationSession table - 1h
- [ ] T877 [US9] Implement MeditationService with session logging, statistics, and streak tracking - 3h
- [ ] T878 [US9] Implement MeditationController (POST, GET, stats, library) - 3h
- [ ] T879 [US9] Create meditation exercise library seed data (breathing, body scan, guided, unguided) - 2h
- [ ] T880 [US9] Write unit tests for MeditationService (8+ tests) - 2h
- [ ] T881 [US9] Write integration tests for MeditationController (6+ tests) - 2h

### Frontend: Meditation UI (Days 3-5)

- [ ] T882 [P] [US9] Create MeditationSession TypeScript interfaces - 1h
- [ ] T883 [P] [US9] Create meditationService API methods - 1h
- [ ] T884 [US9] Create MeditationTimer component (countdown, ambient sounds, mood rating) - 5h
- [ ] T885 [US9] Create MeditationDashboard component (total sessions, minutes, streak, mood trends) - 4h
- [ ] T886 [US9] Write Jest tests for MeditationTimer and MeditationDashboard (6+ tests) - 2h

**Checkpoint**: Users can meditate with timer, log sessions, view mindfulness statistics

---

## Phase 19: Wearable Integration (Priority: P2)

**Purpose**: Import data from smartwatches and fitness trackers  
**Estimated Effort**: 2 weeks (14 tasks)  
**Dependencies**: Phase 14 complete

### Backend: Device Connection API (Week 1)

- [ ] T887 [P] [US2] Define DeviceConnection entity in `apps/fitness-api/Data/Entities/` - 2h
- [ ] T888 [US2] Create EF Core migration for DeviceConnection table - 1h
- [ ] T889 [US2] Implement DeviceConnectionService (OAuth flow, token storage, connection management) - 6h
- [ ] T890 [US2] Implement Fitbit provider adapter (OAuth 2.0, data sync) - 4h
- [ ] T891 [US2] Implement Strava provider adapter (OAuth 2.0, activity import) - 4h
- [ ] T892 [US2] Implement Google Fit provider adapter (REST API, data sync) - 4h
- [ ] T893 [US2] Implement DevicesController (connect, callback, disconnect, sync) - 3h
- [ ] T894 [US2] Implement background sync service using Hangfire for scheduled data imports - 4h
- [ ] T895 [US2] Implement duplicate detection for imported vs manual workout data - 3h
- [ ] T896 [US2] Write unit tests for DeviceConnectionService (10+ tests) - 3h
- [ ] T897 [US2] Write integration tests for DevicesController and provider adapters (8+ tests) - 3h

### Frontend: Device Connection UI (Week 2, Days 1-3)

- [ ] T898 [P] [US2] Create DeviceConnection TypeScript interfaces - 1h
- [ ] T899 [US2] Create ConnectedDevices settings page (connect/disconnect, sync status) - 4h
- [ ] T900 [US2] Write E2E test for device connection OAuth flow (mocked provider) - 3h

**Checkpoint**: Users can connect wearables and auto-import workout data

---

## Phase 20: Workout Planning & Social (Priority: P3-P4)

**Purpose**: Workout plan scheduling and social/motivation features  
**Estimated Effort**: 2 weeks (16 tasks)  
**Dependencies**: Phases 14, 16, 17 complete

### Backend: Workout Plans (Week 1)

- [ ] T901 [P] [US6] Define WorkoutPlan and PlanDay entities - 2h
- [ ] T902 [US6] Create EF Core migration for WorkoutPlan tables - 1h
- [ ] T903 [US6] Implement WorkoutPlanService with CRUD, scheduling, calendar integration - 4h
- [ ] T904 [US6] Implement WorkoutPlansController (CRUD, assign days, library) - 3h
- [ ] T905 [US6] Write unit and integration tests for workout plans (10+ tests) - 3h

### Backend: Social Features (Week 1, Days 4-5)

- [ ] T906 [P] [US7] Define FriendConnection, Challenge, Badge entities - 3h
- [ ] T907 [US7] Create EF Core migration for social tables - 1h
- [ ] T908 [US7] Implement SocialService (friend requests, challenges, leaderboards, badges) - 6h
- [ ] T909 [US7] Implement SocialController (friends, challenges, badges, activity feed) - 4h
- [ ] T910 [US7] Write unit and integration tests for social features (10+ tests) - 3h

### Frontend: Plans & Social UI (Week 2)

- [ ] T911 [US6] Create WorkoutPlanBuilder component (plan days, exercises, scheduling) - 5h
- [ ] T912 [US6] Integrate workout plans with platform calendar - 3h
- [ ] T913 [US7] Create SocialFeed component (activity feed, friend requests, challenges) - 5h
- [ ] T914 [US7] Create ChallengeDashboard component (leaderboard, progress, invitations) - 4h
- [ ] T915 [US6/US7] Write Jest tests for plan and social components (10+ tests) - 3h
- [ ] T916 [US6/US7] Write E2E tests for workout planning and challenge creation - 3h

**Checkpoint**: Users can create workout plans, schedule on calendar, connect with friends, participate in challenges

---

## Phase 21: Fitness Dashboard & Statistics (Priority: P2)

**Purpose**: Unified fitness dashboard aggregating all fitness data  
**Estimated Effort**: 1 week (8 tasks)  
**Dependencies**: Phases 14-17 complete

- [ ] T917 [US1-US9] Implement FitnessDashboardService aggregating workout, food, body, habit data - 4h
- [ ] T918 [US1-US9] Implement DashboardController (GET /dashboard, weekly/monthly stats) - 3h
- [ ] T919 [US1-US9] Create FitnessDashboard component (workout summary, nutrition, weight, habits overview) - 6h
- [ ] T920 [US1-US9] Create WeeklyFitnessSummary component (charts, trends, goal progress) - 4h
- [ ] T921 [US1-US9] Create fitness widget for platform Application Hub - 3h
- [ ] T922 [US1-US9] Write unit tests for dashboard aggregation service (8+ tests) - 2h
- [ ] T923 [US1-US9] Write Jest tests for dashboard components (6+ tests) - 2h
- [ ] T924 [US1-US9] Write E2E test for fitness dashboard end-to-end data flow - 3h

**Checkpoint**: Complete fitness dashboard with cross-feature data visualisation

---

## Summary

| Phase | Name | Priority | Tasks | Estimated Effort |
|-------|------|----------|-------|-----------------|
| 14 | Workout Tracking | P1 | T800-T819 (20) | 2 weeks |
| 15 | Food Tracking | P1 | T820-T836 (17) | 1.5 weeks |
| 16 | Body & Goals | P2 | T837-T854 (18) | 1.5 weeks |
| 17 | Habit Tracking | P2 | T855-T874 (20) | 2 weeks |
| 18 | Meditation | P4 | T875-T886 (12) | 1 week |
| 19 | Wearable Integration | P2 | T887-T900 (14) | 2 weeks |
| 20 | Plans & Social | P3-P4 | T901-T916 (16) | 2 weeks |
| 21 | Dashboard | P2 | T917-T924 (8) | 1 week |
| **Total** | | | **125 tasks** | **~13 weeks** |
