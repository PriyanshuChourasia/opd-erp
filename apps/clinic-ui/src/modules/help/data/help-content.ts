/**
 * Loads every help file in the UI at build time:
 *   - src/modules/<module>/help.md            -> module-level help
 *   - src/modules/<module>/components/*.help.md -> per-page help
 *
 * Uses Vite's import.meta.glob with the ?raw query so the markdown is
 * bundled as plain strings — no runtime fetch needed.
 */

export interface HelpPageEntry {
  /** Stable id derived from the file name, e.g. "appointments-page". */
  id: string;
  /** Display title from the file's H1, e.g. "Appointments List — Appointment & Queue". */
  title: string;
  /** Raw markdown content. */
  content: string;
}

export interface HelpModuleEntry {
  /** Module slug, e.g. "appointments". */
  id: string;
  /** Display title from the module's H1, e.g. "Appointments — Booking & Scheduling". */
  title: string;
  /** Raw markdown of the module help.md. */
  content: string;
  /** Per-page help files that live under this module. */
  pages: HelpPageEntry[];
}

const moduleFiles = import.meta.glob("../../*/help.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const pageFiles = import.meta.glob("../../*/components/*.help.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** Extract the first H1 (`# ...`) from a markdown string. */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

/** Strip a trailing "(slug)" from a title like "Foo (foo-page)". */
function cleanTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function sortByTitle<T extends { title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Builds the full module -> pages help tree. Call once (module level);
 * the result is stable for the lifetime of the app.
 */
export function loadHelpContent(): HelpModuleEntry[] {
  const modules = new Map<string, HelpModuleEntry>();

  for (const [key, content] of Object.entries(moduleFiles)) {
    const parts = key.split("/");
    const slug = parts[parts.length - 2] ?? "";
    if (!slug) continue;
    modules.set(slug, {
      id: slug,
      title: cleanTitle(extractTitle(content)),
      content,
      pages: [],
    });
  }

  for (const [key, content] of Object.entries(pageFiles)) {
    const parts = key.split("/");
    const moduleSlug = parts[parts.length - 3] ?? "";
    const module = modules.get(moduleSlug);
    if (!module) continue;
    const fileName = parts[parts.length - 1] ?? "";
    if (!fileName.endsWith(".help.md")) continue;
    module.pages.push({
      id: fileName.replace(/\.help\.md$/, ""),
      title: cleanTitle(extractTitle(content)),
      content,
    });
  }

  const result = sortByTitle([...modules.values()]);
  for (const module of result) module.pages = sortByTitle(module.pages);
  return result;
}
