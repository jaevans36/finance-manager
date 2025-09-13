# FinTrack — Finance Manager App (C# .NET + SQL + Vite React)

> Monorepo scaffold for a personal finance dashboard that imports CSV bank data, detects recurring payments, supports tagging, and visualizes trends. Back end in **C# .NET**, database in **SQL Server (LocalDB/Express by default)**, front end in **Vite + React + TypeScript**. Includes **AI-assisted documentation** generation.

---

## 🚀 Quick Start (TL;DR)

```bash
# 1) Clone & enter
 git clone <your-repo-url> fintrack
 cd fintrack

# 2) Bootstrap solution (Windows PowerShell)
 ./scripts/bootstrap.ps1

# (or) Bash/WSL/macOS
 bash ./scripts/bootstrap.sh

# 3) Start back end (from repo root)
 dotnet run --project src/FinTrack.Api

# 4) Start front end
 cd apps/fintrack-web
 npm install
 npm run dev
```

Then open:

* **API** Swagger UI: [http://localhost:5179/swagger](http://localhost:5179/swagger) (port may vary; see console)
* **Web app**: [http://localhost:5173](http://localhost:5173)

> If ports clash, adjust `launchSettings.json` (API) or `vite.config.ts` (web).

---

## 🧱 Monorepo Layout

```
fintrack/
├─ src/
│  └─ FinTrack.Api/            # ASP.NET Core Web API (C#)
├─ apps/
│  └─ fintrack-web/            # Vite + React + TS front end
├─ tools/
│  └─ docgen/                  # AI-powered docs generator (Node script)
├─ scripts/                    # Bootstrap & helper scripts
├─ docs/                       # Human + AI generated docs site
├─ .editorconfig
├─ .gitignore
├─ FinTrack.sln
└─ README.md
```

---

## ✅ Prerequisites

* **.NET SDK** 8.x (LTS) or later — [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)
* **Node.js** 20+ — [https://nodejs.org/](https://nodejs.org/)
* **SQL Server** (LocalDB or Express) — or switch to PostgreSQL (see below)
* **Git** — [https://git-scm.com/](https://git-scm.com/)
* **OpenAI API key** (for optional docs generation) — store as env var, **never commit**

> Tip: On Windows, LocalDB via Visual Studio/Build Tools is fine for dev. For cross‑platform, use SQL Server Docker or Postgres (instructions below).

---

## 🧰 Bootstrap Scripts

### Windows PowerShell — `./scripts/bootstrap.ps1`

Creates the solution, API project, basic EF Core setup, Vite front end, and tools.

```powershell
param(
  [string]$ApiName = "FinTrack.Api",
  [string]$WebName = "fintrack-web"
)

# Ensure directories
New-Item -ItemType Directory -Force -Path src, apps, tools\docgen, scripts, docs | Out-Null

# Solution + API
if (!(Test-Path FinTrack.sln)) { dotnet new sln -n FinTrack }
if (!(Test-Path src\$ApiName)) { dotnet new webapi -n $ApiName -o src\$ApiName --use-controllers }

dotnet sln add src\$ApiName\$ApiName.csproj

# NuGet packages (EF Core + SQL Server + Swagger already included)
Push-Location src\$ApiName
 dotnet add package Microsoft.EntityFrameworkCore --version 8.*
 dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.*
 dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.*
 dotnet add package Swashbuckle.AspNetCore --version 6.*
Pop-Location

# Front end
if (!(Test-Path apps\$WebName)) {
  pushd apps
  npm create vite@latest $WebName -- --template react-ts
  popd
}

# Tools: docgen (Node script shell)
@"
{
  "name": "docgen",
  "private": true,
  "type": "module",
  "scripts": {
    "generate": "node generate.mjs"
  },
  "dependencies": {
    "openai": "^4.56.0"
  }
}
"@ | Out-File -Encoding UTF8 tools\docgen\package.json

@"
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import OpenAI from 'openai';

const apiBase = process.env.DOCS_API_BASE ?? 'http://localhost:5179';
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error('OPENAI_API_KEY is not set. Skipping AI docs.');
  process.exit(0);
}

const client = new OpenAI({ apiKey: openaiKey });
const outDir = path.resolve('docs');
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const openapiUrl = `${apiBase}/swagger/v1/swagger.json`;
  let spec;
  try {
    const res = await fetch(openapiUrl);
    spec = await res.json();
  } catch (e) {
    console.error('Failed to fetch OpenAPI spec from', openapiUrl, e);
    process.exit(1);
  }

  const prompt = `Summarize this OpenAPI spec into human-friendly docs. ` +
                 `Provide endpoint overviews, auth, request/response examples, error handling, and usage notes.\n` +
                 JSON.stringify(spec);

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a technical writer creating concise API docs.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  });

  const md = completion.choices[0]?.message?.content ?? '# API Docs\n(No content)';
  fs.writeFileSync(path.join(outDir, 'api.md'), md);
  console.log('Docs written to docs/api.md');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
"@ | Out-File -Encoding UTF8 tools\docgen\generate.mjs

# .gitignore
@"
**/bin/
**/obj/
.vscode/
node_modules/
.env
.env.*
.secrets/
*.user
*.db
*.sqlite
*.mdj
.DS_Store
# build
apps/$WebName/dist/
"@ | Out-File -Encoding UTF8 .gitignore

# EditorConfig
@"
root = true
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
[*.cs]
indent_size = 4
"@ | Out-File -Encoding UTF8 .editorconfig

Write-Host "Bootstrap complete. Next steps: run EF setup & start API/web."
```

### Bash — `./scripts/bootstrap.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
API_NAME=${1:-FinTrack.Api}
WEB_NAME=${2:-fintrack-web}

mkdir -p src apps tools/docgen scripts docs
[ -f FinTrack.sln ] || dotnet new sln -n FinTrack
[ -d "src/$API_NAME" ] || dotnet new webapi -n "$API_NAME" -o "src/$API_NAME" --use-controllers

dotnet sln add "src/$API_NAME/$API_NAME.csproj"

pushd "src/$API_NAME"
  dotnet add package Microsoft.EntityFrameworkCore --version 8.*
  dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.*
  dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.*
  dotnet add package Swashbuckle.AspNetCore --version 6.*
popd

if [ ! -d "apps/$WEB_NAME" ]; then
  (cd apps && npm create vite@latest "$WEB_NAME" -- --template react-ts)
fi

cat > tools/docgen/package.json << 'PKG'
{
  "name": "docgen",
  "private": true,
  "type": "module",
  "scripts": { "generate": "node generate.mjs" },
  "dependencies": { "openai": "^4.56.0" }
}
PKG

cat > tools/docgen/generate.mjs << 'GEN'
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import OpenAI from 'openai';

const apiBase = process.env.DOCS_API_BASE ?? 'http://localhost:5179';
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error('OPENAI_API_KEY is not set. Skipping AI docs.');
  process.exit(0);
}

const client = new OpenAI({ apiKey: openaiKey });
const outDir = path.resolve('docs');
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const openapiUrl = `${apiBase}/swagger/v1/swagger.json`;
  let spec;
  try {
    const res = await fetch(openapiUrl);
    spec = await res.json();
  } catch (e) {
    console.error('Failed to fetch OpenAPI spec from', openapiUrl, e);
    process.exit(1);
  }

  const prompt = `Summarize this OpenAPI spec into human-friendly docs. ` +
                 `Provide endpoint overviews, auth, request/response examples, error handling, and usage notes.\n` +
                 JSON.stringify(spec);

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a technical writer creating concise API docs.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  });

  const md = completion.choices[0]?.message?.content ?? '# API Docs\n(No content)';
  fs.writeFileSync(path.join(outDir, 'api.md'), md);
  console.log('Docs written to docs/api.md');
}

