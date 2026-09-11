FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["FinanceApi.csproj", "."]
RUN dotnet restore "FinanceApi.csproj"
COPY . .
RUN dotnet build "FinanceApi.csproj" -c Release -o /app/build

# ── Dev stage — dotnet watch, live source bind-mounted over /src at runtime
# (see docker-compose.dev.yml). The COPY above is unused there but keeps this
# stage buildable standalone.
FROM build AS dev
ENTRYPOINT ["dotnet", "watch", "run", "--no-launch-profile", "--urls", "http://+:8080"]

FROM build AS publish
RUN dotnet publish "FinanceApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "FinanceApi.dll"]
