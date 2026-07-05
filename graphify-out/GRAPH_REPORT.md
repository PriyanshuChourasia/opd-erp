# Graph Report - /Users/primesysindia/priyanshuprimesys/PersonalFolder/projects/pharmacy-erp-blueprint/doctor-erp  (2026-06-27)

## Corpus Check
- Corpus is ~5,594 words - fits in a single context window. You may not need a graph.

## Summary
- 295 nodes · 263 edges · 45 communities (26 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Docs Package Config|Docs Package Config]]
- [[_COMMUNITY_Web Package Config|Web Package Config]]
- [[_COMMUNITY_API Package Config|API Package Config]]
- [[_COMMUNITY_ESLint Config Package|ESLint Config Package]]
- [[_COMMUNITY_UI Package Config|UI Package Config]]
- [[_COMMUNITY_Turborepo Pipeline Config|Turborepo Pipeline Config]]
- [[_COMMUNITY_TypeScript Base Config|TypeScript Base Config]]
- [[_COMMUNITY_Project README Concepts|Project README Concepts]]
- [[_COMMUNITY_Root Package Config|Root Package Config]]
- [[_COMMUNITY_Doctor API Source Code|Doctor API Source Code]]
- [[_COMMUNITY_TypeScript Next.js Config|TypeScript Next.js Config]]
- [[_COMMUNITY_API TypeScript Config|API TypeScript Config]]
- [[_COMMUNITY_Docs TypeScript Config|Docs TypeScript Config]]
- [[_COMMUNITY_ESLint Rule Configs|ESLint Rule Configs]]
- [[_COMMUNITY_TypeScript Package Metadata|TypeScript Package Metadata]]
- [[_COMMUNITY_UI TypeScript Config|UI TypeScript Config]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Docs App Layout|Docs App Layout]]
- [[_COMMUNITY_Web App Layout|Web App Layout]]
- [[_COMMUNITY_TypeScript React Library|TypeScript React Library]]
- [[_COMMUNITY_Docs Home Page|Docs Home Page]]
- [[_COMMUNITY_Web Home Page|Web Home Page]]
- [[_COMMUNITY_UI Button Component|UI Button Component]]
- [[_COMMUNITY_Docs Next.js Config|Docs Next.js Config]]
- [[_COMMUNITY_Web Next.js Config|Web Next.js Config]]
- [[_COMMUNITY_Docs File Text Icon|Docs File Text Icon]]
- [[_COMMUNITY_Docs Globe Icon|Docs Globe Icon]]
- [[_COMMUNITY_Docs Next.js Logo|Docs Next.js Logo]]
- [[_COMMUNITY_Docs Turborepo Dark Logo|Docs Turborepo Dark Logo]]
- [[_COMMUNITY_Docs Turborepo Light Logo|Docs Turborepo Light Logo]]
- [[_COMMUNITY_Docs Vercel Logo|Docs Vercel Logo]]
- [[_COMMUNITY_Docs Window Icon|Docs Window Icon]]
- [[_COMMUNITY_Web File Text Icon|Web File Text Icon]]
- [[_COMMUNITY_Web Globe Icon|Web Globe Icon]]
- [[_COMMUNITY_Web Next.js Logo|Web Next.js Logo]]
- [[_COMMUNITY_Web Turborepo Dark Logo|Web Turborepo Dark Logo]]
- [[_COMMUNITY_Web Turborepo Light Logo|Web Turborepo Light Logo]]
- [[_COMMUNITY_Web Vercel Logo|Web Vercel Logo]]
- [[_COMMUNITY_Web Window Icon|Web Window Icon]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `Turborepo Monorepo` - 10 edges
3. `compilerOptions` - 7 edges
4. `scripts` - 6 edges
5. `scripts` - 6 edges
6. `scripts` - 6 edges
7. `scripts` - 6 edges
8. `tasks` - 5 edges
9. `compilerOptions` - 4 edges
10. `exports` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Turborepo Monorepo` --conceptually_related_to--> `docs Next.js App`  [EXTRACTED]
  README.md → apps/docs/README.md
- `Turborepo Monorepo` --conceptually_related_to--> `web Next.js App`  [EXTRACTED]
  README.md → apps/web/README.md
- `docs Next.js App` --semantically_similar_to--> `web Next.js App`  [INFERRED] [semantically similar]
  apps/docs/README.md → apps/web/README.md
- `Internal ESLint Configurations Package` --conceptually_related_to--> `@repo/eslint-config Shared ESLint Configurations`  [EXTRACTED]
  packages/eslint-config/README.md → README.md
- `next/font Optimization` --semantically_similar_to--> `next/font Optimization`  [INFERRED] [semantically similar]
  apps/docs/README.md → apps/web/README.md

## Import Cycles
- None detected.

## Communities (45 total, 19 thin omitted)

### Community 0 - "Docs Package Config"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, @repo/ui, devDependencies, eslint, @repo/eslint-config (+15 more)

### Community 1 - "Web Package Config"
Cohesion: 0.08
Nodes (23): dependencies, next, react, react-dom, @repo/ui, devDependencies, eslint, @repo/eslint-config (+15 more)

### Community 2 - "API Package Config"
Cohesion: 0.09
Nodes (22): dependencies, cors, express, devDependencies, eslint, @repo/eslint-config, @repo/typescript-config, tsx (+14 more)

### Community 3 - "ESLint Config Package"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-only-warn, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-turbo (+12 more)

### Community 4 - "UI Package Config"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, devDependencies, eslint, @repo/eslint-config, @repo/typescript-config, @types/node (+11 more)

### Community 5 - "Turborepo Pipeline Config"
Cohesion: 0.11
Nodes (18): devDependencies, prettier, turbo, typescript, dependsOn, inputs, outputs, dependsOn (+10 more)

### Community 6 - "TypeScript Base Config"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, incremental, isolatedModules, lib, module (+8 more)

### Community 7 - "Project README Concepts"
Cohesion: 0.15
Nodes (16): docs Next.js App, next/font Optimization, Vercel Deployment Platform, Doctor ERP API, Turborepo Monorepo, Internal ESLint Configurations Package, ESLint for Code Linting, Prettier for Code Formatting (+8 more)

### Community 8 - "Root Package Config"
Cohesion: 0.15
Nodes (12): engines, node, name, packageManager, private, scripts, build, check-types (+4 more)

### Community 9 - "Doctor API Source Code"
Cohesion: 0.26
Nodes (7): errorHandler(), doctors, router, app, CreateDoctorDto, Doctor, UpdateDoctorDto

### Community 10 - "TypeScript Next.js Config"
Cohesion: 0.20
Nodes (9): compilerOptions, allowJs, jsx, module, moduleResolution, noEmit, plugins, extends (+1 more)

### Community 11 - "API TypeScript Config"
Cohesion: 0.22
Nodes (8): compilerOptions, lib, outDir, rootDir, exclude, extends, include, $schema

### Community 12 - "Docs TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, plugins, strictNullChecks, exclude, extends, include

### Community 13 - "ESLint Rule Configs"
Cohesion: 0.43
Nodes (3): config, nextJsConfig, config

### Community 14 - "TypeScript Package Metadata"
Cohesion: 0.29
Nodes (6): license, name, private, publishConfig, access, version

### Community 15 - "UI TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, strictNullChecks, exclude, extends, include

### Community 16 - "Web TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, plugins, strictNullChecks, exclude, extends, include

### Community 17 - "Docs App Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "Web App Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 19 - "TypeScript React Library"
Cohesion: 0.40
Nodes (4): compilerOptions, jsx, extends, $schema

## Knowledge Gaps
- **202 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+197 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Turborepo Pipeline Config` to `Root Package Config`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _202 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Docs Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Web Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `API Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `ESLint Config Package` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `UI Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._