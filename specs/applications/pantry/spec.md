# Feature Specification: Pantry & Ingredient Tracker

**Feature ID**: `014-pantry-tracker`
**Created**: 2026-06-03
**Status**: Draft
**Priority**: P3
**Dependencies**: Authentication Service, Recipe Collection (013), Fitness — Nutrition Module

## Overview

The Pantry & Ingredient Tracker is a shared infrastructure module that sits beneath the Recipe Collection, Nutrition Module, and Finance Manager. It maintains a live inventory of everything in the user's fridge, freezer, and pantry — including quantities, storage location, purchase dates, sell-by dates, and prices paid.

This single source of truth powers four high-value capabilities:

1. **Recipe matching** — surface what can be cooked right now, and what is one or two ingredients away from being possible
2. **Expiry management** — alert before food goes to waste and route to recipes that use it up
3. **Cost tracking** — calculate the true cost per meal, per serving, and per gram of protein
4. **Smart shopping lists** — generate lists from meal plans that only include what the user does not already have

## Rationale

The Pantry Tracker solves the "what can I make tonight?" problem at the data layer. Without it, the Recipe Collection and Nutrition Module operate on planned data; with it, they operate on actual available inventory. It also closes the loop between grocery spending (Finance Manager) and cooking (Nutrition/Recipe modules) by tracking real costs from purchase through to consumption.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ingredient Inventory (Priority: P1)

Users can maintain a live inventory of their kitchen stock across fridge, freezer, and pantry, with quantities, units, purchase dates, and sell-by dates.

**Why this priority**: The inventory is the data foundation. All other features (recipe matching, expiry tracking, cost calculation) require accurate inventory data.

**Independent Test**: Add 10 items across three locations (fridge/freezer/pantry), update quantities, remove a used item, and verify the inventory view reflects all changes correctly.

**Acceptance Scenarios**:

1. **Given** a user, **When** they add an ingredient, **Then** they record: name, category, storage location (fridge/freezer/pantry), quantity, unit, purchase date, and optionally sell-by date and price paid
2. **Given** an inventory item, **When** a recipe is cooked and its quantities are consumed, **Then** the user is prompted to confirm consumption and inventory quantities are decremented accordingly
3. **Given** an item whose quantity reaches zero, **When** the user confirms it is used up, **Then** it is marked as out of stock and flagged for the next shopping list
4. **Given** a user scanning a product barcode (Phase 2), **When** the barcode is recognised via Open Food Facts, **Then** name, category, and nutritional data are auto-populated
5. **Given** items flagged as **pantry staples** (e.g., salt, olive oil, black pepper), **When** recipe matching and shopping list generation run, **Then** staples are excluded — they are managed separately

#### Storage Locations & Categories

| Location | Examples |
|---|---|
| Fridge | Fresh produce, dairy, cooked leftovers, open sauces |
| Freezer | Frozen meat, fish, veg, pre-portioned batch-cook items |
| Pantry | Tins, dried goods, oils, spices, pasta, rice |

| Category | Examples |
|---|---|
| Produce | Vegetables, fruit, fresh herbs |
| Meat & Fish | Raw and cooked meat, fresh fish |
| Dairy & Eggs | Milk, cheese, yogurt, eggs |
| Grains | Pasta, rice, oats, bread, flour |
| Tins & Jars | Tinned tomatoes, beans, sauces |
| Frozen | All freezer items |
| Spices | Spices, dried herbs |
| Condiments | Sauces, oils, vinegars |
| Other | Anything not covered above |

---

### User Story 2 — Expiry & Freshness Tracking (Priority: P1)

Users can track sell-by dates for perishable items and receive tiered warnings before food expires, with recipe suggestions to use items up.

**Why this priority**: Expiry tracking is the most immediately valuable feature for reducing food waste — a problem most households experience daily.

