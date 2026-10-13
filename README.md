# NexBotix web app

Next.js (App Router) front end for [nexbotix.online](https://nexbotix.online).

## Commands

```bash
pnpm dev         # http://localhost:3000
pnpm build       # production build (type-checks too)
pnpm start       # serve the build
pnpm typecheck
```

## How it is put together

- `app/[[...slug]]/page.tsx` serves every URL.
  - **Public pages** (listed in `src/seo/site.ts` → `PUBLIC_PAGES`, plus every blog post) are prerendered: the React Router app in `src/SpaApp.tsx` renders on the server with a `StaticRouter` and hydrates in the browser with a `BrowserRouter`.
  - **App routes** (first segment in `APP_SEGMENTS`) render client-only and are `noindex`.
  - Anything else returns a real 404 (`app/not-found.tsx`).
- `src/seo/site.ts` is the single source for titles and descriptions; `usePageSEO()` reads the same entries during client-side navigation.
- `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt`.
- `/api/*` and `/.well-known/*` are proxied to `https://api.nexbotix.online` (`next.config.ts`).
- Screen components live in `src/views` (not `src/pages`, which Next.js would treat as the Pages Router).

## Adding a public page

1. Add the route in `src/SpaApp.tsx`.
2. Add its entry to `PUBLIC_PAGES` in `src/seo/site.ts` and call `usePageSEO('/path')` in the component.

## Environment

The existing `VITE_*` variables still work; `next.config.ts` maps them to `NEXT_PUBLIC_*`.
