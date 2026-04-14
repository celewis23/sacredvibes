FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Restore dependencies first (cached layer)
COPY src/SacredVibes.Api/SacredVibes.Api.csproj                         src/SacredVibes.Api/
COPY src/SacredVibes.Application/SacredVibes.Application.csproj         src/SacredVibes.Application/
COPY src/SacredVibes.Domain/SacredVibes.Domain.csproj                   src/SacredVibes.Domain/
COPY src/SacredVibes.Infrastructure/SacredVibes.Infrastructure.csproj   src/SacredVibes.Infrastructure/

RUN dotnet restore src/SacredVibes.Api/SacredVibes.Api.csproj

# Copy source and publish
COPY src/ src/
RUN dotnet publish src/SacredVibes.Api/SacredVibes.Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

RUN mkdir -p /app/uploads

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SacredVibes.Api.dll"]
