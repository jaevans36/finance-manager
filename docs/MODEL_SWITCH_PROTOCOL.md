# Model Switch Protocol

> **Purpose**: Deterministic procedure for bootstrapping a new AI model and preventing regression when switching between models (e.g. Sonnet ↔ Opus ↔ free-tier models).  
> **Last Updated**: 2026-02-13

---

## 1. Bootstrap Procedure

When a new model session begins (or a model switch occurs), execute these steps **in order**:

### Step 1: Load Context (Mandatory)

Read these files before generating any code:

```
1. docs/AI_CONTRACT.json          ← Machine-readable rules (parse first)
2. docs/AI_CONTEXT.md             ← Stack, architecture, patterns
3. docs/CURRENT_STATE.md          ← What is being built right now
4. docs/ARCHITECTURAL_DECISIONS.md ← Decisions and rejected approaches
5. .github/copilot-instructions.md ← Detailed coding standards
```

### Step 2: Validate Alignment

After loading context, the model must internally confirm:

- [ ] Stack identified (C# .NET 8 backend, React 18 + TypeScript frontend, PostgreSQL)
- [ ] Non-negotiable rules loaded (14 rules in AI_CONTRACT.json)
- [ ] Current branch identified (`001-todo-app`)
- [ ] Current version identified (`VERSION.json`)
- [ ] Rejected approaches loaded (6 entries in AI_CONTRACT.json)
- [ ] Active constraints understood (monolith, single DB, no OAuth yet)
- [ ] British English requirement acknowledged

### Step 3: Verify Current Work

```
1. Read docs/CURRENT_STATE.md → understand what's in progress
2. Run: git status → check for uncommitted changes
3. Run: git log --oneline -5 → verify recent commits
4. Read specs/platform/SPEC-INDEX.md → understand phase structure
```

### Step 4: Confirm Ready

Before proceeding with any user request, acknowledge:

> "I've loaded the project context. This is a .NET 8 + React 18 platform (v{version}) on branch {branch}. Current state: {summary from CURRENT_STATE.md}. I'll follow all coding rules from AI_CONTRACT.json."

---

## 2. Validation Checklist

Use this checklist to verify a model is correctly aligned. Run after bootstrap or when behaviour seems inconsistent.

| # | Check | Expected | How to Verify |
|---|-------|----------|---------------|
| 1 | No `any` type | `unknown` used in catch blocks | Grep new code for `: any` |
| 2 | No `React.FC` | Direct props typing | Grep new code for `React.FC` |
| 3 | apiClient used | No direct axios imports | Grep `import axios` in services |
| 4 | Design tokens | No hardcoded px/hex in styled | Grep for `px;` or `#[0-9a-f]` in new styled components |
| 5 | Lucide icons | No emoji in components | Grep for emoji patterns in tsx files |
| 6 | British English | colour, organisation, favourite | Read new docs/comments |
| 7 | Conventional Commits | Proper prefix | Check commit message format |
| 8 | Feature folders | Controllers in Features/{X}/ | Check file paths of new backend code |
| 9 | Interface DI | IService + AddScoped | Check new service registrations |
| 10 | DTOs used | No entity in API response | Check controller return types |

---

## 3. Context Update Triggers

### CURRENT_STATE.md Must Be Updated When:

- A new feature is started (update "What Is Currently Being Built")
- A feature/phase is completed (move to "What Is Built", update constraints)
- A significant refactoring decision is made
- Technical debt is introduced or resolved
- Environment configuration changes

### AI_CONTEXT.md Must Be Updated When:

- Stack version changes (e.g. .NET 9 upgrade)
- New shared packages added
- Architecture pattern changes (e.g. microservices migration starts)
- New application added to the platform
- Design system significantly evolves

### ARCHITECTURAL_DECISIONS.md Must Be Updated When:

- A new technology choice is made
- An existing approach is rejected or deprecated
- A significant structural change occurs
- A "why did we do it this way?" question arises

### AI_CONTRACT.json Must Be Updated When:

- A non-negotiable rule is added or removed
- Stack technology changes
- Folder structure conventions change
- A new rejected approach is documented

---

## 4. Regression Prevention

### Known Regression Patterns

Models frequently attempt to reintroduce these rejected patterns. Flag immediately:

| Pattern | Correct Alternative | Trigger Phrase |
|---------|-------------------|----------------|
| `React.FC<Props>` | `({ prop }: Props) =>` | "I'll create a functional component" |
| `catch (error: any)` | `catch (error: unknown)` | "Let me add error handling" |
| `import axios from 'axios'` | `import { apiClient }` | "I'll make an API call" |
| `padding: 16px` | `padding: ${spacing.lg}` | "I'll add some spacing" |
| `color: #333` | `color: ${({ theme }) => theme.colors.text}` | "I'll style the text" |
| `🔥` emoji in JSX | `<Flame />` from lucide-react | "I'll add an icon" |
| American spelling | British spelling | Any documentation |
| Layer folders `Controllers/` | Feature folders `Features/Auth/Controllers/` | "I'll create a new controller" |

### If Regression Detected

1. Stop current work
2. Re-read `docs/AI_CONTRACT.json` — specifically `rejectedApproaches` and `nonNegotiableRules`
3. Fix the violation before continuing
4. Note the regression in the session summary

---

## 5. Model Bootstrap Prompt Template

Copy and paste this prompt when starting a **brand new session** with any model:

```
You are working on the Life Manager platform repository. Before doing anything:

1. Read these files in order:
   - docs/AI_CONTRACT.json (machine-readable rules — parse and internalise all rules)
   - docs/AI_CONTEXT.md (stack, architecture, patterns)
   - docs/CURRENT_STATE.md (what's being built now)
   - docs/ARCHITECTURAL_DECISIONS.md (decisions and rejected approaches)
   - .github/copilot-instructions.md (detailed coding standards)

2. After reading, confirm:
   - The technology stack
   - The current version and branch
   - What's currently being built
   - The non-negotiable rules you'll follow

3. Critical rules (do not violate):
   - Never use `any` type in TypeScript
   - Never use `React.FC`
   - Always use `apiClient` from services/api-client.ts (never raw axios)
   - Always use design tokens from @life-manager/ui/styles
   - Always use Lucide React icons (never emoji)
   - Always use British English in documentation and UI text
   - Always use Conventional Commits
   - Always use feature-based folder structure for backend

4. Do not suggest approaches listed in AI_CONTRACT.json → rejectedApproaches.

Now proceed with the user's request.
```

---

## 6. Session Handover Protocol

When ending a session or switching models mid-task:

### Outgoing Model Must:

1. Update `docs/CURRENT_STATE.md` with current progress
2. Commit all changes with descriptive messages
3. Provide a session summary (per `.github/copilot-instructions.md` rules)
4. List any uncommitted decisions or open questions

### Incoming Model Must:

1. Execute the Bootstrap Procedure (Section 1)
2. Read the session summary from the outgoing model
3. Run `git log --oneline -10` to verify recent history
4. Run `git status` to check for uncommitted work
5. Confirm alignment before proceeding

---

## 7. Compliance Enforcement

### Automated (Recommended)

Add to CI pipeline (`.github/workflows/ai-compliance.yml`):

```yaml
name: AI Compliance Check
on: [pull_request]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: No 'any' type
        run: |
          if grep -rn ": any" apps/web/src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".d.ts"; then
            echo "ERROR: 'any' type found in TypeScript files"
            exit 1
          fi
      - name: No React.FC
        run: |
          if grep -rn "React\.FC\|React\.FunctionComponent" apps/web/src/ --include="*.tsx"; then
            echo "ERROR: React.FC found"
            exit 1
          fi
      - name: No direct axios
        run: |
          if grep -rn "import axios" apps/web/src/services/ --include="*.ts" | grep -v "api-client.ts"; then
            echo "ERROR: Direct axios import in service file"
            exit 1
          fi
      - name: No emoji in components
        run: |
          if grep -Prn '[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}]' apps/web/src/ --include="*.tsx" 2>/dev/null; then
            echo "WARNING: Emoji found in component files"
          fi
```

### Manual (During Review)

Before merging any AI-generated PR, verify:

1. Run validation checklist (Section 2)
2. Check that `CURRENT_STATE.md` is up to date
3. Verify no rejected approaches were reintroduced
4. Confirm British English in new documentation
5. Verify task IDs in commits match `specs/` task files