main().catch(err => { console.error(err); process.exit(1); });
GEN

cat > .gitignore << 'IGN'
**/bin/
**/obj/
.vscode/
node_modules/
.env
.env.*
.secrets/
*.user
*.db
*.sqlite
*.mdj
.DS_Store
apps/$WEB_NAME/dist/
IGN

cat > .editorconfig << 'EC'
root = true
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
[*.cs]
indent_size = 4
EC

echo "Bootstrap complete."
```

> After bootstrapping, commit everything: `git add . && git commit -m "chore: bootstrap solution"`.

---

## 🗃️ Database Setup (SQL Server)

We default to **SQL Server** via EF Core.

1. **Connection string** (dev):

   * Create **User Secrets** for the API project (from `src/FinTrack.Api`):

     ```bash
     dotnet user-secrets init
     dotnet user-secrets set "ConnectionStrings:Default" "Server=(localdb)\\MSSQLLocalDB;Database=FinTrack;Trusted_Connection=True;MultipleActiveResultSets=true;"
     ```
   * (Optional) Add `OPENAI_API_KEY` here as well:

     ```bash
     dotnet user-secrets set "OpenAI:ApiKey" "<your-key>"
     ```

2. **EF Core** — initial model & migration (example):

   * Create `Models/Transaction.cs` and `Data/AppDbContext.cs` (see snippets below)
   * Create migration:

     ```bash
     dotnet ef migrations add InitialCreate --project src/FinTrack.Api --startup-project src/FinTrack.Api
     dotnet ef database update --project src/FinTrack.Api --startup-project src/FinTrack.Api
     ```

3. **Switching to Postgres** (optional):

   * Replace `SqlServer` provider with `Npgsql.EntityFrameworkCore.PostgreSQL`
   * Update connection string and `UseNpgsql(...)` in `Program.cs`

---

## 🧩 API: Minimal Model & Context (example)

Create files under `src/FinTrack.Api`:

**`Models/Transaction.cs`**

```csharp
namespace FinTrack.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }         // Date of transaction
    public int DayOfMonth => Date.Day;         // Derived for convenience
    public string Description { get; set; } = string.Empty;
    public decimal Value { get; set; }         // + income, - expense
    public string? TagKey { get; set; }        // Optional tag
}
```

**`Data/AppDbContext.cs`**

```csharp
using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Transaction> Transactions => Set<Transaction>();
}
```

**`Program.cs`** (add EF + Swagger)

```csharp
using FinTrack.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DB
var cs = builder.Configuration.GetConnectionString("Default")
         ?? "Server=(localdb)\\MSSQLLocalDB;Database=FinTrack;Trusted_Connection=True;";
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(cs));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
```

**`Controllers/TransactionsController.cs`** (upload CSV stub + CRUD)

```csharp
using System.Globalization;
using FinTrack.Api.Data;
using FinTrack.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> List() =>
        await db.Transactions.OrderByDescending(t => t.Date).Take(1000).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Transaction>> Create(Transaction input)
    {
        db.Transactions.Add(input);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = input.Id }, input);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Transaction>> GetById(int id)
        => await db.Transactions.FindAsync(id) is { } t ? t : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var t = await db.Transactions.FindAsync(id);
        if (t is null) return NotFound();
        db.Remove(t);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("upload-csv")]
    public async Task<IActionResult> UploadCsv([FromForm] IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest("No file uploaded");
        using var reader = new StreamReader(file.OpenReadStream());
        var lineNo = 0;
        var list = new List<Transaction>();
        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) continue;
            lineNo++;
            if (lineNo == 1 && line.Contains("Date", StringComparison.OrdinalIgnoreCase)) continue; // header
            var cols = line.Split(',');
            if (cols.Length < 3) continue;
            var date = DateOnly.Parse(cols[0], CultureInfo.InvariantCulture);
            var desc = cols[1];
            var val = decimal.Parse(cols[2], CultureInfo.InvariantCulture);
            list.Add(new Transaction { Date = date, Description = desc, Value = val });
        }
        db.Transactions.AddRange(list);
        await db.SaveChangesAsync();
        return Ok(new { imported = list.Count });
    }
}
```

---

## 🌐 Front End (Vite + React + TS)

From `apps/fintrack-web`:

```bash
npm install
npm run dev
```

Create a basic API client and a page to list transactions, upload CSV, and show summaries. Suggested deps:

```bash
npm i axios zod react-hook-form
```

**`src/lib/api.ts`**

```ts
import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5179' });
```

**`.env`**

```
VITE_API_URL=http://localhost:5179
```

**`src/App.tsx`** (starter UI)

```tsx
import { useEffect, useState } from 'react';
import { api } from './lib/api';

