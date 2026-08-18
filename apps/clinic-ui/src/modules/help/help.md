# Help — Simulator

## What is this page?

The Help Simulator (`/help`) is the built-in documentation center of the OPD ERP UI. It renders every module's `help.md` and every page's `*.help.md` file — 28 modules and their individual pages — in a searchable, navigable interface, so staff can look up what any screen does, which actions are available, and what each action affects.

## Actions & Effects

- **Search** — Type in the search box. Effect: filters the module list by title or content; matching pages are shown beneath their module. Clearing the box restores the full list.
- **Select a module** — Click a module name in the sidebar. Effect: renders that module's overview `help.md`; the module stays expanded so its pages are visible.
- **Expand / collapse a module** — Click the chevron next to a module. Effect: toggles the list of that module's per-page help files.
- **Open a page help** — Click a page under a module. Effect: renders the page's `*.help.md` content; the breadcrumb updates to Module / Page.
- **Navigate to Dashboard** — Click "Dashboard" in the header. Effect: navigates to `/dashboard`.
- **Deep link** — The URL carries `?module=<slug>&page=<page-id>`. Effect: opening a shared URL selects that module/page directly.

## Events

- **Help content loading** — All markdown files are bundled at build time via `import.meta.glob`; no network request happens when the page opens.
- **Selection fallback** — If the URL references a module/page that does not exist, the simulator falls back to the first module.
- **Auto-expand** — The currently selected module is always expanded in the sidebar.

## Features

- Sidebar tree of 28 modules, each expandable into its per-page help files.
- Full-text search across titles and content.
- URL-driven selection for shareable deep links.
- Breadcrumb trail (Module / Page) above the rendered content.
- Responsive layout: desktop sidebar on md+ screens, dropdown pickers on mobile.
