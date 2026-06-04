# Feature Specification: Recipe Collection

**Feature ID**: `013-recipe-collection`
**Created**: 2026-06-03
**Status**: Draft
**Priority**: P2
**Dependencies**: Authentication Service

## Overview

A standalone Recipe Collection module within the Life Manager platform that serves as the single source of truth for all saved recipes. It is not part of the Fitness Application — it sits at the Life Manager level and is consumed by other modules that need recipe data.

The Recipe Collection is both a **personal cookbook** and a **data layer** — recipes are human-readable structured data, but are also rich enough to be queried by the Nutrition Module for macro calculation, the Fasting Tracker for break-fast meal suggestions, and the Pantry & Ingredient Tracker for recipe matching and shopping list generation.

## Rationale

Home cooking sits at the intersection of health, finance, and daily life. Centralising recipe data in a dedicated module — rather than siloing it inside the Fitness app — means every other module (Pantry, Nutrition, Finance) can draw from it without duplication. The Recipe Collection is the hub; the other modules are consumers.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Recipe Storage & Capture (Priority: P1)

Users can save recipes from any source (URL, screenshot, manual entry, Claude-assisted creation) in a consistent, structured format.

**Why this priority**: Without a reliable data store of well-structured recipes, no other feature (macro calculation, recipe matching, meal planning) is possible.

**Independent Test**: Save recipes via multiple capture methods, verify consistent structure, confirm all required fields are present, and test that duplicate detection flags recipes with the same title.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a new recipe manually, **Then** it is saved with: title, course, cuisine, effort level, prep/cook time, dietary tags, ingredients (name + quantity + unit), method steps, and source attribution
2. **Given** a user pasting a recipe URL, **When** the system processes it (Phase 2), **Then** the recipe is parsed and auto-formatted into the standard structure with field confirmation before saving
3. **Given** a user saving a recipe, **When** they add ingredients, **Then** each ingredient records: name, quantity, unit (g / ml / items / tbsp etc.), and an optional note (e.g., "finely diced")
4. **Given** a saved recipe, **When** the user views it, **Then** all classification fields are visible: course, standalone flag, pairs-with suggestions, cuisine, diet tags, effort, difficulty, batch-friendly flag
5. **Given** two recipes with identical titles, **When** the user attempts to save the second, **Then** a warning is shown with the option to view the existing recipe or save anyway

---

### User Story 2 — Tagging & Classification (Priority: P1)

Users can tag recipes with a rich classification taxonomy covering course, dietary requirements, cuisine, effort, cooking method, season, and status.

**Why this priority**: Tags are the primary discovery mechanism. Without a consistent taxonomy, search and filtering are unreliable.

**Independent Test**: Tag a recipe with multiple categories, search by single and combined tags, verify results are accurate, and confirm that system tags and user-applied tags both work.

**Acceptance Scenarios**:

1. **Given** a user tagging a recipe, **When** they select tags, **Then** the full taxonomy is available: Course, Standalone, Diet, Cuisine, Effort, Season, Method, Status, and Nutrition Fit
2. **Given** a recipe with multiple tags, **When** a user filters by any single tag, **Then** all matching recipes are returned
3. **Given** a user filtering by multiple tags simultaneously (e.g., `#high-protein` AND `#quick-weeknight`), **Then** only recipes matching all selected tags are returned
4. **Given** a new recipe, **When** no status tag is applied, **Then** it defaults to `#to-try`
5. **Given** a recipe with a `#family-favourite` status, **When** viewed in the recipe list, **Then** it is visually distinguished (e.g., a star indicator)

#### Full Tag Taxonomy

| Category | Tags |
|---|---|
| **Course** | `#main-dish`, `#side-dish`, `#starter`, `#dessert`, `#snack`, `#breakfast`, `#brunch`, `#drink`, `#sauce-condiment`, `#baking` |
| **Standalone** | `#standalone`, `#pairs-with-protein`, `#pairs-with-carbs`, `#pairs-with-salad` |
| **Diet** | `#vegetarian`, `#vegan`, `#gluten-free`, `#dairy-free`, `#low-carb`, `#high-protein` |
| **Cuisine** | `#italian`, `#mediterranean`, `#british`, `#asian`, `#mexican`, `#american`, `#french`, `#middle-eastern`, `#indian`, `#fusion` |
| **Effort** | `#low-effort`, `#medium-effort`, `#high-effort`, `#make-ahead`, `#quick-weeknight`, `#weekend-cook`, `#batch-cook`, `#one-pan` |
| **Season** | `#summer`, `#winter`, `#all-seasons`, `#bbq`, `#comfort-food`, `#dinner-party`, `#family-meal` |
| **Method** | `#no-cook`, `#grilled`, `#roasted`, `#slow-cooked`, `#stir-fry`, `#baked`, `#raw` |
| **Status** | `#to-try`, `#tried`, `#family-favourite`, `#retired` |
| **Nutrition Fit** | `#fasting-friendly`, `#break-fast-meal`, `#high-protein`, `#low-calorie`, `#macro-friendly` |

