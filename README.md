# Recipe Sharing App - Next.js + Supabase

A modern, full-stack recipe sharing platform built with Next.js 14 and Supabase. Share recipes, write blog posts, and engage with a community of food enthusiasts.

## Features

### Core Functionality
- **Recipe Management**: Create, edit, and share recipes with images, ingredients, and cooking instructions
- **Rich Text Editor**: TipTap editor with support for images, links, YouTube videos, and audio recordings
- **Blog Platform**: Write and publish blog posts with categories and tags
- **Social Features**: Like recipes and blog posts, follow other users, leave comments
- **Advanced Search**: Search recipes by title, ingredients, dietary restrictions, and more
- **Cooking Progress Tracker**: Step-by-step cooking mode with wake lock support
- **Audio Recording**: Record cooking notes directly in the editor

### Technical Highlights
- **Next.js 14 App Router**: Modern React framework with server components
- **Supabase Backend**: PostgreSQL database with Row Level Security (RLS)
- **TypeScript**: Full type safety across the application
- **React Query**: Efficient data fetching and caching
- **Tailwind CSS**: Utility-first styling with custom design system
- **WCAG AA Accessibility**: Comprehensive accessibility features including:
  - Screen reader support
  - Keyboard navigation (Cmd+K search shortcut)
  - Skip-to-content link
  - ARIA labels and roles
  - Proper form validation announcements

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Rich Text**: TipTap, RecordRTC
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Deployment**: Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/riikka-kallio/recipe-app-nextjs.git
   cd recipe-app-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   Follow the detailed guide in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md)
   
   Quick overview:
   - Create a new Supabase project
   - Run the database migrations from the `database/` folder
   - Set up storage buckets (see [`docs/STORAGE_SETUP.md`](docs/STORAGE_SETUP.md))
   - Configure Row Level Security (see [`docs/RLS_IMPLEMENTATION_GUIDE.md`](docs/RLS_IMPLEMENTATION_GUIDE.md))

4. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to see the app.

### Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
recipe-app-nextjs/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── LoadingPlaceholder.tsx
│   ├── RecipeCard.tsx       # Recipe display component
│   ├── BlogPostCard.tsx     # Blog post component
│   ├── Navigation.tsx       # Main navigation
│   ├── TipTapEditor.tsx     # Rich text editor
│   └── AudioRecorder.tsx    # Audio recording component
├── lib/                     # Utilities and configuration
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── admin.ts        # Admin client
│   ├── services/           # API services
│   │   ├── api.ts          # Base API client
│   │   ├── recipeService.ts
│   │   └── blogService.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useRecipes.ts
│   │   ├── useBlog.ts
│   │   ├── useCookingProgress.ts
│   │   ├── useWakeLock.ts
│   │   └── useAudioRecorder.ts
│   ├── types/              # TypeScript definitions
│   ├── utils.ts            # Utility functions
│   └── providers.tsx       # React Query provider
├── database/               # Database migrations
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Database Schema

The app uses 13 Supabase tables with comprehensive RLS policies:

- **users**: User profiles and authentication
- **recipes**: Recipe data with metadata
- **blog_posts**: Blog post content
- **categories**: Recipe and blog categories
- **comments**: User comments on recipes/posts
- **likes**: User likes tracking
- **follows**: User follow relationships
- **cooking_progress**: Step-by-step cooking tracking
- And more...

See [`docs/UUID_MIGRATION_GUIDE.md`](docs/UUID_MIGRATION_GUIDE.md) for details on the UUID-based architecture.

## Accessibility

This app is built with accessibility as a priority, following WCAG AA guidelines:

- ✅ Semantic HTML structure
- ✅ ARIA labels and roles for all interactive elements
- ✅ Keyboard navigation support (Tab, Enter, Escape, Cmd+K)
- ✅ Skip-to-content link for screen reader users
- ✅ Screen reader announcements for loading states and errors
- ✅ Proper form label associations
- ✅ Focus visible indicators on all interactive elements
- ✅ Color contrast ratios meeting WCAG AA standards

## Migration Progress

This project is a migration from a Vite + React + Express + PostgreSQL stack to Next.js + Supabase.

**Completed Phases:**
- ✅ Phase 1: Foundation & Setup (Supabase, database, RLS, UUID migration, base UI)
- ✅ Phase 2: Components & Hooks (services, React Query, TipTap editor, feature components)
- ✅ Phase 2 Cleanup: Accessibility improvements & GitHub deployment
- ✅ Phase 3: API Routes (15 Next.js routes, Supabase queries, file uploads)

**Upcoming Phases:**
- 📋 Phase 4: Frontend Pages (React Router → App Router)
- 📋 Phase 5: Testing (Playwright test migration)
- 📋 Phase 6: Deployment (Vercel)
- 📋 Phase 7: Authentication (Supabase Auth integration)

See [`docs/PHASE_1_COMPLETE.md`](docs/PHASE_1_COMPLETE.md), [`docs/PHASE_2_COMPLETE.md`](docs/PHASE_2_COMPLETE.md), and [`docs/PHASE_3_COMPLETE.md`](docs/PHASE_3_COMPLETE.md) for detailed migration notes.

## Documentation

- [Supabase Setup Guide](docs/SUPABASE_SETUP.md)
- [Storage Setup Guide](docs/STORAGE_SETUP.md)
- [RLS Implementation Guide](docs/RLS_IMPLEMENTATION_GUIDE.md)
- [UUID Migration Guide](docs/UUID_MIGRATION_GUIDE.md)
- [Phase 1 Completion Report](docs/PHASE_1_COMPLETE.md)
- [Phase 2 Completion Report](docs/PHASE_2_COMPLETE.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## License

MIT License - feel free to use this project for learning or as a starting point for your own recipe app!

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)
- Rich text editing by [TipTap](https://tiptap.dev/)

---

**Status**: 🚧 Under active development - Phase 2 complete, Phase 3 coming soon!