type Tx = { id: number; date: string; description: string; value: number; tagKey?: string };

export default function App() {
  const [items, setItems] = useState<Tx[]>([]);

  useEffect(() => {
    api.get<Tx[]>('/api/transactions').then(r => setItems(r.data));
  }, []);

  const onUpload: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement)?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/api/transactions/upload-csv', fd);
    const r = await api.get<Tx[]>('/api/transactions');
    setItems(r.data);
  };

  return (
    <main style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>FinTrack</h1>
      <form onSubmit={onUpload}>
        <input name="file" type="file" accept=".csv" />
        <button type="submit">Upload CSV</button>
      </form>
      <hr />
      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th align="left">Date</th>
            <th align="left">Description</th>
            <th align="right">Value</th>
            <th align="left">Tag</th>
          </tr>
        </thead>
        <tbody>
          {items.map(t => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td align="right">{t.value.toFixed(2)}</td>
              <td>{t.tagKey ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

---

## 📝 Documentation Strategy

* **Source of truth:**

  * Backend: XML comments + Swagger/OpenAPI
  * Frontend: JSDoc/TSDoc comments in `apps/fintrack-web`
* **AI docs generator:** `tools/docgen/generate.mjs` reads the live OpenAPI spec and writes **`docs/api.md`** using the OpenAI API. Run:

```bash
# from repo root
cd tools/docgen
npm install
OPENAI_API_KEY=sk-... DOCS_API_BASE=http://localhost:5179 npm run generate
```

> **Cost control:** Use a small model (e.g., `gpt-4o-mini`) and run generation only on demand. Keep your monthly usage cap.

* **Human docs:** Maintain **`README.md`** (this file) and add feature guides in `docs/` as the app grows.

---

## 🔐 Secrets & Safety

* **Never commit keys**. Use `.gitignore`, **User Secrets** (back end), and `.env.local` (front end).
* If a key is ever exposed publicly, **revoke/rotate immediately** in your provider dashboard.

---

## 🧪 Testing (starter notes)

* **API:** xUnit + minimal unit tests for controllers/services.
* **Web:** Vitest + React Testing Library.
* Add CI later (GitHub Actions) for lint, test, build.

---

## 🗺️ Roadmap (initial)

* [ ] CSV import + validation rules (bank‑specific mappers)
* [ ] Tagging system (CRUD + color + rules)
* [ ] Recurring payment detection
* [ ] Dashboards (monthly/annual, tag breakdowns)
* [ ] Auth (local or OAuth) if needed
* [ ] Docs site build (Docusaurus or Mintlify)
* [ ] CI/CD pipelines

---

## 🧭 Git & Branching

* Default branch: `main`
* Feature branches: `feat/<name>`; maintenance: `chore/…`; fixes: `fix/…`
* Conventional commits recommended.

---

## 🗂️ Repository Setup (GitHub)

1. **Init & first commit** (must have at least one file):

   ```bash
   git init
   # ensure there are files here (run bootstrap scripts first, or create a placeholder)
   git add .
   git commit -m "chore: bootstrap solution"
   ```
2. **Set main & remote**

   ```bash
   git branch -M main
   git remote add origin https://github.com/<you>/finance-manager.git
   ```
3. **Push**

   ```bash
   git push -u origin main
   ```

### Troubleshooting

* **`src refspec main does not match any`** → You have **no commits** on `main`. Create/modify a file, `git add .`, `git commit -m "..."`, then push.
* **`nothing to commit`** on first commit → Your directory is empty. Run the bootstrap scripts to scaffold files:

  * PowerShell: `./scripts/bootstrap.ps1`
  * Bash (Git Bash/WSL/macOS): `bash ./scripts/bootstrap.sh`
* Already added a wrong remote? Update it:

  ```bash
  git remote set-url origin https://github.com/<you>/finance-manager.git
  ```

---

## 🧾 Changelog

* **2025‑09‑13**: Project bootstrap (solution, API skeleton, Vite app, AI docgen tooling). This README created.

---

## 🪪 License

MIT (add `LICENSE` file if needed).