---

### User Story 3 — Recipe Status & Rating (Priority: P2)

Users can track whether they have cooked a recipe, rate it, and add personal notes and tweaks.

**Why this priority**: Status and rating data differentiates a recipe wishlist from a living personal cookbook.

**Independent Test**: Mark a recipe as tried, add a star rating, add notes, then verify status appears in list view and the recipe is filterable by status.

**Acceptance Scenarios**:

1. **Given** a recipe with `#to-try` status, **When** the user marks it as cooked, **Then** the status updates to `#tried` and a prompt appears to add a rating and notes
2. **Given** a cooked recipe, **When** the user gives it 5 stars and marks it `#family-favourite`, **Then** it appears in the Family Favourites collection and is highlighted in all list views
3. **Given** a tried recipe, **When** the user adds personal notes (e.g., "add extra chilli, reduce oil quantity"), **Then** the notes are saved and displayed on the recipe detail page
4. **Given** a recipe the user dislikes, **When** they mark it `#retired`, **Then** it is hidden from default views but accessible via the "Retired" filter
5. **Given** a recipe with a rating, **When** the user views recipe statistics, **Then** average rating, number of times cooked, and date last cooked are displayed

---

### User Story 4 — Discovery & Filtering (Priority: P2)

Users can browse their recipe collection by any combination of tags and find recipes that match criteria such as effort level, dietary needs, or what needs using up.

**Why this priority**: A recipe collection is only useful if you can quickly find what you want. Discovery is the primary UX challenge.

**Independent Test**: Create 20+ recipes with varied tags, test single-tag filter, multi-tag AND filter, random suggestion, and verify result counts match expectations.

**Acceptance Scenarios**:

1. **Given** a user wanting a quick dinner, **When** they filter by `#quick-weeknight` + `#main-dish`, **Then** all matching recipes are shown sorted by effort (lowest first)
2. **Given** a user with dietary restrictions, **When** they apply a persistent dietary filter (e.g., `#gluten-free`), **Then** that filter persists across all browsing sessions
3. **Given** a user experiencing decision fatigue, **When** they tap "Surprise Me", **Then** a random recipe from their `#tried` or `#family-favourite` collection is suggested
4. **Given** a user browsing by cuisine, **When** they select `#italian`, **Then** all Italian recipes are shown grouped by course
5. **Given** a recipe collection, **When** a user searches by free-text (ingredient name or recipe title), **Then** results are returned and highlighted
6. **Given** a user filtering by macro fit (e.g., `#high-protein`), **Then** only recipes with that tag OR with calculated nutritional data meeting the threshold are returned

---

### User Story 5 — Nutritional Data Layer (Priority: P3)

Each recipe stores a calculated nutritional breakdown per serving, populated automatically when ingredients are linked to the food database via the Pantry & Ingredient Tracker.

**Why this priority**: Nutritional data unlocks integration with the Nutrition Module (macro planning) and the Pantry Tracker (macro-aware shopping). It is a data quality feature, not blocking core recipe use.

**Independent Test**: Enter a recipe with known ingredients, trigger nutritional calculation, verify the per-serving macro values match manual calculation, and confirm values update when a serving count is changed.

**Acceptance Scenarios**:

1. **Given** a recipe whose ingredients are linked to food database items with nutritional data, **When** the user triggers nutritional calculation, **Then** per-serving macros are calculated: calories, protein, carbohydrates, fat, fibre, sugar
2. **Given** calculated nutritional data, **When** the user adjusts serving count, **Then** per-serving macros update proportionally
3. **Given** a recipe with nutritional data, **When** the user views the meal planner, **Then** that recipe's macros contribute to the projected daily macro total
4. **Given** some ingredients lacking nutritional data, **When** the calculation runs, **Then** a partial estimate is shown with a note indicating which ingredients are missing data
5. **Given** a recipe with nutritional data, **When** a user filters by `#high-protein`, **Then** the recipe is automatically included if calculated protein per serving exceeds the threshold

---

### User Story 6 — Meal Planning (Priority: P3)

Users can plan meals for the week, assigning recipes to days and meal slots, with projected daily macro totals and fasting window awareness.

**Why this priority**: Meal planning transforms individual recipes into a structured weekly routine and is the primary consumer of recipe data for the shopping list.

**Independent Test**: Plan 5 days of meals across breakfast/lunch/dinner slots, verify macro projections update as meals are added, confirm shopping list generation uses the planned meals.

