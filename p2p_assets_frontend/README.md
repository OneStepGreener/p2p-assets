# Asset Flow - Enterprise Asset Lifecycle Management System

A comprehensive, responsive web application for managing enterprise assets throughout their lifecycle. Built with React, TypeScript, and Tailwind CSS.

## Features

### Three Main Tabs

1. **Asset Dashboard**
   - Real-time overview of asset inventory, health, utilization, and financial status
   - KPI cards showing key metrics (Total Active Assets, Status breakdown, Warranty/AMC expiries, Asset values, Idle assets)
   - Asset distribution charts by category and location
   - Maintenance & utilization overview
   - Comprehensive asset register table with filtering, sorting, and export capabilities

2. **Audit**
   - Audit schedule management with completion tracking
   - Asset scan results with discrepancy detection
   - Discrepancy queue with severity levels and resolution workflow
   - KPI cards for audit completion, discrepancy rates, and resolution times
   - Support for monthly/quarterly audit cycles

3. **Allocation**
   - Department and cost center allocation views
   - Asset allocation table with current user assignments
   - Asset movement history timeline
   - Underutilized asset tracking
   - Quick actions for asset transfer and reassignment

## Responsive Design

The application is fully responsive with dedicated layouts for:
- **Mobile** (< 640px): Optimized for phones with simplified navigation
- **Tablet** (640px - 1024px): Balanced layout with collapsible filter panel
- **Desktop** (1024px - 1920px): Full-featured layout with sidebar filters
- **TV** (> 1920px): Large screen optimized with increased font sizes and spacing

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Chart library for data visualization
- **date-fns** - Date manipulation utilities
- **xlsx** - Excel export functionality

## Coding Standards

### Mobile-First Approach
- Always use mobile-first responsive design with Tailwind breakpoints
- Start with base mobile styles, then add `sm:`, `md:`, `lg:`, `xl:` modifiers
- Use `flex-col md:flex-row` for responsive layouts
- Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive grids
- Test on mobile devices first, then scale up
- Use `px-4 py-3 md:px-6 md:py-4` for responsive padding
- Use `text-sm md:text-base` for responsive typography
- Wrap tables in `overflow-x-auto` for horizontal scrolling on mobile

### No Emojis Policy
- Do NOT use emojis anywhere in the codebase
- Use icon components from `src/components/icons/` instead
- Icons should be SVG-based React components
- Maintain consistent icon sizing and styling
- Icons should accept `className` prop for customization

### Code Optimization
- Minimize code duplication
- Use single responsive components instead of separate mobile/desktop versions
- Leverage Tailwind utilities for responsive design
- Keep components small and focused
- Consolidate similar layouts into single mobile-first components

## Project Structure

```
src/
├── components/
│   ├── shared/          # Reusable components
│   │   ├── DataTable.tsx
│   │   ├── FilterPanel.tsx
│   │   └── KPICard.tsx
│   └── tabs/            # Main tab components
│       ├── AssetDashboard.tsx
│       ├── Audit.tsx
│       └── Allocation.tsx
├── data/
│   └── mockData.ts      # Mock data for development
├── layouts/
│   ├── mobile/          # Mobile-specific layout
│   ├── tablet/          # Tablet-specific layout
│   ├── desktop/         # Desktop-specific layout
│   ├── tv/              # TV-specific layout
│   └── ResponsiveLayout.tsx
├── styles/
│   └── index.css       # Global styles
└── types/
    └── index.ts         # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Key Features

### Data Tables
- Column sorting
- Search functionality
- Pagination
- Row selection
- CSV/Excel export
- Responsive design

### Filters
- Date range selection
- Location filtering
- Department filtering
- Asset category filtering
- Status filtering
- Cost center filtering
- Audit-specific filters (auditor, discrepancy severity/status)

### KPI Cards
- Primary metric display
- Secondary information
- Trend indicators (percentage change)
- Color-coded icons

### Charts
- Pie charts for category distribution
- Bar charts for location distribution
- Responsive chart sizing

## Mock Data

The application includes comprehensive mock data covering:
- Assets with various statuses, categories, and locations
- Audit runs with different completion states
- Asset scans with discrepancy flags
- Discrepancy tickets with severity levels
- Asset movement history

## API Integration

The application is structured to easily integrate with backend APIs. Replace the mock data imports with API calls in:
- `src/data/mockData.ts` - Replace with API service calls
- Component data fetching - Add React Query or similar for data management

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme. The primary color is defined in the `primary` palette.

### Filters
Add or remove filter options in `src/components/shared/FilterPanel.tsx`

### Table Columns
Modify column definitions in each tab component to add/remove/reorder columns.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary software for Enterprise Asset Management.
