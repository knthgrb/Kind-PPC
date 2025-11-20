export async function extractStorageIdFromResponse(
  response: Response
): Promise<string> {
  const body = await response.text();

  try {
    const parsed = JSON.parse(body);

    if (typeof parsed === "string") {
      return parsed;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { storageId?: unknown }).storageId === "string"
    ) {
      return (parsed as { storageId: string }).storageId;
    }
  } catch {
    // Ignore JSON parse errors; fall back to raw text.
  }

  // Convex may return the storage ID as plain text or quoted text.
  return body.replace(/^"|"$/g, "").trim();
}


