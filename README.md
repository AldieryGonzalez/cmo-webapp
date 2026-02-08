# Northwestern CMO Web Application - Portfolio Version

A portfolio-ready web application for managing Concert Management Office (CMO) events and shifts at Northwestern University. This application demonstrates full-stack development skills with Next.js, tRPC, Better Auth, and database integration.

## Features

- **Event Management**: View upcoming concerts and events with detailed shift information
- **Anonymous Browsing**: Visitors can browse events and save shifts to their cart without authentication
- **Admin Panel**: Secure admin access for event synchronization and management
- **Email Scraping**: Script to extract event data from emails (replaces Google Calendar API)
- **Database-Backed**: All event data stored in SQLite/Turso database
- **Modern Stack**: Built with Next.js 14, tRPC, Drizzle ORM, and TailwindCSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **API Layer**: tRPC for type-safe APIs
- **Authentication**: Better Auth with anonymous sessions
- **Database**: SQLite (Turso) with Drizzle ORM
- **Styling**: TailwindCSS with custom components
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cmo-webapp.git
cd cmo-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Your Turso database URL
- `DATABASE_AUTH_TOKEN`: Your Turso auth token
- `BETTER_AUTH_SECRET`: Secret key for authentication (generate with `openssl rand -base64 32`)
- `RESEND_API_KEY`: API key for email functionality (optional)

4. Push database schema:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Email Scraping

To populate the database with event data from emails:

1. Obtain a Gmail API access token (see [Gmail API documentation](https://developers.google.com/gmail/api))

2. Run the scraping script:
```bash
# Save scraped data to a file
npm run scrape-emails -- --query "subject:CMO" --max-results 50 --access-token YOUR_TOKEN --output events.json

# Or populate database directly
npm run populate-events -- --scrape --query "subject:CMO" --access-token YOUR_TOKEN
```

### Script Options

**Email Scraping** (`npm run scrape-emails`):
- `--query`: Gmail search query
- `--max-results`: Maximum number of emails to fetch (default: 100)
- `--output`: Output file path
- `--from-date`: Start date (ISO format)
- `--to-date`: End date (ISO format)
- `--access-token`: Gmail API access token

**Database Population** (`npm run populate-events`):
- `--input`: Load from JSON file
- `--scrape`: Scrape emails before populating
- `--query`: Gmail search query (only with --scrape)
- `--max-results`: Max emails (only with --scrape)
- `--access-token`: Gmail API token (only with --scrape)
- `--dry-run`: Preview changes without modifying database

## Admin Setup

To create an admin user:

1. The first user must be created manually in the database with `role = "admin"`
2. Alternatively, modify the Better Auth configuration to set default role to "admin" temporarily

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/
│   ├── auth/        # Authentication utilities
│   ├── email/       # Email parsing utilities
│   └── gcal/        # Google Calendar format utilities
├── scripts/         # Data scraping scripts
├── server/
│   ├── api/         # tRPC routers
│   └── db/          # Database schema and connection
└── styles/          # Global styles
```

## Key Features Explained

### Anonymous Sessions

Users can browse events and save shifts to their cart without creating an account. The cart is tied to their session ID, allowing a seamless browsing experience.

### Admin-Only Routes

The `/sync` page and certain API endpoints are protected and only accessible to users with the `admin` role. The middleware automatically redirects unauthorized users.

### Mock Calendar API

The application uses a mock Google Calendar API layer that reads from the database instead of making external API calls. This maintains compatibility with the existing `CmoEvent` class while eliminating external dependencies.

### Type-Safe API

tRPC provides end-to-end type safety from the database to the frontend, ensuring data consistency and reducing runtime errors.

## Database Schema

Main tables:
- `events`: Concert/event information
- `shifts`: Individual shift assignments
- `savedShifts`: User cart items (linked to session ID)
- `users`: User accounts (admin only)
- `syncs`: Sync operation tracking

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run db:push`: Push database schema changes
- `npm run db:studio`: Open Drizzle Studio
- `npm run scrape-emails`: Scrape events from emails
- `npm run populate-events`: Populate database with scraped events

## Deployment

This application is designed to be deployed on Vercel with a Turso database:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

This is a portfolio project. Please contact the author for usage permissions.

## Contact

Created by [Your Name] - [Your Email]

Project Link: [https://github.com/yourusername/cmo-webapp](https://github.com/yourusername/cmo-webapp)
