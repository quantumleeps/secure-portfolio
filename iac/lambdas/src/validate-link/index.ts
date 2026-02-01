import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const slug = event.queryStringParameters?.r;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "validate-link stub",
      slug: slug ?? null,
      tables: {
        slides: process.env.SLIDES_TABLE,
        roles: process.env.ROLES_TABLE,
        tracking: process.env.TRACKING_TABLE,
      },
    }),
  };
}
