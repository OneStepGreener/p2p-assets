# API Integration - Quick Start Guide

## Setup

1. **Create `.env` file** in `p2p_assets_frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

2. **Start the backend server**:
```bash
cd backend_p2p_assets
.\venv\Scripts\python.exe run.py
```

3. **Start the frontend**:
```bash
cd p2p_assets_frontend
npm run dev
```

## What Was Implemented

### ✅ Enterprise-Level API Integration

1. **API Configuration** (`src/config/api.ts`)
   - Centralized endpoint configuration
   - Environment variable support
   - Type-safe endpoint definitions

2. **API Client** (`src/services/apiClient.ts`)
   - Automatic retry mechanism (3 attempts)
   - Request timeout (30 seconds)
   - JWT token management
   - Error handling and transformation
   - Type-safe responses

3. **Service Layer** (`src/services/assetService.ts`)
   - Business logic abstraction
   - Type-safe methods
   - Error handling

4. **Custom Hooks**
   - `useAssetCount` - Fetches asset count with loading/error states
   - `useAssetKPIs` - Fetches asset KPIs with loading/error states

5. **UI Components**
   - `LoadingSpinner` - Loading indicator
   - `ErrorMessage` - Error display with retry

6. **Integration**
   - AssetDashboard now uses real API data
   - Loading states displayed
   - Error handling with retry option
   - Fallback to mock data if API fails

## API Endpoints Used

- `GET /api/v1/assets/count` - Returns total count from `srm_assets` table
- `GET /api/v1/assets/kpis` - Returns asset KPIs

## Features

✅ **Automatic Retry** - Failed requests retry up to 3 times  
✅ **Timeout Handling** - Requests timeout after 30 seconds  
✅ **Loading States** - UI shows loading indicators  
✅ **Error Handling** - User-friendly error messages with retry  
✅ **Type Safety** - Full TypeScript support  
✅ **Token Management** - Automatic JWT token handling  
✅ **Environment Config** - Easy configuration via .env  

## Testing

1. **Test API Connection**:
   - Open browser console
   - Check Network tab for API calls
   - Verify `/api/v1/assets/count` endpoint

2. **Test Error Handling**:
   - Stop backend server
   - Frontend should show error message with retry option

3. **Test Loading State**:
   - Slow down network in DevTools
   - Should see loading spinner

## Next Steps

To extend this integration:

1. **Add more endpoints** - Follow the same pattern in `assetService.ts`
2. **Add authentication** - Use `apiClient.setAuthToken()` after login
3. **Add caching** - Implement request caching for better performance
4. **Add offline support** - Cache responses for offline access