**Independent Test**: Add items with sell-by dates at 1, 3, 5, and 10 days from now, verify traffic-light status is correct for each, confirm notifications fire at the right thresholds, and test recipe suggestions link to the expiring items.

**Acceptance Scenarios**:

1. **Given** an item with a sell-by date, **When** the user views the inventory, **Then** each item displays a traffic-light freshness status based on days to expiry
2. **Given** an item entering amber status (3–5 days), **When** the threshold is crossed, **Then** a notification is sent: "[Spinach] expires in 3 days — 2 recipes use it: [Shawarma Bowl, Frittata]"
3. **Given** an item entering red status (1–2 days), **When** the threshold is crossed, **Then** an urgent notification is sent with the quickest recipe using that item
4. **Given** a user opening the "Use It Up" view, **When** they access it, **Then** all amber and red items are shown with matched recipes sorted by: expiry urgency first, then recipe completeness (closest to full match)
5. **Given** frozen items, **When** they have been in the freezer for more than 30 days, **Then** a "freezer archaeology" alert surfaces them for review
6. **Given** a frozen ingredient in a planned meal, **When** the meal plan is set, **Then** the user is reminded to move it to the fridge the night before

#### Traffic Light Status

| Status | Trigger | Example |
|---|---|---|
| 🟢 Fresh | > 5 days to expiry | |
| 🟡 Use Soon | 3–5 days to expiry | |
| 🟠 Use Today / Tomorrow | 1–2 days to expiry | |
| 🔴 Expiring Today | Expires today | |
| ⚫ Expired | Past sell-by | |

---

### User Story 3 — Recipe Matching — "What Can I Make?" (Priority: P1)

The system takes the user's current inventory and matches it against their recipe collection in real time, surfacing full matches and near-matches with missing ingredients highlighted.

**Why this priority**: This is the single highest-value feature of the module — it answers the most common daily cooking question without any manual effort.

**Independent Test**: Load a recipe collection and an inventory, verify full-match detection is accurate, verify near-match (1 missing, 2 missing) logic, confirm expiry-aware sorting surfaces urgent items first, and test the ingredient substitution tolerance.

**Acceptance Scenarios**:

1. **Given** a user's current inventory, **When** they open "What Can I Make?", **Then** all recipes are matched and grouped by: Full Match, Near Match (1 missing), Near Match (2 missing), Partial Match
2. **Given** a full-match recipe, **When** displayed, **Then** no missing ingredients are shown
3. **Given** a near-match recipe (1 missing ingredient), **When** displayed, **Then** the single missing item is shown with its required quantity — making the decision to buy it trivially easy
4. **Given** a near-match recipe, **When** the user taps the missing ingredient, **Then** it is added to the next shopping list
5. **Given** inventory items that are expiring, **When** those items are used in matched recipes, **Then** those recipes are boosted in sort order with a "uses expiring items" badge
6. **Given** a recipe requiring 100g chicken and the user has 95g, **When** matching runs, **Then** the recipe still counts as a full match (5% buffer applied)
7. **Given** a user who has configured ingredient substitutes (e.g., spinach ≈ baby spinach), **When** matching runs, **Then** a substitute in inventory satisfies the requirement

#### Match Type Definitions

| Type | Definition |
|---|---|
| **Full Match** | All ingredients in sufficient quantity |
| **Near Match — 1 Missing** | All ingredients except one |
| **Near Match — 2 Missing** | All ingredients except two |
| **Partial** | More than half the ingredients present |

---

### User Story 4 — Cost Tracking (Priority: P2)

Users can record prices paid for ingredients and the system calculates cost per recipe, cost per serving, and cost per macro unit — tracking trends over time.

**Why this priority**: Cost data transforms the Pantry Tracker from a health tool into a finance tool. It closes the loop to the Finance Manager's grocery pot.

**Independent Test**: Add 5 ingredients with prices, assign them to a recipe, calculate recipe cost, verify cost-per-serving and cost-per-10g-protein calculations, and confirm price history is stored across multiple purchases.

