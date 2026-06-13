export function safeJsonParse(rawText: string): any {
  try {
    const sanitized = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(sanitized);
  } catch (error) {
    console.error("Critical JSON Sanitization Failure. Raw Text:", rawText);
    throw new Error("Malformed API response structure: " + error);
  }
}
