# Payload Turbo App

A Turborepo monorepo with **Payload CMS** and multiple **Next.js** front-end applications. All front-end apps use **Tailwind CSS** and **ShadCN-style UI** (shared `@repo/ui` package).

## Structure

```
payload-turbo-app/
├── apps/
│   ├── cms/              # Payload CMS (Next.js + Payload, port 3001)
│   ├── site/             # Marketing landing, login, dashboard (port 3000)
│   ├── image-choice/     # Time-based image selection (port 3002)
│   ├── content-rank/     # ScreamingFrog + GA4 page ranking: move/lost/reuse (port 3003)
│   ├── slider/           # Slider between two ideas; records proximity (port 3004)
│   ├── survey/           # Survey with tabulated results (port 3005)
│   └── fill-blank/       # Fill-in-the-blank text boxes (port 3006)
├── packages/
│   ├── ui/               # Shared ShadCN-style components (Button, Card, cn)
│   ├── typescript-config/
│   └── eslint-config/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Requirements

- **Node.js** 20.9+
- **pnpm** 9+
- **MongoDB** (for Payload CMS; default `mongodb://localhost:27017/payload-turbo`)

## Setup

1. **Install dependencies**

   ```bash
   cd payload-turbo-app
   pnpm install
   ```

2. **Configure CMS**

   Copy the CMS env example and set your secret and database URL:

   ```bash
   cp apps/cms/.env.example apps/cms/.env
   # Edit apps/cms/.env: PAYLOAD_SECRET, DATABASE_URI (or MONGODB_URI)
   ```

3. **Run all apps in development**

   ```bash
   pnpm dev
   ```

   This starts every app; open:

   - **Site (landing, login, dashboard):** http://localhost:3000  
   - **Payload Admin:** http://localhost:3001/admin  
   - **Image choice:** http://localhost:3002  
   - **Content rank:** http://localhost:3003  
   - **Slider:** http://localhost:3004  
   - **Survey:** http://localhost:3005  
   - **Fill in the blank:** http://localhost:3006  

## Run a single app

```bash
pnpm --filter @repo/cms dev
pnpm --filter @repo/site dev
pnpm --filter @repo/image-choice dev
# etc.
```

## Build

```bash
pnpm build
```

## Apps overview

| App           | Port | Purpose |
|---------------|------|--------|
| **cms**       | 3001 | Payload admin + REST/GraphQL API. Create users and content here. |
| **site**      | 3000 | Marketing landing page, login page, user dashboard (links to other apps). |
| **image-choice** | 3002 | User selects between two images; time and choice can be stored. |
| **content-rank** | 3003 | Admin uploads ScreamingFrog crawl + GA4 report; pages ranked as move/lost/reuse. |
| **slider**    | 3004 | Slider between two ideas; position (closeness to each) is recorded. |
| **survey**    | 3005 | User completes questions; results can be tabulated (e.g. in Payload). |
| **fill-blank**| 3006 | User fills in text boxes; answers can be stored. |

## Authentication

- **Payload** has a built-in **Users** collection with `auth: true` (email + password).
- The **site** login page is a stub; wire it to Payload’s `/api/users/login` (or your auth provider) and protect dashboard/app routes as needed.

## Next steps

- Add Payload collections for: image-choice results, content-rank uploads/results, slider responses, survey questions/answers, fill-blank prompts/answers.
- Point site login to Payload auth (or NextAuth/similar) and add session handling.
- In **content-rank**, implement upload + parsing for ScreamingFrog and GA4 exports and the ranking logic.
- Add more ShadCN components to `packages/ui` and use them across apps.
