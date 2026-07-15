# Overload

Train. Track. Progress.

Overload is a focused progressive-overload workout tracker built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL, Recharts, and Lucide icons. It is installable from iPhone Safari as a Progressive Web App and deploys normally to Vercel Hobby.

## Local Setup

1. Install Node.js 20 or newer.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Supabase project at `https://supabase.com`.
4. Open the Supabase SQL editor.
5. Run the full SQL file at `supabase/migrations/001_initial_schema.sql`.
6. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
7. Add your Supabase Project URL and anonymous/public key:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
8. Start the dev server:
   ```bash
   npm run dev
   ```
9. Open `http://localhost:3000`.

## Supabase Setup

- **Project URL:** Supabase dashboard -> Project Settings -> API -> Project URL.
- **Anonymous/public key:** Supabase dashboard -> Project Settings -> API -> Project API keys -> anon public.
- **SQL editor:** Supabase dashboard -> SQL Editor -> New query, then paste and run `supabase/migrations/001_initial_schema.sql`.
- **Authentication settings:** Supabase dashboard -> Authentication -> Providers and Authentication -> URL Configuration.

Email confirmation can affect local testing. If confirmation is enabled, users must confirm their email before sign-in works. For local-only testing, you can disable confirmation in Supabase Authentication settings or manually confirm test users in Authentication -> Users.

The migration enables Row Level Security on all user-data tables and creates policies so users can only access their own profiles, exercises, templates, sessions, session exercises, and sets.

## Vercel Deployment

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Let Vercel detect Next.js automatically.
4. Add these environment variables in Vercel Project Settings -> Environment Variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
5. Apply the variables to Production, Preview, and Development as appropriate.
6. Deploy.
7. Add the Vercel production URL to Supabase Authentication -> URL Configuration -> Redirect URLs.
8. Test registration, login, template creation, workout completion, history, and progress charts in production.

No service-role key is required or used. Do not add one to Vercel for this app.

## iPhone Installation

1. Open the deployed URL in Safari.
2. Tap the Share icon.
3. Tap Add to Home Screen.
4. Confirm the app name and tap Add.
5. Open Overload from the home screen and verify it launches without Safari browser chrome.

iOS does not allow a website to trigger installation automatically; the Safari share-sheet flow is required.

## Verification Checklist

- [ ] User can sign up.
- [ ] User can log in.
- [ ] User can create a workout.
- [ ] User can add exercises.
- [ ] User can start a workout.
- [ ] User can enter weight and repetitions.
- [ ] User can complete sets.
- [ ] User can finish the workout.
- [ ] History displays the session.
- [ ] Progress chart displays the exercise data.
- [ ] Another user cannot access the first user's data.
- [ ] The application can be installed on iPhone.
- [ ] Production build succeeds with `npm run build`.

## Useful Commands

```bash
npm run dev
npm run lint
npm test
npm run build
npm start
```

## Project Structure

```text
app/
  (auth)/login/
  (app)/
    page.tsx
    workouts/
    session/[id]/
    history/
    progress/
  auth/callback/
  manifest.ts
  layout.tsx
  globals.css
components/
  ui/
  active-workout-screen.tsx
  app-shell.tsx
  bottom-navigation.tsx
  progress-explorer.tsx
  workout-template-editor.tsx
lib/
  actions/
  calculations/
  formatting/
  supabase/
  types/
  validation/
public/
  sw.js
  offline.html
  icon.svg
supabase/
  migrations/001_initial_schema.sql
```

## Progressive Overload Calculations

- Set volume: `weight * reps`.
- Maximum weight: greatest completed set weight in the session.
- Best repetitions: greatest completed set repetition count in the session.
- Best set volume: greatest `weight * reps` completed set in the session.
- Total session volume: sum of `weight * reps` across completed sets for that exercise.
- Estimated one-rep max: Epley formula, `weight * (1 + reps / 30)`, ignoring zero weight or zero reps.
- Percentage change: `((latestValue - previousValue) / previousValue) * 100`, safely returning `0` when previous is missing or zero.

## Offline Behaviour

The service worker caches a small application shell and static Next assets. Authenticated Supabase data is online-first and is not aggressively cached. If the network drops, Overload shows an offline indicator and avoids claiming unsynced changes were saved.

## Security Notes

- `.env.local` is ignored by Git.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used in the browser.
- Server actions derive the current user from Supabase Auth and do not trust client-provided `user_id`.
- Supabase Row Level Security protects database access even if a client calls the API directly.
- The service worker avoids caching API/auth routes.
