# Secure Portfolio — Frontend

Next.js app that renders a role-specific, slide-based portfolio from the backend API. Each visitor arrives via a unique tracking link (`?r=slug`), which is validated server-side before any content is rendered.

## Stack

- Next.js 15 (App Router, server components)
- Tailwind CSS v4
- shadcn/ui (dark theme, zinc base)
- TypeScript

## How It Works

1. Visitor hits `/portfolio?r=<slug>`
2. Server component calls `GET /api/portfolio?r=<slug>` to validate the link and fetch role-specific content
3. Invalid or missing slug → 404
4. Valid slug → renders intro and project slides, tailored to the role version associated with that link
5. Client-side heartbeat pings `POST /api/heartbeat` every 30 seconds for engagement tracking

## Development

```bash
npm install
npm run dev
```

Requires `.env.local` with:

```
API_ENDPOINT=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_API_ENDPOINT=https://<api-gateway-id>.execute-api.us-east-1.amazonaws.com/dev
```

In production, these are set automatically by Terraform via Amplify environment variables.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout: dark theme, fonts, Toaster
│   ├── not-found.tsx         # Custom 404
│   └── portfolio/
│       └── page.tsx          # Server component: fetch + validate + render
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── portfolio-viewer.tsx  # Client wrapper: slide state, navigation, keyboard
│   ├── slide-nav.tsx         # Top nav bar: dropdown, arrows, position indicator
│   ├── intro-slide.tsx       # Intro: headline stats, positioning, portfolio note
│   ├── project-slide.tsx     # Project slide layout
│   ├── image-gallery.tsx     # Image carousel with click-to-enlarge lightbox
│   └── welcome-toast.tsx     # Welcome toast with confidentiality notice
├── hooks/
│   ├── use-heartbeat.ts      # Background heartbeat hook
│   └── use-prefetch-images.ts # Prefetch slide images on mount
└── lib/
    ├── types.ts              # Portfolio API response types
    └── utils.ts              # shadcn utility
```
