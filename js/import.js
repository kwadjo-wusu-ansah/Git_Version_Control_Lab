import { normalizeNote } from "./noteManager.js";
import { loadNotes, saveNotes } from "./storage.js";

const extractNotesFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.notes)) return payload.notes;
  return null;
};

const normalizeIncomingNotes = (notes) =>
  (Array.isArray(notes) ? notes : [])
    .filter((note) => note && typeof note === "object")
    .map((note) => normalizeNote(note));

const mergeNotesById = (existing, incoming, { overwrite = true } = {}) => {
  const map = new Map();

  existing.forEach((note) => {
    if (note?.id) map.set(note.id, note);
  });

  incoming.forEach((note) => {
    if (!note?.id) return;
    if (overwrite || !map.has(note.id)) {
      map.set(note.id, note);
    }
  });

  return Array.from(map.values());
};

const normalizeImportMode = (mode) => {
  const trimmed = String(mode ?? "").trim().toLowerCase();
  if (trimmed === "replace") return "replace";
  return "merge";
};

/* this function imports notes from a JSON string */
export const importNotesFromJson = (
  jsonText,
  { mode = "merge", overwriteExisting = true } = {},
) => {
  if (typeof jsonText !== "string") {
    return { ok: false, error: "Expected a JSON string." };
  }

  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (err) {
    return { ok: false, error: "Invalid JSON file." };
  }

  const extracted = extractNotesFromPayload(payload);
  if (!Array.isArray(extracted)) {
    return {
      ok: false,
      error: "JSON must be an array or an object with a notes array.",
    };
  }

  const normalized = normalizeIncomingNotes(extracted);
  const existing = loadNotes();
  const resolvedMode = normalizeImportMode(mode);

  const nextNotes =
    resolvedMode === "replace"
      ? normalized
      : mergeNotesById(existing, normalized, { overwrite: overwriteExisting });

  const result = saveNotes(nextNotes);
  if (!result.ok) return result;

  const importedCount =
    resolvedMode === "replace" ? nextNotes.length : normalized.length;

  return {
    ok: true,
    mode: resolvedMode,
    count: nextNotes.length,
    imported: importedCount,
  };
};

/* this function imports notes from a File or Blob */
export const importNotesFromFile = async (file, options = {}) => {
  if (!file || typeof file.text !== "function") {
    return { ok: false, error: "Expected a file input." };
  }

  try {
    const text = await file.text();
    return importNotesFromJson(text, options);
  } catch (err) {
    return { ok: false, error: "Could not read the file." };
  }
};
