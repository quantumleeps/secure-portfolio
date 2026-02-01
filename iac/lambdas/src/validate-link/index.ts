import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const SLIDES_TABLE = process.env.SLIDES_TABLE!;
const ROLES_TABLE = process.env.ROLES_TABLE!;
const TRACKING_TABLE = process.env.TRACKING_TABLE!;

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const slug = event.queryStringParameters?.r;
  if (!slug) return json(404, { error: "Missing slug parameter" });

  const linkResult = await client.send(
    new GetCommand({ TableName: TRACKING_TABLE, Key: { slug } })
  );
  const link = linkResult.Item;
  if (!link || link.status !== "active") {
    return json(404, { error: "Invalid or inactive link" });
  }

  const roleResult = await client.send(
    new GetCommand({
      TableName: ROLES_TABLE,
      Key: { role_version: link.role_version },
    })
  );
  const role = roleResult.Item;
  if (!role) {
    return json(500, { error: "Role version not found" });
  }

  const slideOrder: string[] = role.slide_order;
  const batchResult = await client.send(
    new BatchGetCommand({
      RequestItems: {
        [SLIDES_TABLE]: {
          Keys: slideOrder.map((id) => ({ slide_id: id })),
        },
      },
    })
  );
  const slideMap = new Map(
    (batchResult.Responses?.[SLIDES_TABLE] ?? []).map((s) => [
      s.slide_id as string,
      s,
    ])
  );
  const slides = slideOrder.map((id) => slideMap.get(id)).filter(Boolean);

  const visitId = crypto.randomUUID();
  await client.send(
    new UpdateCommand({
      TableName: TRACKING_TABLE,
      Key: { slug },
      UpdateExpression: "SET visits.#vid = :visit",
      ExpressionAttributeNames: { "#vid": visitId },
      ExpressionAttributeValues: {
        ":visit": {
          visited_at: new Date().toISOString(),
          user_agent: event.requestContext?.http?.userAgent ?? "",
          referrer: event.headers?.referer ?? "",
          ip: event.requestContext?.http?.sourceIp ?? "",
          heartbeats: 0,
        },
      },
    })
  );

  return json(200, {
    slug,
    visit_id: visitId,
    intro: role.intro,
    slides,
    closing: role.closing,
  });
}