**Acceptance Scenarios**:

1. **Given** a user planning their week, **When** they open the meal planner, **Then** a 7-day grid is shown with slots for breakfast, lunch, dinner, and snacks
2. **Given** a meal planning slot, **When** the user searches for a recipe to assign, **Then** recipes are filterable by course, tags, and macro fit
3. **Given** a day with planned meals, **When** the user views the day's summary, **Then** projected macros (kcal, protein, carbs, fat) are shown as a total and vs daily targets
4. **Given** a weekly meal plan, **When** the user generates a shopping list, **Then** all required ingredients across all planned recipes are consolidated with quantities summed
5. **Given** a user with fasting schedule configured (Nutrition Module), **When** they plan meals, **Then** meal slots are labelled with the active eating window so meals land within fasting-permitted times
6. **Given** a successful week's meal plan, **When** the user saves it as a template, **Then** it can be reused in future weeks with one click

---

### User Story 7 — Shopping List Generation (Priority: P3)

Users can generate a consolidated, aisle-grouped shopping list from any recipe or set of recipes, with pantry deduction (what they already have is removed from the list).

**Why this priority**: Turning a meal plan into a shopping list is the end-to-end workflow that makes the recipe collection practically useful for weekly cooking.

**Independent Test**: Select 3 recipes with overlapping ingredients, generate a shopping list, verify quantities are consolidated, confirm pantry stock items are deducted, and test the "mark as bought" flow.

**Acceptance Scenarios**:

1. **Given** a user selecting multiple recipes, **When** they generate a shopping list, **Then** ingredients are combined across recipes and quantities are summed (e.g., 200g + 300g of chicken = 500g chicken)
2. **Given** a user with pantry stock configured, **When** the shopping list is generated, **Then** ingredients already in the pantry are deducted and only the deficit quantity appears on the list
3. **Given** a shopping list, **When** the user views it, **Then** items are grouped by supermarket aisle: Produce, Meat & Fish, Dairy & Eggs, Frozen, Tins & Jars, Bakery, Spices & Condiments
4. **Given** a shopping list, **When** the user checks off an item as bought, **Then** it is marked complete and (if pantry tracking is enabled) auto-added to pantry inventory
5. **Given** a completed shopping trip, **When** the user marks the list as done, **Then** all checked items are added to pantry inventory with today's purchase date
6. **Given** a shopping list, **When** the user shares it, **Then** a plain-text version is generated suitable for copying to a notes app or messaging

---

### User Story 8 — Collections & Cookbooks (Priority: P4)

Users can organise recipes into named collections (separate from tags) and benefit from auto-generated system collections.

**Why this priority**: Collections provide curation above and beyond raw tags — especially for social sharing and themed sets.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a named collection (e.g., "Summer BBQ", "Fasting Week Meals"), **Then** they can add any recipes to it regardless of their tags
2. **Given** a user, **When** they view system-generated collections, **Then** they see: "Your Highest Rated", "Most Cooked", "Haven't Tried Yet", "Family Favourites"
3. **Given** a collection, **When** the user exports it, **Then** a PDF or markdown file is produced with all recipe details formatted for sharing

---

## Recipe Standard — Data Structure

Every recipe stores the following fields:

```typescript
interface Recipe {
  id: string;
  userId: string;
  title: string;
  source: string | null;           // URL, book name, person, TV show
  serves: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];                  // From taxonomy above
  status: 'to-try' | 'tried' | 'family-favourite' | 'retired';
  rating: number | null;           // 1–5, null until first cook
  timesCooked: number;
  lastCookedAt: string | null;     // ISO 8601
  personalNotes: string | null;    // Post-cook tweaks
  ingredients: RecipeIngredient[];
  method: RecipeStep[];
  nutrition: RecipeNutrition | null;
  collectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;             // g, kg, ml, l, items, tbsp, tsp, cups
  note: string | null;             // "finely diced", "at room temperature"
  pantryItemId: string | null;     // Link to Pantry for matching & macro calculation
  orderIndex: number;
}

interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
}

interface RecipeNutrition {
  recipeId: string;
  caloriesPerServing: number;
  proteinPerServing: number;       // grams
  carbsPerServing: number;         // grams
  fatPerServing: number;           // grams
  fibrePerServing: number | null;  // grams
  sugarPerServing: number | null;  // grams
  isPartialEstimate: boolean;      // true if some ingredients lacked nutritional data
  calculatedAt: string;
}
```

---

## API Endpoints

