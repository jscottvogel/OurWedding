# WeddingSteward

A wedding planning platform built with Next.js 14 (App Router), Tailwind CSS and an AWS Amplify Gen 2 backend (Cognito, AppSync/DynamoDB, S3, Lambda, SES). Couples get a planning dashboard and a public wedding website at `/w/[slug]`.

## Requirements

- Node.js 20+ and npm 10+
- An AWS account with credentials configured (`aws configure sso` / `aws sso login`) for backend work

## Project layout

| Path | Contents |
| --- | --- |
| `src/app` | Next.js routes: marketing, `(auth)`, `(dashboard)`, `(portal)`, the public site `w/[slug]`, and `api/` |
| `src/components`, `src/lib` | UI components, hooks, server actions, Amplify clients |
| `amplify/` | Amplify Gen 2 backend (auth, data schema, storage, functions) |
| `docs/` | Product roadmap, SEO/Stripe plans, prompts |
| `tools/` | One-off maintenance scripts. They aren't part of the app build and are excluded from tsconfig and ESLint |

## Local setup

```bash
npm ci
cp .env.example .env.local   # then fill in values
```

### `amplify_outputs.json`

The frontend imports `amplify_outputs.json` from the repo root. The file is **git-ignored** and is produced by the Amplify backend. You can get it in one of three ways:

1. **Sandbox (recommended for development):** `npx ampx sandbox` deploys a personal backend and writes the real file.
2. **Existing branch:** `npx ampx generate outputs --app-id <APP_ID> --branch <BRANCH>`.
3. **Offline stub:** if you only need to type-check or build without AWS, create a stub with placeholder values (`version: "1.3"`, plus `auth`, `data` with `url`/`api_key`/an empty `model_introspection`, and `storage`). The build passes, but every API call fails at runtime.

TypeScript types for data models come from `amplify/data/resource.ts` (`Schema`), not from `model_introspection`. That is why an empty stub is enough to type-check.

### Run

```bash
npm run dev      # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build
```

The build does **not** ignore TypeScript or ESLint errors. Fix them before you push.

## Environment variables

See [.env.example](.env.example). In Amplify Hosting, set these under **App settings → Environment variables**.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical base URL for the sitemap, robots and absolute links |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Public | Apex domain for wedding subdomains (`<slug>.<root>`), used by middleware and emails |
| `NEXT_PUBLIC_DEMO_ENABLED` | Public | `true` shows the demo login button. Keep it in sync with `DEMO_ENABLED` |
| `INTERNAL_API_SECRET` | Server | Shared secret the Next.js server sends to the public-site Lambda. Must equal the Amplify secret of the same name |
| `SITE_COOKIE_SECRET` | Server | HMAC key for the cookie issued after a wedding-site password is verified |
| `SES_FROM_ADDRESS` | Server | Verified SES sender for RSVP confirmations |
| `DEMO_ENABLED` | Server | `true` enables `/api/demo/login` |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | Server | Credentials for the demo account, used only server-side |
| `AWS_REGION` | Server | Region for server-side SDK clients. Amplify Hosting sets this automatically |

`NEXT_PUBLIC_*` values are inlined at build time, so a change needs a rebuild.

### Amplify backend secrets

Lambda functions read these through `secret()`. They are not environment variables:

| Secret | Used by | Purpose |
| --- | --- | --- |
| `INTERNAL_API_SECRET` | `public-site` function | Must match the frontend's `INTERNAL_API_SECRET` |
| `DEMO_USER_SUB` | `reset-demo` function | Cognito `sub` of the demo user (owner of the demo wedding) |

```bash
npx ampx sandbox secret set INTERNAL_API_SECRET
npx ampx sandbox secret set DEMO_USER_SUB
```

For branch deployments, set them under **Amplify console → Hosting → Secrets**.

## Data access model

Wedding-scoped records carry an `owners` array of Cognito subs (`allow.ownersDefinedIn('owners').identityClaim('sub')`). Some models also have a read-only `readers` array.

- The client passes `owners: await getWeddingOwners(weddingId)` ([weddingOwners.ts](src/lib/amplify/weddingOwners.ts)) on every create, so all collaborators can see the record.
- Onboarding creates the `Wedding` with `owners = [creator sub]`.
- Invites append the invitee's sub.
- Public wedding sites use the API key, and only for public models.
- Guests and vendors are owner-only. RSVPs and password checks go through `/api/rsvp/*` and `/api/website/*`, which call the backend with `INTERNAL_API_SECRET`.

## Deploying

### Sandbox (per-developer backend)

```bash
npx ampx sandbox secret set INTERNAL_API_SECRET   # once per sandbox
npx ampx sandbox secret set DEMO_USER_SUB         # once, if you use the demo
npx ampx sandbox             # watch mode; writes amplify_outputs.json
npx ampx sandbox delete      # tear down
```

Put the same `INTERNAL_API_SECRET` and a `SITE_COOKIE_SECRET` into `.env.local`, then run `npm run dev`.

### Production (Amplify Hosting)

1. In the Amplify console, connect this GitHub repo and choose the production branch.
2. Add the backend secrets (`INTERNAL_API_SECRET`, and `DEMO_USER_SUB` if you use the demo) under **Hosting → Secrets** before the first deploy.
3. Set the environment variables listed above. `INTERNAL_API_SECRET` must match the secret.
4. Deploy. Amplify uses [amplify.yml](amplify.yml):
   - The backend phase runs `npm ci` and `ampx pipeline-deploy`, which deploys the backend and generates `amplify_outputs.json`.
   - The frontend phase reuses that install and runs `npm run build`.
5. Add the custom domain under **Hosting → Custom domains**. For wedding subdomains, add a wildcard `*` subdomain that matches `NEXT_PUBLIC_ROOT_DOMAIN`.
6. Verify the SES identity for `SES_FROM_ADDRESS` and request SES production access before sending email.
7. Existing data created before the `owners` migration has no `owners`. Backfill it from each record's `Wedding.owners` before cutover, or those records are hidden from collaborators.

### API key rotation

Public wedding sites read data through the AppSync API key, and the key has an expiry. Before it expires, change `expiresInDays` in `amplify/data/resource.ts` and redeploy. Amplify issues a new key and updates `amplify_outputs.json`.

## Security headers

`next.config.mjs` sends these headers on every route:

- HSTS
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors 'self'`

There is deliberately no strict `script-src` CSP, because couples can add custom code to their public sites.
