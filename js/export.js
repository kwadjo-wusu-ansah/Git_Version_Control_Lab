import { loadNotes } from "./storage.js";

const DEFAULT_FILE_PREFIX = "notes-export";

const buildExportFileName = (prefix = DEFAULT_FILE_PREFIX, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${prefix}-${year}-${month}-${day}.json`;
};

const normalizeFileName = (fileName) => {
  if (typeof fileName !== "string") return null;
  const trimmed = fileName.trim();
  if (!trimmed) return null;
  return trimmed.endsWith(".json") ? trimmed : `${trimmed}.json`;
};

const buildExportPayload = (notes) => ({
  notes: Array.isArray(notes) ? notes : [],
  exportedAt: new Date().toISOString(),
  version: 1,
});

const downloadBlob = (blob, fileName) => {
  if (typeof document === "undefined") {
    return { ok: false, error: "Download is only available in a browser." };
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body?.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return { ok: true };
};

/* this function exports all notes to a downloadable JSON file */
export const exportAllNotesAsJson = ({ fileName, pretty = true } = {}) => {
  const notes = loadNotes();
  const payload = buildExportPayload(notes);
  const json = JSON.stringify(payload, null, pretty ? 2 : 0);
  const blob = new Blob([json], { type: "application/json" });

  const resolvedName = normalizeFileName(fileName) ?? buildExportFileName();
  const downloadResult = downloadBlob(blob, resolvedName);
  if (!downloadResult.ok) return downloadResult;

  return { ok: true, fileName: resolvedName, count: notes.length };
};
