import { createInterface } from "node:readline";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";

const TRACKING_TABLE =
  process.env.TRACKING_TABLE || "secure-portfolio-dev-tracking-links";
const ROLES_TABLE =
  process.env.ROLES_TABLE || "secure-portfolio-dev-role-versions";
const BASE_URL =
  process.env.BASE_URL || "https://main.dkf5fstrk9fic.amplifyapp.com";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);

function parseArgs(argv: string[]): {
  command: string;
  flags: Record<string, string>;
} {
  const args = argv.slice(2);
  let command = "";
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val =
        args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      flags[key] = val;
      if (val !== "true") i++;
    } else if (!command) {
      command = args[i];
    }
  }
  return { command, flags };
}

function generateSlug(company: string): string {
  const prefix = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${suffix}`;
}

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// --- Subcommands ---

async function create(flags: Record<string, string>): Promise<void> {
  if (!flags.company || !flags.role) {
    console.error(
      "Usage: manage-links create --company <name> --role <role_version> [--slug <custom>]"
    );
    process.exit(1);
  }

  // Validate role version exists
  const roleResult = await client.send(
    new GetCommand({
      TableName: ROLES_TABLE,
      Key: { role_version: flags.role },
    })
  );
  if (!roleResult.Item) {
    console.error(`Role version "${flags.role}" not found in ${ROLES_TABLE}.`);
    process.exit(1);
  }

  const slug = flags.slug || generateSlug(flags.company);

  try {
    await client.send(
      new PutCommand({
        TableName: TRACKING_TABLE,
        Item: {
          slug,
          company: flags.company,
          role_version: flags.role,
          status: "active",
          created_at: new Date().toISOString(),
          visits: {},
        },
        ConditionExpression: "attribute_not_exists(slug)",
      })
    );
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === "ConditionalCheckFailedException"
    ) {
      console.error(`Slug "${slug}" already exists.`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`\nCreated tracking link:`);
  console.log(`  Slug:    ${slug}`);
  console.log(`  Company: ${flags.company}`);
  console.log(`  Role:    ${flags.role}`);
  console.log(`  URL:     ${BASE_URL}/portfolio?r=${slug}`);
}

async function list(flags: Record<string, string>): Promise<void> {
  const scanInput: ScanCommandInput = { TableName: TRACKING_TABLE };
  const filters: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, string> = {};

  if (flags.status) {
    filters.push("#s = :status");
    names["#s"] = "status";
    values[":status"] = flags.status;
  }
  if (flags.company) {
    filters.push("company = :company");
    values[":company"] = flags.company;
  }

  if (filters.length) {
    scanInput.FilterExpression = filters.join(" AND ");
    if (Object.keys(names).length) scanInput.ExpressionAttributeNames = names;
    scanInput.ExpressionAttributeValues = values;
  }

  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    if (lastKey) scanInput.ExclusiveStartKey = lastKey;
    const result = await client.send(new ScanCommand(scanInput));
    items.push(...(result.Items ?? []));
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  if (items.length === 0) {
    console.log("No links found.");
    return;
  }

  items.sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  );

  const header = [
    "SLUG".padEnd(28),
    "COMPANY".padEnd(20),
    "ROLE".padEnd(24),
    "STATUS".padEnd(10),
    "CREATED".padEnd(22),
    "VISITS",
  ].join("  ");

  console.log(`\n${header}`);
  console.log("-".repeat(header.length));

  for (const item of items) {
    const visits = (item.visits ?? {}) as Record<string, unknown>;
    const row = [
      String(item.slug ?? "").padEnd(28),
      String(item.company ?? "").padEnd(20),
      String(item.role_version ?? "").padEnd(24),
      String(item.status ?? "").padEnd(10),
      String(item.created_at ?? "").slice(0, 19).padEnd(22),
      String(Object.keys(visits).length),
    ].join("  ");
    console.log(row);
  }

  console.log(`\n${items.length} link(s)`);
}

async function revoke(flags: Record<string, string>): Promise<void> {
  if (!flags.slug) {
    console.error("Usage: manage-links revoke --slug <slug>");
    process.exit(1);
  }

  const result = await client.send(
    new GetCommand({
      TableName: TRACKING_TABLE,
      Key: { slug: flags.slug },
    })
  );

  if (!result.Item) {
    console.error(`Link "${flags.slug}" not found.`);
    process.exit(1);
  }

  if (result.Item.status === "revoked") {
    console.log(`Link "${flags.slug}" is already revoked.`);
    return;
  }

  console.log(`\nLink: ${result.Item.slug}`);
  console.log(`Company: ${result.Item.company}`);
  console.log(`Role: ${result.Item.role_version}`);
  console.log(`Status: ${result.Item.status}`);

  const ok = await confirm("\nRevoke this link?");
  if (!ok) {
    console.log("Cancelled.");
    return;
  }

  await client.send(
    new UpdateCommand({
      TableName: TRACKING_TABLE,
      Key: { slug: flags.slug },
      UpdateExpression: "SET #s = :revoked",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":revoked": "revoked" },
    })
  );

  console.log(`Link revoked: ${flags.slug}`);
}

// --- Main ---

const USAGE = `Usage: npx tsx manage-links.ts <create|list|revoke> [flags]

Commands:
  create  --company <name> --role <role_version> [--slug <custom>]
  list    [--status active|revoked] [--company <name>]
  revoke  --slug <slug>

Requires AWS credentials. Set AWS_PROFILE=secure-portfolio if needed.`;

const commands: Record<
  string,
  (flags: Record<string, string>) => Promise<void>
> = { create, list, revoke };

const { command, flags } = parseArgs(process.argv);

if (!command || !commands[command]) {
  console.log(USAGE);
  process.exit(command ? 1 : 0);
}

commands[command](flags).catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