```
POST   /api/v1/recipes                       Create recipe
GET    /api/v1/recipes                       List recipes (paginated, filtered, tag-searchable)
GET    /api/v1/recipes/:id                   Get recipe detail
PUT    /api/v1/recipes/:id                   Update recipe
DELETE /api/v1/recipes/:id                   Delete recipe
PATCH  /api/v1/recipes/:id/status            Update status & rating
GET    /api/v1/recipes/suggest               Random recipe suggestion
POST   /api/v1/recipes/:id/nutrition/calculate  Calculate nutritional data from ingredients
GET    /api/v1/recipes/collections           List collections
POST   /api/v1/recipes/collections           Create collection
PUT    /api/v1/recipes/collections/:id       Update collection
DELETE /api/v1/recipes/collections/:id       Delete collection
POST   /api/v1/recipes/collections/:id/add   Add recipe to collection
GET    /api/v1/recipes/meal-plans            Get meal plans
POST   /api/v1/recipes/meal-plans            Create or update meal plan
GET    /api/v1/recipes/shopping-list         Generate shopping list from recipe IDs or meal plan
```

---

## MCP Tools — `recipes_*` Namespace

The Recipe Collection exposes the following tools on the Life Manager MCP Server:

| Tool | Description |
|---|---|
| `recipes_search` | Search recipes by tag, cuisine, ingredient, effort, dietary requirement, free text |
| `recipes_get` | Return full detail of a specific recipe by ID or title |
| `recipes_suggest` | Suggest recipes based on criteria (macros remaining, effort level, fasting context, time available) |
| `recipes_get_meal_plan` | Return the current or a planned weekly meal plan |
| `recipes_generate_shopping_list` | Generate a consolidated shopping list from a set of recipe IDs or from the active meal plan |
| `recipes_get_by_status` | Return all recipes filtered by status (`to-try`, `tried`, `family-favourite`) |
| `recipes_add` | Save a new recipe to the collection (Claude-assisted capture workflow) |
| `recipes_update_status` | Update rating or status after cooking |
| `recipes_get_collections` | List all collections with recipe counts |

---

## Integration Points

| Module | Integration |
|---|---|
| **Pantry & Ingredient Tracker** | Recipe matching uses pantry inventory; shopping lists deduct pantry stock; ingredient costs from pantry calculate cost-per-recipe; expiry-aware suggestions route to recipes using at-risk items |
| **Nutrition & Macro Tracker** | Recipes importable for macro calculation; calculated nutritional data written back to recipe; recipes available in meal planner for macro projection |
| **Fasting Tracker** | `#break-fast-meal` tagged recipes surfaced when a fast ends; fasting-aware meal sets available during eating window planning |
| **Finance Manager** | Shopping lists generated from meal plans feed into grocery pot; estimated recipe cost contributes to weekly food budget |
| **MCP Server** | Full query and capture capability via `recipes_*` namespace |

---

## Technical Considerations

- **Nutritional calculation**: multiply ingredient quantity by per-100g/ml nutritional data from the food database; sum across all ingredients; divide by serving count
- **Tag storage**: array of strings on the Recipe entity — indexed in PostgreSQL via GIN index on the `tags` column for fast filtering
- **Meal planner**: stored as a `MealPlan` entity with a week start date and a JSON array of slot assignments
- **Shopping list generation**: server-side aggregation — group by ingredient name (normalised), sum quantities, deduct pantry stock
- **Ingredient name normalisation**: case-insensitive, singular form (e.g., "chicken breast" not "Chicken Breasts") for reliable matching against pantry items

---

## Phase Roadmap

| Phase | Features | Priority |
|---|---|---|
| Phase 1 — Recipe MVP | Recipe storage, standard structure, full tag taxonomy, status tracking, manual entry | P1 |
| Phase 2 — Discovery | Tag & free-text filtering, cuisine browsing, random suggestion, collections/cookbooks | P1 |
| Phase 3 — Nutrition Link | Nutritional data per ingredient, macro calculation per recipe, meal planning with macro projections | P2 |
| Phase 4 — Planning | Weekly meal planner, shopping list generation (with pantry deduction), Finance Manager grocery pot integration | P2 |
| Phase 5 — Intelligence | AI meal suggestions, fasting-aware recommendations, pantry-based recipe matching via MCP, URL import | P3 |

---

## Open Questions

- Should recipe data live in the main PostgreSQL database or a separate SQLite store (given its personal/curated nature)?
- Markdown vs structured database: markdown notes are Obsidian-native and human-readable; a structured DB is faster to query via MCP — a hybrid approach (DB as source of truth, markdown export on demand) may be the answer
- Should recipes be shareable outside the platform (e.g., export to a public page or send to a friend)?
- Is there appetite for a per-family-member rating system rather than a single user rating?
- Phase 2 automated URL import: should Claude parse any recipe URL on request, or only a curated list of supported sites?
- Should the shopping list offer supermarket online order integration (Tesco, Sainsbury's, Ocado)?
