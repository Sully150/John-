/**
 * Photo Condition Assessment Service
 *
 * Returns a mock panel-by-panel condition report.
 * Designed so swapping in GPT-4o Vision is a drop-in replacement.
 *
 * SWAP INSTRUCTIONS:
 * Replace with OpenAI GPT-4o Vision API call:
 *   - Send each photo as base64 in the API request
 *   - Prompt: "Analyse this car photo and grade each visible panel..."
 *   - Parse the structured response into PanelCondition[]
 */

import type { ConditionReport } from "./types";

// Panel names for a typical car condition report
const ALL_PANELS = [
  "Front Bumper",
  "Rear Bumper",
  "Bonnet",
  "Boot Lid",
  "Roof",
  "Left Front Wing",
  "Right Front Wing",
  "Left Front Door",
  "Right Front Door",
  "Left Rear Door",
  "Right Rear Door",
  "Left Rear Wing",
  "Right Rear Wing",
  "Left Sill",
  "Right Sill",
];

// Condition grade descriptions for mock generation
const GRADE_NOTES: Record<string, string[]> = {
  Excellent: [
    "No visible defects",
    "Pristine condition",
    "Like new",
    "No marks or scratches",
  ],
  Good: [
    "Minor stone chips",
    "Light swirl marks",
    "Very slight scratch visible under close inspection",
    "Good condition with minimal wear",
  ],
  Fair: [
    "Light scratch on surface",
    "Minor dent near edge",
    "Some paint fading",
    "Small scuff mark",
    "Requires light touch-up",
    "Minor car park ding",
  ],
  Poor: [
    "Deep scratch requiring paint",
    "Noticeable dent",
    "Cracked paint",
    "Rust spot forming",
    "Requires panel repair",
    "Significant scuffing",
  ],
};

/**
 * Generate a deterministic-but-realistic condition report.
 * The seed is derived from the number of photos uploaded — more photos
 * generally means an older/more worn car (in mock logic).
 */
export async function assessPhotos(
  photos: { id: string }[],
): Promise<ConditionReport> {
  // Simulate AI processing time
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

  const photoCount = Math.max(photos.length, 1);

  // More photos = older car = worse condition (mock logic)
  // This is just for realism; real GPT-4o would analyse actual photos
  const wearFactor = Math.min(photoCount / 10, 1); // 0-1 scale

  // Grade distribution weighted by wear
  const excellentWeight = Math.max(0.05, 0.3 - wearFactor * 0.25);
  const goodWeight = 0.4;
  const fairWeight = 0.2 + wearFactor * 0.15;
  const poorWeight = Math.max(0.02, 0.05 + wearFactor * 0.1);

  const totalWeight = excellentWeight + goodWeight + fairWeight + poorWeight;

  const panels = ALL_PANELS.map((panel) => {
    const r = Math.random() * totalWeight;
    let grade: "Excellent" | "Good" | "Fair" | "Poor";
    if (r < excellentWeight) grade = "Excellent";
    else if (r < excellentWeight + goodWeight) grade = "Good";
    else if (r < excellentWeight + goodWeight + fairWeight) grade = "Fair";
    else grade = "Poor";

    const notes = GRADE_NOTES[grade];
    const note = notes[Math.floor(Math.random() * notes.length)];

    return { panel, grade, notes: note };
  });

  // Overall grade: mode of all grades, weighted towards worst
  const gradeScores = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };
  const grades = panels.map((p) => p.grade);
  const avgScore =
    grades.reduce((sum, g) => sum + gradeScores[g], 0) / grades.length;
  const overallGrade: ConditionReport["overallGrade"] =
    avgScore >= 3.5
      ? "Excellent"
      : avgScore >= 2.5
        ? "Good"
        : avgScore >= 1.5
          ? "Fair"
          : "Poor";

  const poorCount = panels.filter((p) => p.grade === "Poor").length;
  const fairCount = panels.filter((p) => p.grade === "Fair").length;
  const summary =
    overallGrade === "Excellent"
      ? "Vehicle is in excellent condition with no significant issues detected."
      : overallGrade === "Good"
        ? `Vehicle is in good overall condition. ${fairCount > 0 ? `${fairCount} panel(s) show minor wear.` : ""}`
        : overallGrade === "Fair"
          ? `Vehicle shows noticeable wear. ${fairCount} panel(s) with minor damage, ${poorCount} panel(s) need attention.`
          : `Vehicle requires significant reconditioning. ${poorCount} panel(s) need repair, ${fairCount} panel(s) show wear.`;

  return {
    panels,
    overallGrade,
    summary,
    gradedAt: new Date().toISOString(),
  };
}

/**
 * GPT-4o Vision API prompt template — for reference when swapping to real API.
 *
 * @example
 * ```ts
 * import OpenAI from "openai";
 *
 * export async function assessPhotos(photos: UploadedPhoto[]): Promise<ConditionReport> {
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *
 *   const imageParts = await Promise.all(
 *     photos.map(async (p) => {
 *       const buffer = await p.file.arrayBuffer();
 *       const base64 = Buffer.from(buffer).toString("base64");
 *       return {
 *         type: "image_url" as const,
 *         image_url: { url: `data:${p.file.type};base64,${base64}` },
 *       };
 *     })
 *   );
 *
 *   const response = await openai.chat.completions.create({
 *     model: "gpt-4o",
 *     messages: [{
 *       role: "user",
 *       content: [
 *         { type: "text", text: CONDITION_PROMPT },
 *         ...imageParts,
 *       ],
 *     }],
 *     response_format: { type: "json_object" },
 *   });
 *
 *   return JSON.parse(response.choices[0].message.content!) as ConditionReport;
 * }
 * ```
 */
export const CONDITION_PROMPT = `You are an automotive damage assessment AI. Analyse these car photos and produce a panel-by-panel condition report.

For each panel, grade it as: Excellent (like new), Good (minor wear), Fair (visible damage needing attention), Poor (significant damage needing repair).

Return a JSON object with:
- "panels": array of { "panel": string, "grade": string, "notes": string } for each visible panel
- "overallGrade": the overall vehicle condition
- "summary": a brief, professional summary for a dealer appraiser

Panels to assess (if visible): Front Bumper, Rear Bumper, Bonnet, Boot Lid, Roof, Left Front Wing, Right Front Wing, Left Front Door, Right Front Door, Left Rear Door, Right Rear Door, Left Rear Wing, Right Rear Wing, Left Sill, Right Sill.

Be conservative — dealers prefer cautious assessments. Note specific issues.`;
