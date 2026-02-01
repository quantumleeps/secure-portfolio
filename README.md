# Secure Portfolio

A hosted portfolio website with private, tracked access. Each job application includes a unique tracking link. When a recruiter or hiring manager visits, the system validates the link server-side, serves a role-specific slide-based presentation, and records engagement metrics. Invalid or missing links return a 404. No API keys, validation logic, or tracking details are ever exposed to the client.

## How It Works

1. A unique link is generated for each job application (e.g., `https://danleeper.com/portfolio?r=spotify-382z3k`).
2. The recruiter clicks the link. The Next.js app makes a **server-side** call to API Gateway.
3. A Lambda function queries DynamoDB to validate the `?r=` slug.
4. If the slug is valid, Lambda returns the portfolio slides for that link's assigned role version and records the visit.
5. If the slug is invalid or missing, the app renders a 404 page.
6. Once the page loads, a lightweight client-side heartbeat pings the backend every 30 seconds to track time-on-page and engagement.

## Architecture

```
                         +---------------------------+
                         |        DynamoDB           |
                         |  (slides + visit data)    |
                         +-------------+-------------+
                                       |
                                       v
+----------+      +----------------+   +-------------+
|          | ---> |  Amplify /     |-->| API Gateway  |
|  Browser |      |  Next.js (SSR) |   +------+------+
|          | <--- |                |          |
+----+-----+      +----------------+          v
     |                                  +-----------+
     |  heartbeat pings (POST)          |  Lambda   |
     +--------------------------------->| Functions |
           (via API Gateway)            +-----------+
```

## Tech Stack

- **Frontend**: Next.js (SSR, App Router)
- **Hosting**: AWS Amplify (CloudFront, Lambda@Edge, S3 — managed)
- **Backend**: AWS Lambda, API Gateway, DynamoDB
- **IaC**: Terraform
- **CLI Tools**: Bash / Node scripts

## Project Structure

```
secure-portfolio/
├── app/              # Next.js portfolio application
├── iac/              # Terraform infrastructure-as-code
│   ├── bootstrap/    # One-time setup (S3 state bucket, DynamoDB lock table)
│   ├── environments/ # Per-environment configs (dev, prod)
│   └── modules/      # Reusable Terraform modules (DynamoDB, Lambda, API GW)
├── internal-docs/    # Internal planning docs (gitignored)
├── scripts/          # CLI tools for link management and metrics
├── .gitignore
└── README.md
```

## Key Concepts

**Slide-Based Presentation** — The portfolio is a series of slides, each showcasing a project or topic. Each slide contains a title, subtitle, narrative sections (challenge, what was built, impact), tech stack tags, and an image. Slide content is stored as JSON in DynamoDB.

**Role-Based Versions** — The portfolio exists in 2-3 variants tailored to different role types (e.g., `technical_architect`, `full_stacK_engineer`). Each version defines an ordered list of slide IDs — controlling which slides appear and in what sequence. All versions draw from the same pool of slides.

**Tracking Links** — Every link contains a unique slug tied to a specific company and role version. Links are managed via a CLI script and stored in DynamoDB. A link that has not been created returns a 404 — there is no generic or fallback portfolio.

**Engagement Metrics** — After the portfolio renders, a lightweight heartbeat fires every 30 seconds to record time-on-page. Visit metadata (timestamp, referrer, user-agent) is captured on the initial server-side validation call. All tracking data is queryable via a CLI script.

## Scripts

Two planned CLI tools in `scripts/`:

- **manage-links** — Create, list, and revoke tracking links for company/role combinations. Writes records to DynamoDB and prints the full URL on creation.
- **view-metrics** — Query DynamoDB for visit and engagement data. Supports filtering by link slug, company, or date range.
