# Copper Goals Tracker

Sales goals tracking and analytics dashboard for Kanva Botanicals, integrated with Copper CRM and JustCall.

## Features

- **Sales Goals Tracking**: Set and monitor sales goals with real-time progress
- **Copper CRM Integration**: Embedded dashboard within Copper CRM
- **JustCall Integration**: Real-time calling metrics and analytics by user
- **Multi-Domain Support**: Supports both @kanvabotanicals.com and @cwlbrands.com users
- **User Management**: Admin interface for managing users and permissions
- **Metrics Dashboard**: Comprehensive analytics and reporting

## Environment Variables

Create `.env.local` for development and `.env.production` for production with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

# Admin Users (comma-separated emails)
NEXT_PUBLIC_ADMIN_EMAILS=admin@kanvabotanicals.com,admin@cwlbrands.com

# Copper SDK
NEXT_PUBLIC_COPPER_SDK_URL=https://cdn.jsdelivr.net/npm/copper-sdk@latest/dist/copper-sdk.min.js

# JustCall API (NEW)
JUSTCALL_API_KEY=your_justcall_api_key
JUSTCALL_API_SECRET=your_justcall_api_secret
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

## Authentication

Users must authenticate with their organization email:
- `@kanvabotanicals.com`
- `@cwlbrands.com`

Password requirements:
- Minimum 8 characters
- At least one number
- At least one special character

## JustCall Integration

See [docs/JUSTCALL_INTEGRATION.md](docs/JUSTCALL_INTEGRATION.md) for detailed documentation on:
- Setup and configuration
- API endpoints
- Component usage
- Troubleshooting

### Quick Start

1. Add JustCall credentials to environment variables
2. Ensure JustCall users have matching emails
3. Access metrics at `/admin/justcall`

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── admin/        # Admin endpoints
│   │   ├── copper/       # Copper integration
│   │   └── justcall/     # JustCall integration (NEW)
│   ├── admin/            # Admin pages
│   ├── dashboard/        # Main dashboard
│   └── login/            # Authentication
├── components/           # React components
│   └── JustCallMetrics.tsx  # JustCall metrics component (NEW)
├── lib/
│   ├── firebase/         # Firebase configuration
│   ├── copper/           # Copper SDK integration
│   └── justcall/         # JustCall API client (NEW)
├── docs/                 # Documentation
└── types/                # TypeScript types
```

## Key Features

### Multi-Domain Authentication
Both @kanvabotanicals.com and @cwlbrands.com domains are supported throughout the application for seamless access across organizations.

### Real-Time Call Metrics
JustCall integration provides live calling metrics without relying on Copper activities:
- Total calls (inbound/outbound)
- Call duration and averages
- Success rates and missed calls
- Daily activity patterns
- Auto-refresh every 60 seconds

### Copper CRM Embedding
The dashboard can be embedded as an iframe within Copper CRM, providing contextual information directly in the CRM interface.

## Admin Features

- User management (`/admin/users`)
- JustCall metrics dashboard (`/admin/justcall`)
- System configuration
- Metrics sync tools

## License

Proprietary - Kanva Botanicals / CWL Brands
