"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

type ExtractedFields = {
  confidence?: number;
  reactionTime?: number;
  dialInSeconds?: number;
  lane?: "left" | "right";
  sixtyFt?: number;
  threeThirtyFt?: number;
  oneEighthEt?: number;
  oneEighthMph?: number;
  thousandFt?: number;
  quarterEt?: number;
  quarterMph?: number;
  rawText?: string;
};

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseModelJson(content: string): ExtractedFields {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const laneRaw = typeof parsed.lane === "string" ? parsed.lane.toLowerCase() : undefined;
  const lane = laneRaw === "left" || laneRaw === "right" ? laneRaw : undefined;

  return {
    confidence: asNumber(parsed.confidence),
    reactionTime: asNumber(parsed.reactionTime ?? parsed.rt),
    dialInSeconds: asNumber(parsed.dialInSeconds ?? parsed.dialIn),
    lane,
    sixtyFt: asNumber(parsed.sixtyFt ?? parsed["60ft"]),
    threeThirtyFt: asNumber(parsed.threeThirtyFt ?? parsed["330"]),
    oneEighthEt: asNumber(parsed.oneEighthEt ?? parsed.eighthEt),
    oneEighthMph: asNumber(parsed.oneEighthMph ?? parsed.eighthMph),
    thousandFt: asNumber(parsed.thousandFt ?? parsed["1000"]),
    quarterEt: asNumber(parsed.quarterEt ?? parsed["et"] ?? parsed.quarterMileEt),
    quarterMph: asNumber(parsed.quarterMph ?? parsed.mph ?? parsed.trapMph),
    rawText: typeof parsed.rawText === "string" ? parsed.rawText : cleaned,
  };
}

export const extractFromImage = internalAction({
  args: { extractionId: v.id("timeSlipExtractions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.timeSlipExtractions.markProcessing, {
      extractionId: args.extractionId,
    });

    const extraction = await ctx.runQuery(internal.timeSlipInternal.getExtraction, {
      extractionId: args.extractionId,
    });
    if (!extraction?.sourceStorageId) {
      await ctx.runMutation(internal.timeSlipExtractions.saveExtractionResult, {
        extractionId: args.extractionId,
        status: "failed",
        errorMessage: "Missing time-slip image",
      });
      return null;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.timeSlipExtractions.saveExtractionResult, {
        extractionId: args.extractionId,
        status: "failed",
        errorMessage:
          "OPENAI_API_KEY is not configured. Upload succeeded — enter times manually or set the key in Convex env.",
      });
      return null;
    }

    const imageUrl = await ctx.storage.getUrl(extraction.sourceStorageId);
    if (!imageUrl) {
      await ctx.runMutation(internal.timeSlipExtractions.saveExtractionResult, {
        extractionId: args.extractionId,
        status: "failed",
        errorMessage: "Could not load uploaded image URL",
      });
      return null;
    }

    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You extract drag racing time-slip fields from photos. Return JSON only with keys: confidence (0-1), reactionTime, dialInSeconds, lane (left|right), sixtyFt, threeThirtyFt, oneEighthEt, oneEighthMph, thousandFt, quarterEt, quarterMph, rawText. Omit unknown numeric fields.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Read this NHRA/IHRA style time slip and extract timing numbers.",
                },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API HTTP ${response.status}: ${await response.text()}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Vision API returned empty content");
      }

      const fields = parseModelJson(content);
      await ctx.runMutation(internal.timeSlipExtractions.saveExtractionResult, {
        extractionId: args.extractionId,
        status: "needs_review",
        confidence: fields.confidence,
        reactionTime: fields.reactionTime,
        dialInSeconds: fields.dialInSeconds,
        lane: fields.lane,
        sixtyFt: fields.sixtyFt,
        threeThirtyFt: fields.threeThirtyFt,
        oneEighthEt: fields.oneEighthEt,
        oneEighthMph: fields.oneEighthMph,
        thousandFt: fields.thousandFt,
        quarterEt: fields.quarterEt,
        quarterMph: fields.quarterMph,
        ocrRawText: fields.rawText,
      });
    } catch (error) {
      await ctx.runMutation(internal.timeSlipExtractions.saveExtractionResult, {
        extractionId: args.extractionId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "OCR failed",
      });
    }

    return null;
  },
});