**Acceptance Scenarios**:

1. **Given** a user adding an ingredient with a price, **When** saved, **Then** unit cost is calculated (e.g., 500g chicken for £4.50 = £0.009/g) and stored
2. **Given** a recipe whose ingredients all have price data, **When** the user views the recipe, **Then** total recipe cost and cost per serving are displayed
3. **Given** a recipe with nutritional data and cost data, **When** the user views nutrition/cost metrics, **Then** cost per 100 kcal and cost per 10g protein are shown
4. **Given** an ingredient purchased multiple times at different prices, **When** the user views it, **Then** a price history chart shows the trend over time
5. **Given** a price increase detected (e.g., chicken breast 18% more expensive than last 3 purchases), **When** the user views the item, **Then** a price trend alert is shown
6. **Given** an item marked as expired and wasted, **When** logged, **Then** the item's price is recorded as waste cost and reported in the weekly food waste summary

---

### User Story 5 — Smart Shopping List Generation (Priority: P2)

Users can generate a shopping list from a meal plan that calculates only the ingredient deficit — what is needed minus what is already in stock.

**Why this priority**: The shopping list is the practical output of the entire pantry + recipe + meal planning system. It converts digital planning into real-world action.

**Independent Test**: Plan 5 meals with overlapping ingredients, set pantry inventory with partial stock, generate a shopping list, and verify that only true deficits appear with correct quantities.

**Acceptance Scenarios**:

1. **Given** a weekly meal plan, **When** the user generates a shopping list, **Then** all required ingredients across planned recipes are consolidated with quantities summed, pantry stock deducted, and only deficits listed
2. **Given** a shopping list, **When** viewed, **Then** items are grouped by supermarket aisle: Produce, Meat & Fish, Dairy & Eggs, Frozen, Tins & Jars, Bakery, Spices & Condiments
3. **Given** inventory items flagged as running low (below user-defined minimum), **When** a shopping list is generated, **Then** those items are automatically added regardless of meal plan
4. **Given** a shopping list, **When** the user checks off an item as bought, **Then** it is marked complete and auto-added to pantry inventory on list completion
5. **Given** a completed shopping trip with a total cost entered, **When** the trip is confirmed, **Then** the cost is logged to the Finance Manager grocery pot and individual item prices are updated
6. **Given** a shopping list, **When** the user shares it, **Then** a plain-text version is generated for copying to a notes app or messaging

---

### User Story 6 — Macro Pipeline — Ingredients to Daily Totals (Priority: P3)

The pantry tracker acts as the nutritional data layer, providing per-ingredient macro data that flows through recipes into the Nutrition Module's daily log.

**Why this priority**: This is the integration that makes nutrition tracking accurate without manual macro lookup — it is a quality-of-life feature once the foundation (inventory, recipes) is in place.

**Independent Test**: Log a meal using a recipe linked to pantry ingredients, verify macro values pre-fill in the Nutrition Module log, adjust serving size and confirm macros scale proportionally.

**Acceptance Scenarios**:

1. **Given** an ingredient with nutritional data stored (per 100g/ml), **When** that ingredient is used in a recipe, **Then** its contribution to recipe macros is calculated as `(quantity / 100) × per_100g_value`
2. **Given** a recipe with calculated macros, **When** the user logs it in the Nutrition Module, **Then** macro values pre-fill from the stored recipe data — no manual lookup required
3. **Given** a logged meal with half a portion, **When** serving size is set to 0.5, **Then** all macros are halved proportionally
4. **Given** the user asking "what can I eat tonight that gives me 40g protein from what's in the fridge?", **When** queried via MCP or the UI, **Then** matching recipes with sufficient protein and all ingredients in stock are returned

---

## Data Model

