# API Integration Documentation

## Overview

This document describes the enterprise-level API integration implemented in the frontend application.

## Architecture

### 1. API Configuration (`src/config/api.ts`)
- Centralized API endpoint configuration
- Environment-based configuration support
- Type-safe endpoint definitions

### 2. API Client (`src/services/apiClient.ts`)
- Enterprise-level HTTP client
- Features:
  - Automatic retry mechanism
  - Request timeout handling
  - Authentication token management
  - Error handling and transformation
  - Type-safe responses

### 3. Service Layer (`src/services/assetService.ts`)
- Business logic abstraction
- Type-safe service methods
- Error handling

### 4. Custom Hooks (`src/hooks/`)
- `useAssetCount` - Fetch asset count with loading/error states
- `useAssetKPIs` - Fetch asset KPIs with loading/error states

## Usage

### Environment Configuration

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Using the Asset Count Hook

```typescript
import { useAssetCount } from '../hooks/useAssetCount';

function MyComponent() {
  const { count, loading, error, refetch } = useAssetCount();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Total Assets: {count}</div>;
}
```

### Direct Service Usage

```typescript
import { assetService } from '../services/assetService';

// Get asset count
const count = await assetService.getAssetCount();

// Get asset KPIs
const kpis = await assetService.getAssetKPIs();
```

## API Endpoints

### Assets

- `GET /api/v1/assets/count` - Get total count of assets
- `GET /api/v1/assets/kpis` - Get asset KPIs

## Error Handling

The API client automatically handles:
- Network errors
- Timeout errors
- HTTP errors (4xx, 5xx)
- Retry logic for transient failures

## Authentication

The API client automatically includes JWT tokens from localStorage:
- Token key: `access_token`
- Format: `Bearer {token}`

## Type Safety

All API responses are typed using TypeScript interfaces:
- `ApiResponse<T>` - Generic API response wrapper
- `AssetKPIs` - Asset KPI data structure
- `AssetCountResponse` - Asset count response

## Best Practices

1. **Always use hooks for component data fetching** - Provides loading/error states
2. **Handle loading and error states** - Improve UX
3. **Use service layer for business logic** - Keep components clean
4. **Leverage TypeScript types** - Catch errors at compile time

## Future Enhancements

- Request caching
- Request deduplication
- Optimistic updates
- Offline support
- Request queuing
