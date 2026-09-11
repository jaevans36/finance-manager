# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore dependencies first (layer-cached until .csproj changes)
COPY apps/life-api/LifeApi.csproj .
RUN dotnet restore

# Copy source and publish
COPY apps/life-api/ .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Dev stage — dotnet watch, live source bind-mounted over /src at runtime
# (see docker-compose.dev.yml).
FROM build AS dev
ENTRYPOINT ["dotnet", "watch", "run", "--no-launch-profile", "--urls", "http://+:5000"]

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN adduser --disabled-password --gecos "" appuser

COPY --from=build /app/publish .

RUN chown -R appuser /app
USER appuser

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "LifeApi.dll"]
