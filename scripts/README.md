# Scripts

CLI tools for managing tracking links and viewing engagement metrics. All scripts query DynamoDB directly using the `secure-portfolio-operator` AWS profile.

## Prerequisites

- Node.js 18+
- AWS credentials configured for the `secure-portfolio-operator` profile in `~/.aws/credentials`

## Setup

```bash
cd scripts
npm install
```

## manage-links

Create, list, and revoke tracking links.

```bash
npm run manage-links -- <create|list|revoke> [flags]
```

### Create a link

```bash
npm run manage-links -- create --company "Spotify" --role technical_architect
```

Generates a slug like `spotify-a8x3k2`, writes the link to DynamoDB, and prints the full portfolio URL. Use `--slug custom-slug` to specify a custom slug instead of auto-generating one.

The `--role` value must match an existing role version in DynamoDB (e.g., `technical_architect`, `full_stack_engineer`).

### List links

```bash
npm run manage-links -- list
npm run manage-links -- list --status active
npm run manage-links -- list --company "Spotify"
npm run manage-links -- list --status revoked --company "Spotify"
```

### Revoke a link

```bash
npm run manage-links -- revoke --slug spotify-a8x3k2
```

Prompts for confirmation, then sets the link status to `revoked`. Revoked links return a 404 when visited.

## view-metrics

Query visit and engagement data for tracking links.

```bash
npm run view-metrics [-- --slug <slug>] [-- --company <name>]
```

### Summary of all links

```bash
npm run view-metrics
```

Prints a table with visit counts, total heartbeats, and last visit time for every link.

### Filter by company

```bash
npm run view-metrics -- --company "Spotify"
```

### Detailed view for a single link

```bash
npm run view-metrics -- --slug spotify-a8x3k2
```

Shows per-visit breakdown with visit ID, timestamp, heartbeat count, IP, and user agent.

## seed

Populate DynamoDB tables with slide content, role versions, and initial tracking links.

```bash
cp seed-data.example.json seed-data.json   # fill in your content
npx tsx seed.ts
```

## Environment Variables

All scripts use sensible defaults for the dev environment. Override with environment variables if needed:

| Variable | Default | Used by |
|---|---|---|
| `AWS_PROFILE` | `secure-portfolio-operator` (set in package.json scripts) | all |
| `AWS_REGION` | `us-east-1` | all |
| `TRACKING_TABLE` | `secure-portfolio-dev-tracking-links` | manage-links, view-metrics |
| `ROLES_TABLE` | `secure-portfolio-dev-role-versions` | manage-links |
| `SLIDES_TABLE` | `secure-portfolio-dev-portfolio-slides` | seed |
| `BASE_URL` | `https://main.dkf5fstrk9fic.amplifyapp.com` | manage-links (URL output) |