```typescript
interface PantryItem {
  id: string;
  userId: string;
  name: string;                    // Normalised (lowercase, singular)
  category: PantryCategory;
  location: 'fridge' | 'freezer' | 'pantry';
  quantity: number;
  unit: string;                    // g, kg, ml, l, items, packs
  purchaseDate: string | null;     // ISO 8601
  sellByDate: string | null;       // ISO 8601
  pricePaid: number | null;        // Per purchased unit
  purchaseQuantity: number | null; // e.g., 500 (for 500g at £4.50 → £0.009/g)
  unitCost: number | null;         // Calculated: pricePaid / purchaseQuantity
  barcode: string | null;          // EAN barcode for re-scanning
  foodDatabaseId: string | null;   // Link to Open Food Facts ID or internal food DB
  nutritionPer100g: NutritionPer100 | null;
  isStaple: boolean;               // Excludes from recipe matching and shopping lists
  minimumStockQuantity: number | null; // Triggers "running low" alert
  priceHistory: PriceHistoryEntry[];
  freshnessStatus: FreshnessStatus; // Computed from sellByDate
  createdAt: string;
  updatedAt: string;
}

type FreshnessStatus = 'fresh' | 'use-soon' | 'use-today' | 'expiring-today' | 'expired' | 'no-date';

interface NutritionPer100 {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fibre: number | null;
  sugar: number | null;
}

interface PriceHistoryEntry {
  date: string;
  pricePaid: number;
  purchaseQuantity: number;
  unitCost: number;
}

interface RecipeMatch {
  recipeId: string;
  matchType: 'full' | 'near-1' | 'near-2' | 'partial';
  missingIngredients: MissingIngredient[];
  hasExpiringIngredients: boolean;
  estimatedCost: number | null;
}

interface MissingIngredient {
  name: string;
  requiredQuantity: number;
  unit: string;
}

interface ShoppingList {
  id: string;
  userId: string;
  generatedFrom: 'meal-plan' | 'manual' | 'recipe-set';
  weekStartDate: string | null;
  items: ShoppingListItem[];
  totalEstimatedCost: number | null;
  completedAt: string | null;
  createdAt: string;
}

interface ShoppingListItem {
  id: string;
  listId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  aisleCategory: string;
  isBought: boolean;
  estimatedCost: number | null;
  recipeIds: string[];             // Which recipes require this item
}
```

---

## API Endpoints

```
POST   /api/v1/pantry/items                  Add pantry item
GET    /api/v1/pantry/items                  List inventory (filterable by location, category, freshness)
GET    /api/v1/pantry/items/:id              Get item detail
PUT    /api/v1/pantry/items/:id              Update item (quantity, sell-by, price)
DELETE /api/v1/pantry/items/:id              Remove item
PATCH  /api/v1/pantry/items/:id/consume      Decrement quantity (with amount)
PATCH  /api/v1/pantry/items/:id/waste        Mark as wasted (records waste cost)
POST   /api/v1/pantry/items/barcode          Look up item by barcode

GET    /api/v1/pantry/recipe-matches         Match current inventory against recipe collection
GET    /api/v1/pantry/expiring               List items by expiry urgency
GET    /api/v1/pantry/use-it-up              Expiring items with matched recipes

POST   /api/v1/pantry/shopping-lists         Generate shopping list from meal plan / recipe IDs
GET    /api/v1/pantry/shopping-lists         List shopping lists
GET    /api/v1/pantry/shopping-lists/:id     Get list detail
PATCH  /api/v1/pantry/shopping-lists/:id/item/:itemId  Mark item bought / unbought
PATCH  /api/v1/pantry/shopping-lists/:id/complete      Complete shopping trip (adds bought items to pantry)

GET    /api/v1/pantry/costs/weekly-waste     Weekly food waste cost report
GET    /api/v1/pantry/costs/price-trends     Price trend alerts for items with significant changes
```

---

## MCP Tools — `pantry_*` Namespace

