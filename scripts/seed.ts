import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import "./load-env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envIndex = process.argv.indexOf("--env");
const env = envIndex !== -1 ? process.argv[envIndex + 1] : "dev";
if (env !== "dev" && env !== "prod") {
  console.error('Invalid --env value. Use "dev" or "prod".');
  process.exit(1);
}

const prefix = `secure-portfolio-${env}`;
const SLIDES_TABLE = process.env.SLIDES_TABLE || `${prefix}-portfolio-slides`;
const ROLES_TABLE = process.env.ROLES_TABLE || `${prefix}-role-versions`;
const TRACKING_TABLE =
  process.env.TRACKING_TABLE || `${prefix}-tracking-links`;

const dataPath = resolve(__dirname, "seed-data.json");

let data: {
  slides: Record<string, unknown>[];
  roleVersions: Record<string, unknown>[];
  trackingLinks: Record<string, unknown>[];
};

try {
  data = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch {
  console.error(
    "ERROR: seed-data.json not found.\n" +
      "Copy seed-data.example.json to seed-data.json and fill in your content.\n" +
      `Expected path: ${dataPath}`
  );
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" })
);

async function batchPut(
  tableName: string,
  items: Record<string, unknown>[]
): Promise<void> {
  // DynamoDB BatchWriteItem supports max 25 items per call
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}

async function seed(): Promise<void> {
  console.log(`Seeding ${data.slides.length} slides → ${SLIDES_TABLE}`);
  await batchPut(SLIDES_TABLE, data.slides);
  console.log("  done.");

  console.log(
    `Seeding ${data.roleVersions.length} role versions → ${ROLES_TABLE}`
  );
  for (const rv of data.roleVersions) {
    await client.send(new PutCommand({ TableName: ROLES_TABLE, Item: rv }));
  }
  console.log("  done.");

  console.log(
    `Seeding ${data.trackingLinks.length} tracking links → ${TRACKING_TABLE}`
  );
  for (const link of data.trackingLinks) {
    await client.send(
      new PutCommand({ TableName: TRACKING_TABLE, Item: link })
    );
  }
  console.log("  done.");

  console.log("\nSeed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
