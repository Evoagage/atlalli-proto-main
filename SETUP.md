# Atlalli Prototype - Setup Instructions

## Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher

## Installation

Since you're using WSL, you'll need to run the installation from within your WSL environment.

### Step 1: Navigate to the project directory in WSL

```bash
# Convert Windows path to WSL path
cd /mnt/c/Data/alxg/Development/atlalli-proto
```

### Step 2: Install dependencies

```bash
npm install
```

This will install all the required dependencies:
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- next-intl (internationalization)
- Recharts (for radar charts)
- qrcode.react (QR code generation)
- jose (cryptography)
- Lucide React (icons)

### Step 3: Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
atlalli-proto/
├── i18n/
│   └── request.ts              # next-intl configuration (v3.22+)
├── messages/
│   ├── en-US.json              # English translations
│   └── es-MX.json              # Mexican Spanish translations
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── [locale]/           # Localized routes
│   │   │   ├── layout.tsx      # Main layout with next-intl provider
│   │   │   └── page.tsx        # Home page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles with Tailwind
│   ├── middleware.ts           # next-intl middleware for routing
│   ├── components/             # Reusable UI components (.tsx)
│   ├── store/
│   │   └── useStore.ts         # Zustand global state store
│   ├── data/
│   │   ├── catalog.json        # Master beer catalog
│   │   ├── bjcp_dictionary.json # BJCP style sensory vectors
│   │   ├── locations.json      # Prototype location data
│   │   └── system_config.json  # System configuration (N=10, fees, etc.)
│   ├── utils/                  # Utility functions (.ts)
│   ├── lib/                    # Third-party integrations (.ts)
└── README.MD                   # Project overview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Technologies

### State Management (Zustand)
The global store is located at `src/store/useStore.ts` and manages:
- User role (minor, anonymous, guest, subscriber, premium, bartender, manager, super_admin)
- Current location (mocked GPS)
- 5-axis taste vector (bitter, malt, body, aromatics, abv)
- Sample count for N=10 evolution formula
- Locale (en-US, es-MX)
- Similarity slider (0-100)

### Internationalization (next-intl)
- Supports ES-MX (Mexican Spanish) and EN-US (English)
- v3.22+ Standard using `i18n/request.ts` and `middleware.ts`
- Language switching available via the top Navbar

### Design System (Tailwind CSS)
Brand colors defined in `tailwind.config.js`:
- Obsidian Night (#0D0D0D) - Background
- Liquid Gold (#D4AF37) - Primary accent
- Bone White (#F5F5F2) - Text
- Standard Jade (#00A86B) - Standard tier
- Premium Amber (#FFBF00) - Premium tier

### Edge Runtime
All routes use `export const runtime = 'edge'` for Cloudflare Pages compatibility.
