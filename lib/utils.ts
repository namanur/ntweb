export function safeParseItems(jsonString: string | null | undefined): any[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse items JSON:", jsonString);
    return [];
  }
}