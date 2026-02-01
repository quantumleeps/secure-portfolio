import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TRACKING_TABLE = process.env.TRACKING_TABLE!;

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const body = event.body ? JSON.parse(event.body) : {};
  const { slug, visit_id } = body;

  if (!slug || !visit_id) {
    return json(400, { error: "slug and visit_id are required" });
  }

  try {
    await client.send(
      new UpdateCommand({
        TableName: TRACKING_TABLE,
        Key: { slug },
        UpdateExpression:
          "SET visits.#vid.heartbeats = visits.#vid.heartbeats + :one",
        ExpressionAttributeNames: { "#vid": visit_id },
        ExpressionAttributeValues: { ":one": 1 },
        ConditionExpression: "attribute_exists(visits.#vid)",
      })
    );
    return json(200, { success: true });
  } catch (err: unknown) {
    if ((err as { name: string }).name === "ConditionalCheckFailedException") {
      return json(404, { error: "Visit not found" });
    }
    throw err;
  }
}
