import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import "./load-env.js";

const envIndex = process.argv.indexOf("--env");
const env = envIndex !== -1 ? process.argv[envIndex + 1] : "dev";
if (env !== "dev" && env !== "prod") {
  console.error('Invalid --env value. Use "dev" or "prod".');
  process.exit(1);
}

const prefix = `secure-portfolio-${env}`;
const TRACKING_TABLE =
  process.env.TRACKING_TABLE || `${prefix}-tracking-links`;

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);

interface Visit {
  visit_id: string;
  visited_at: string;
  heartbeats: number;
  user_agent?: string;
  referrer?: string;
  ip?: string;
}

interface LinkSummary {
  slug: string;
  company: string;
  role_version: string;
  status: string;
  created_at: string;
  total_visits: number;
  total_heartbeats: number;
  visits: Visit[];
}

function parseArgs(argv: string[]): Record<string, string> {
  const args = argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      flags[key] = val;
      if (val !== "true") i++;
    }
  }
  return flags;
}

function summarize(item: Record<string, unknown>): LinkSummary {
  const visits = (item.visits ?? {}) as Record<
    string,
    { heartbeats: number; visited_at: string; user_agent?: string; referrer?: string; ip?: string }
  >;
  const visitList = Object.entries(visits).map(([id, v]) => ({
    visit_id: id,
    ...v,
  }));
  return {
    slug: item.slug as string,
    company: item.company as string,
    role_version: item.role_version as string,
    status: item.status as string,
    created_at: item.created_at as string,
    total_visits: visitList.length,
    total_heartbeats: visitList.reduce(
      (sum, v) => sum + (v.heartbeats ?? 0),
      0
    ),
    visits: visitList,
  };
}

async function fetchBySlug(slug: string): Promise<LinkSummary | null> {
  const result = await client.send(
    new GetCommand({ TableName: TRACKING_TABLE, Key: { slug } })
  );
  return result.Item ? summarize(result.Item) : null;
}

async function fetchAll(
  company?: string
): Promise<LinkSummary[]> {
  const scanInput: ScanCommandInput = { TableName: TRACKING_TABLE };
  if (company) {
    scanInput.FilterExpression = "company = :company";
    scanInput.ExpressionAttributeValues = { ":company": company };
  }

  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    if (lastKey) scanInput.ExclusiveStartKey = lastKey;
    const result = await client.send(new ScanCommand(scanInput));
    items.push(...(result.Items ?? []));
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return items.map(summarize);
}

function formatTable(links: LinkSummary[]): void {
  links.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const header = [
    "SLUG".padEnd(28),
    "COMPANY".padEnd(20),
    "ROLE".padEnd(24),
    "STATUS".padEnd(10),
    "VISITS".padStart(6),
    "HEARTBEATS".padStart(10),
    "LAST VISIT".padEnd(20),
  ].join("  ");

  console.log(`\n${header}`);
  console.log("-".repeat(header.length));

  for (const link of links) {
    const lastVisit = link.visits.length
      ? link.visits.reduce((latest, v) =>
          v.visited_at > latest.visited_at ? v : latest
        ).visited_at.slice(0, 19)
      : "never";

    const row = [
      link.slug.padEnd(28),
      link.company.padEnd(20),
      link.role_version.padEnd(24),
      link.status.padEnd(10),
      String(link.total_visits).padStart(6),
      String(link.total_heartbeats).padStart(10),
      lastVisit.padEnd(20),
    ].join("  ");
    console.log(row);
  }

  console.log(`\n${links.length} link(s)`);
}

function formatDetail(link: LinkSummary): void {
  console.log(`\nLink: ${link.slug}`);
  console.log(
    `Company: ${link.company}  |  Role: ${link.role_version}  |  Status: ${link.status}`
  );
  console.log(`Created: ${link.created_at}`);
  console.log(
    `\nTotal visits: ${link.total_visits}  |  Total heartbeats: ${link.total_heartbeats}`
  );

  if (link.visits.length === 0) {
    console.log("\nNo visits recorded.");
    return;
  }

  link.visits.sort((a, b) => b.visited_at.localeCompare(a.visited_at));

  const header = [
    "VISIT ID".padEnd(38),
    "VISITED AT".padEnd(22),
    "HEARTBEATS".padStart(10),
    "IP".padEnd(16),
    "USER AGENT".padEnd(20),
  ].join("  ");

  console.log(`\n${header}`);
  console.log("-".repeat(header.length));

  for (const v of link.visits) {
    const row = [
      v.visit_id.padEnd(38),
      v.visited_at.slice(0, 19).padEnd(22),
      String(v.heartbeats).padStart(10),
      (v.ip ?? "").padEnd(16),
      (v.user_agent ?? "").slice(0, 20).padEnd(20),
    ].join("  ");
    console.log(row);
  }
}

// --- Main ---

const USAGE = `Usage: npx tsx view-metrics.ts [--env dev|prod] [--slug <slug>] [--company <name>]

Modes:
  --slug <slug>       Detailed metrics for a single link
  --company <name>    Summary table filtered by company
  (no flags)          Summary table for all links

Options:
  --env dev|prod  Target environment (default: dev)

Requires AWS credentials. Uses secure-portfolio-dev-operator profile for dev.`;

async function main(): Promise<void> {
  const flags = parseArgs(process.argv);

  if (flags.help) {
    console.log(USAGE);
    return;
  }

  if (flags.slug) {
    const link = await fetchBySlug(flags.slug);
    if (!link) {
      console.error(`Link "${flags.slug}" not found.`);
      process.exit(1);
    }
    formatDetail(link);
  } else {
    const links = await fetchAll(flags.company);
    if (links.length === 0) {
      console.log("No links found.");
      return;
    }
    formatTable(links);
  }
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
