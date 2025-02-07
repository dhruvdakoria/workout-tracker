# 💪 Workout Tracker App

A modern, full-stack workout tracking application built with React, TypeScript, and Supabase. Track your workouts, monitor progress, and achieve your fitness goals with an intuitive and responsive interface.

## 🌟 Features

- **User Authentication**: Secure login and registration system using Supabase Auth
- **Workout Logging**: 
  - Log exercises with sets, reps, and weights
  - Track rest periods between sets
  - Add notes to workouts
  - Real-time validation and data persistence
- **Progress Tracking**:
  - Visual charts and graphs showing workout history
  - Track personal records (PRs)
  - View historical workout data
- **Dashboard**:
  - Overview of recent workouts
  - Quick access to common exercises
  - Progress summaries and statistics
- **Mobile-First Design**:
  - Responsive UI that works seamlessly on all devices
  - Touch-friendly interface
  - Optimized for use during workouts

## 🛠️ Tech Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite for fast development and building
  - TailwindCSS for styling
  - Shadcn UI components
  - React Query for data fetching and caching
  - React Router for navigation
  - React Hook Form for form management
  - Recharts for data visualization

- **Backend**:
  - Supabase for database and authentication
  - PostgreSQL for data storage
  - Row Level Security for data protection

## 📁 Project Structure

```
workout-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── lib/          # Utility functions and configurations
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.tsx       # Main application component
├── shared/                # Shared TypeScript types and schemas
├── supabase/             # Supabase configurations and migrations
└── ...configuration files
```

### Key Components and Files

- `pages/log-workout.tsx`: Main workout logging interface
- `pages/dashboard.tsx`: User dashboard with workout summaries
- `pages/progress.tsx`: Progress tracking and visualization
- `components/workout/`: Exercise and set tracking components
- `lib/supabase.ts`: Supabase client configuration
- `lib/queryClient.ts`: React Query configuration
- `schema.ts`: Database and type definitions

## 🚀 Getting Started

1. **Prerequisites**:
   - Node.js 16+
   - npm or yarn
   - Supabase account

2. **Installation**:
   ```bash
   # Clone the repository
   git clone https://github.com/dhruvdakoria/workout-tracker.git
   cd workout-tracker

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env
   # Fill in your Supabase credentials
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   ```

## 🔐 Environment Variables

Required environment variables in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## 🧹 Code Cleanup Recommendations

The following files/components can be removed or consolidated:

1. `hooks/use-mobile.ts` and `hooks/use-mobile.tsx` - Duplicate files, keep only the `.ts` version
2. Several unused UI components in `components/ui/` that aren't actively used in the application:
   - `breadcrumb.tsx`
   - `carousel.tsx`
   - `collapsible.tsx`
   - `input-otp.tsx`
   - `menubar.tsx`
   - `pagination.tsx`
   - `resizable.tsx`
   These components were included from the shadcn UI library but aren't currently used in the application.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## �� Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [React Query](https://tanstack.com/query/latest) for data management 