| Tool | Description |
|---|---|
| `pantry_get_inventory` | Return current inventory, filterable by location or category |
| `pantry_get_expiring` | Return items expiring within N days with matched recipes |
| `pantry_what_can_i_make` | Match current inventory against the recipe collection; return full and near matches |
| `pantry_get_shopping_list` | Return the current active shopping list |
| `pantry_generate_shopping_list` | Generate a shopping list from a meal plan or recipe IDs |
| `pantry_add_item` | Add a new inventory item |
| `pantry_update_quantity` | Update the quantity of an existing item (after cooking or shopping) |
| `pantry_get_waste_report` | Return this week's food waste cost summary |

---

## Integration Points

| Module | Integration |
|---|---|
| **Recipe Collection** | Recipe matching uses pantry inventory in real time; shopping lists deduct pantry stock; recipe macro data calculated from pantry ingredient nutritional profiles; expiry-aware recipe routing |
| **Nutrition & Macro Tracker** | Ingredient nutritional data shared — one barcode scan populates both; meal log macros pre-fill from recipe data; "what can I eat that fits my remaining macros?" queries live inventory |
| **Fasting Tracker** | Break-fast suggestions filtered to what is in the fridge |
| **Finance Manager** | Shopping trip costs log directly to the grocery pot; food waste cost tracked as a grocery sub-category; price trends from purchase history inform AI savings detection |
| **Life Manager Dashboard** | Expiry alerts surfaced as notifications; daily "use it up" nudge if amber items exist; weekly food waste cost summary |

---

## Technical Considerations

- **Ingredient name normalisation**: lowercase, singular form, trimmed — essential for reliable matching across recipes and pantry
- **Barcode lookup**: Open Food Facts API (free, open source, strong UK data) — cache results locally to reduce API calls
- **Nutritional data**: store per 100g/ml values; calculate per-recipe by `(quantity_used / 100) × per_100g_value`; this keeps storage simple and calculations deterministic
- **Recipe matching algorithm**: for each recipe, iterate ingredients; check pantry for normalised name match; compare quantity; apply 5% tolerance buffer; count missing items; classify match type
- **Freshness status**: computed field derived from `sellByDate` relative to today — recalculated at query time, not stored
- **Price trend detection**: flag items where the most recent unit cost is > 10% higher than the average of the previous 3 purchases

---

## Phase Roadmap

| Phase | Features | Priority |
|---|---|---|
| Phase 1 — Inventory MVP | Ingredient inventory, location tracking, manual add/remove/consume | P1 |
| Phase 2 — Expiry | Sell-by date tracking, traffic-light status, expiry notifications, "Use It Up" view | P1 |
| Phase 3 — Recipe Matching | Real-time inventory vs recipe collection matching; full / near-match display | P1 |
| Phase 4 — Cost Tracking | Price per purchase, unit cost, cost per recipe, cost per serving, cost per macro | P2 |
| Phase 5 — Smart Shopping | Meal-plan-driven shopping lists with pantry deduction, aisle grouping, Finance Manager link | P2 |
| Phase 6 — Macro Pipeline | Nutritional data per ingredient, macro flow from pantry → recipe → nutrition log | P3 |
| Phase 7 — Barcode & Intelligence | Barcode scanning, receipt OCR, MCP tools, price trend alerts, waste reporting | P3 |

---

## Open Questions

- Barcode scanner: device camera via the web app (via browser `getUserMedia` API) or a native mobile app integration?
- Receipt OCR: manual cost entry is simpler for MVP — receipt scanning can be Phase 7; is there a good free OCR API for UK receipts?
- Should the pantry tracker have an offline mode (PWA with local sync) given it is most often used while physically in the kitchen?
- Minimum stock levels: set per item manually, or should the system auto-learn from purchase frequency?
- Should staples (salt, oil, flour) ever appear on shopping lists, or is manual management always the right model?
- How tightly should ingredient name normalisation be enforced — user-editable aliases, or a strict canonical name system?
