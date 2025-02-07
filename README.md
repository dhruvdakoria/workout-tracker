# Workout Tracker App

A modern workout tracking application built with React, Vite, and Supabase.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Radix UI components
- React Query for data fetching
- React Hook Form for form handling

### Backend
- Supabase (PostgreSQL Database)
- Database URL: https://hreynnwxahhtuebohctk.supabase.co

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgres://[YOUR-SUPABASE-CONNECTION-STRING]
   ```
   Get the connection string from your Supabase project:
   - Go to Project Settings > Database
   - Find the "Connection string" section
   - Copy the connection string and replace [YOUR-PASSWORD] with your database password

3. **Database Migrations**
   ```bash
   npm run db:push
   ```
   This will push the database schema to your Supabase instance.

4. **Development**
   ```bash
   npm run dev
   ```
   This will start the development server.

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
workout-tracker/
├── client/           # Frontend React application
├── shared/           # Shared types and utilities
├── drizzle.config.ts # Database configuration
├── vite.config.ts    # Vite configuration
└── package.json      # Project dependencies and scripts
```

## Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM.

## Development Guidelines

1. All frontend code goes in the `client/` directory
2. Shared types and utilities should be placed in `shared/`
3. Use the provided UI components from Radix UI for consistency
4. Follow the TypeScript patterns established in the codebase

## Deployment

The application can be deployed to any platform that supports Node.js applications. The frontend is built using Vite and served through the same process.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT 