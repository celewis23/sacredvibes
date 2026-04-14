FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Restore dependencies (cached layer — only re-runs when .csproj files change)
COPY backend/src/SacredVibes.Api/SacredVibes.Api.csproj                       backend/src/SacredVibes.Api/
COPY backend/src/SacredVibes.Application/SacredVibes.Application.csproj       backend/src/SacredVibes.Application/
COPY backend/src/SacredVibes.Domain/SacredVibes.Domain.csproj                 backend/src/SacredVibes.Domain/
COPY backend/src/SacredVibes.Infrastructure/SacredVibes.Infrastructure.csproj backend/src/SacredVibes.Infrastructure/

RUN dotnet restore backend/src/SacredVibes.Api/SacredVibes.Api.csproj

# Copy source and publish
COPY backend/src/ backend/src/
RUN dotnet publish backend/src/SacredVibes.Api/SacredVibes.Api.csproj \
    -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

RUN mkdir -p /app/uploads

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SacredVibes.Api.dll"]
