import { NextRequest } from "next/server";
import { requireAuth, errorResponse } from "@/lib/api-helpers";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const generateSchema = z.object({
  streetAddress: z.string().min(1),
  suburb: z.string().min(1),
  state: z.string().min(1),
  propertyType: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  carSpaces: z.number().int().min(0),
  landSizeM2: z.number().optional(),
  buildingSizeM2: z.number().optional(),
  yearBuilt: z.number().optional(),
  features: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "AI description generation is not configured", code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const body = await req.json();
    const data = generateSchema.parse(body);

    const prompt = `Write a compelling property listing description for:
- Address: ${data.streetAddress}, ${data.suburb} ${data.state}
- Type: ${data.propertyType}, ${data.bedrooms} bed, ${data.bathrooms} bath, ${data.carSpaces} car
${data.landSizeM2 ? `- Land: ${data.landSizeM2}m²` : ""}
${data.buildingSizeM2 ? `- Building: ${data.buildingSizeM2}m²` : ""}
${data.yearBuilt ? `- Year built: ${data.yearBuilt}` : ""}
${data.features && data.features.length > 0 ? `- Features: ${data.features.join(", ")}` : ""}

Write 150-250 words in a warm, professional Australian real estate style.
Highlight the key selling points. Mention the suburb's lifestyle appeal.
Do not make claims you cannot verify (e.g., "best in the area").
Do not use ALL CAPS or excessive exclamation marks.`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
