import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TRACKING_TABLE = process.env.TRACKING_TABLE!;

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function summarize(link: Record<string, unknown>) {
  const visits = (link.visits ?? {}) as Record<
    string,
    { heartbeats: number; visited_at: string }
  >;
  const visitList = Object.entries(visits).map(([id, v]) => ({
    visit_id: id,
    ...v,
  }));
  return {
    slug: link.slug,
    company: link.company,
    role_version: link.role_version,
    status: link.status,
    created_at: link.created_at,
    total_visits: visitList.length,
    total_heartbeats: visitList.reduce(
      (sum, v) => sum + (v.heartbeats ?? 0),
      0
    ),
    visits: visitList,
  };
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const params = event.queryStringParameters ?? {};

  if (params.slug) {
    const result = await client.send(
      new GetCommand({
        TableName: TRACKING_TABLE,
        Key: { slug: params.slug },
      })
    );
    if (!result.Item) return json(404, { error: "Link not found" });
    return json(200, summarize(result.Item));
  }

  const scanInput: ScanCommandInput = { TableName: TRACKING_TABLE };
  if (params.company) {
    scanInput.FilterExpression = "company = :company";
    scanInput.ExpressionAttributeValues = { ":company": params.company };
  }
  const result = await client.send(new ScanCommand(scanInput));
  const links = (result.Items ?? []).map(summarize);

  return json(200, { links });
}
