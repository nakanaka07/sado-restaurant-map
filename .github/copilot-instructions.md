# GitHub Copilot Repository Instructions

> **Last Updated**: 2025-01-21
> **Philosophy**: Trust these instructions first. Search workspace only when information is incomplete or outdated.

## 0. Development Context & Partnership

**Environment**: Individual development using VS Code Insiders. Copilot serves as primary coding partner, mentor,
and collaborative assistant.

**Partnership Principles**:

- Maintain best practices and stay current with latest technologies
- Build sustainable, maintainable workflows
- Prioritize clear communication and proactive suggestions
- Continuous learning and improvement together

**Task Management**: Convert ad-hoc ideas into actionable tasks. Maintain awareness across sessions.
Use `docs/tasks/TASKS.md` for persistent tracking.

**Continuous Improvement**: Monthly review of these instructions. Propose updates when tools, patterns,
or bottlenecks change.

## 1. Project Overview

**Project**: `sado-restaurant-map` - Interactive PWA map showing restaurants, toilets, parking, and POIs
on Sado Island, Japan.

**Tech Stack**:

- Frontend: React 19 + TypeScript 5.7 (strict) + Vite 7
- Testing: Vitest 3 → **Vitest 4 migration planned (Week 1)** + Testing Library + jest-axe
- PWA: vite-plugin-pwa (Workbox) + offline support
- Maps: Google Maps JavaScript API
- CI/CD: GitHub Actions (lint, test, build, size-limit, Lighthouse CI)
- E2E Testing: **Playwright (Week 4 introduction planned)**

**Key Priorities**: Performance, Accessibility (WCAG AA), Type Safety, Offline Support, Developer Experience

**Production**: <https://nakanaka07.github.io/sado-restaurant-map/> (GitHub Pages)

## 2. Architecture & Structure

**Directory Landmarks**:

```
src/
├── components/     # UI components (presentational + smart)
├── pages/          # Page-level route components
├── hooks/          # Custom React hooks for reusable logic
├── services/       # External API clients & domain operations
├── utils/          # Pure utility functions
├── types/          # Shared TypeScript type definitions
├── test/           # Test setup & accessibility utilities
├── data/           # Static JSON data files
├── assets/         # Images, SVGs, icons
└── styles/         # Global styles
public/             # Static assets (copied as-is)
config/             # Configuration files (ESLint, PWA, TS, etc.)
.github/workflows/  # CI/CD pipelines
data-platform/      # Python ETL (independent environment)
docs/               # Project documentation
```

**Path Aliases**: `@`, `@components`, `@hooks`, `@utils`, `@types`, `@data`, `@assets`, `@services`

**Data Platform**: Independent Python environment (`data-platform/`) for ETL scripts. Not imported by
JavaScript. Uses `requirements.txt`. Future: pytest integration.

## 3. Build & Validation Workflow

**CRITICAL ORDER** (Never skip 1-4 for code changes):

1. **`pnpm install`** - Always first after pulling/switching branches
2. **`pnpm type-check`** - Fail fast on type errors
3. **`pnpm lint`** - Zero errors required (warnings OK if documented)
4. **`pnpm test:run`** or `pnpm test` - All tests must pass
5. Optional: `pnpm test:coverage` - Target: line coverage ≥50%
6. **`pnpm build`** → **`pnpm preview`** - Verify production build
7. **Bundle Analysis**: `ANALYZE=true pnpm build` or `pnpm analyze`
8. **`pnpm test:accessibility`** - A11y-focused test subset

**Build Success Criteria**:

- Main chunk (gzip): <250KB target (see `metrics/size-limit.json`)
- No console errors in preview mode
- All routes load correctly
- Service worker registers without errors
- Lighthouse CI passes (see `lighthouserc.json` budgets)

## 4. TypeScript & Linting Standards

**TypeScript Config** (strict mode):

- `exactOptionalPropertyTypes`: true
- `noUncheckedIndexedAccess`: true
- `@typescript-eslint/no-explicit-any`: **ERROR** (no exceptions)
- Unused variables: error (except `_` prefix)

**Coding Standards**:

- Prefer small, pure functions with clear boundaries
- Extract public types to `src/types/` for reusability
- React Hooks: satisfy `exhaustive-deps` (no suppressions without explanation)
- No nested ternaries >2 levels
- Max function length: ~150 lines (refactor if exceeded)
- Duplicate code >3 times: extract to utility/hook

**Import Order** (ESLint enforced):

1. React imports
2. External dependencies
3. Internal absolute (`@/*`)
4. Relative imports
5. Type imports (separate)

## 5. Testing Strategy

**Test Framework**: Vitest 3 → **Vitest 4 (Week 1 migration)** + jsdom + Testing Library + jest-axe

**Test Types**:

| Layer         | Strategy             | Tools                                | Priority                        |
| ------------- | -------------------- | ------------------------------------ | ------------------------------- |
| Unit          | Logic/Hook isolation | Vitest                               | High for utils, hooks, services |
| Component     | User behavior-based  | Testing Library                      | High for interactive components |
| Accessibility | Automated + manual   | jest-axe, axe-core                   | Required for all interactive UI |
| Integration   | E2E Testing          | **Playwright (Week 4 introduction)** | Critical user flows             |

**Coverage**:

- Reporters: text, json, json-summary, html
- Target: ≥50% line coverage (gradually increasing)
- Focus: Critical paths, calculations, data transformations

**Test Requirements for New Code**:

- Minimum: happy path + edge cases (empty data, errors)
- Complex logic: boundary conditions
- Interactive components: keyboard navigation, ARIA
- Map/visualization: unit test logic, E2E for rendering (future)

## 6. Performance & Bundle Optimization

**Targets** (see `docs/guidelines/SHARED_GLOSSARY.md`):

- Main chunk (gzip): <250KB
- FCP: <1.5s (dev environment)
- LCP: <3.0s
- TTI: <4.0s

**Current Optimizations**:

- Manual code splitting: `react-vendor`, `google-maps`
- Hashed filenames for assets (cache busting)
- Dynamic imports for heavy features (`import()` + `<Suspense>`)

**Monitoring**:

- `size-limit`: Automated checks in CI (`metrics/size-limit.json` baseline)
- Lighthouse CI: Performance budgets (`lighthouserc.json`)
- Bundle analysis: `rollup-plugin-visualizer` (ANALYZE flag)

**Guidelines**:

- Avoid adding large dependencies without justification
- Use dynamic imports for features >50KB
- Optimize images (use AVIF format in `public/`)
- Lazy-load non-critical Google Maps features

## 7. PWA & Service Worker

**Configuration**: `vite-plugin-pwa` with Workbox

**Key Settings**:

- `injectRegister: false` - Manual SW registration via wrapper
- Static imports only for virtual modules (no dynamic strings)
- API keys excluded from cache keys (`cacheKeyWillBeUsed` plugin)
- Dev PWA: Enable with `ENABLE_PWA_DEV=true`

**Caching Strategy**:

- HTML/CSS/JS: pre-cache
- API responses: `StaleWhileRevalidate`
- Google Maps tiles: runtime cache
- Static assets: `CacheFirst`

**Known Limitations**:

- Offline fallback page: Not yet implemented
- Update prompts: Basic toast notification (needs UX improvement)

**References**: See `docs/design/pwa-implementation-notes.md` for detailed specs

## 8. Accessibility (a11y) Principles

**WCAG AA Requirements**:

- Color contrast: ≥4.5:1 for normal text, ≥3:1 for large text
- Keyboard navigation: All interactive elements accessible via Tab/Enter/Space
- Focus indicators: Visual focus ring required (never disable `outline`)
- ARIA: Use native HTML first, minimal ARIA when necessary
- Screen reader: Test with labels, roles, and live regions

**Testing**:

- Automated: jest-axe in component tests
- Runtime: @axe-core/react in development
- Manual: Keyboard navigation testing, screen reader testing

**Common Patterns**:

- Buttons: Use `<button>` not `<div onClick>`
- Links: Use `<a href>` for navigation
- Forms: Associate labels with inputs
- Images: Provide alt text or `aria-label`
- Interactive lists: Use semantic HTML with proper roles

## 9. CI/CD & Quality Gates

**GitHub Actions Workflows**:

- `ci.yml`: Lint, type-check, tests, coverage, size-limit
- `coverage-badge.yml`: Updates README badge
- `lighthouse-ci.yml`: Performance budgets
- `deploy.yml`: GitHub Pages deployment

**Quality Gates** (all must pass):

1. TypeScript compilation (zero errors)
2. ESLint (zero errors, warnings documented)
3. All tests passing
4. Coverage ≥50% (line)
5. Size limit check
6. Lighthouse performance budget

**Failure Response**:

- Identify root cause immediately
- Fix in smallest possible scope
- Re-run validation workflow
- Document if issue requires future work (TODO comment)

**Metrics Baseline**: `metrics/size-limit.json` auto-updates on main push

## 10. Diagnostic Protocols

### 🔍 SVG/Image Display Issues

**ALWAYS check in this order**:

1. **File Physical Integrity**:

   ```bash
   # Check file exists and has content
   ls -lh path/to/file.svg
   # Verify SVG structure
   head -n 5 path/to/file.svg
   ```

2. **SVG Validation** (CRITICAL):
   - ✅ Has `xmlns="http://www.w3.org/2000/svg"` attribute
   - ✅ Has valid `viewBox` attribute
   - ✅ Opening `<svg>` and closing `</svg>` tags match
   - ✅ No syntax errors in XML structure

3. **Path Resolution**:
   - Verify import path matches file system
   - Check `public/` vs `src/assets/` placement
   - Confirm Vite alias resolution (`@assets`)
   - Inspect browser Network tab for 404s

4. **Build Configuration**:
   - Verify `vite.config.ts` handles SVGs correctly
   - Check if SVG should be imported or referenced
   - Confirm public directory files copied correctly

5. **Browser Validation**:
   - Open Network tab: Check if file downloaded
   - View downloaded file content (should match source)
   - Check console for CORS or CSP errors
   - Verify Content-Type header

**VS Code Display**:

- VS Code SVG preview requires `xmlns` attribute
- Preview failure ≠ runtime failure (browser may auto-correct)
- Use "Open Preview" to verify rendering

**Common Fixes**:

```xml
<!-- ❌ Missing xmlns (won't preview in VS Code) -->
<svg viewBox="0 0 512 512">...</svg>

<!-- ✅ Complete SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">...</svg>
```

### 🔍 Build Failures

1. Clear cache: `pnpm store prune` + `rm -rf node_modules`
2. Reinstall: `pnpm install`
3. Check for dynamic virtual module imports (use static strings)
4. Verify all imports resolve correctly
5. Check console for helpful error messages

### 🔍 Test Failures

1. Run single test: `pnpm test -- path/to/test.spec.ts`
2. Check test isolation (no shared state)
3. Verify mocks are properly cleaned up
4. Check for timing issues (use `waitFor` from Testing Library)

## 11. AI Collaboration Rules

**Search Strategy**:

- Trust these instructions first
- Only search workspace if:
  - Undefined new API referenced
  - Build failure not covered here
  - Dependency version conflicts

**Code Changes**:

- Minimum diff principle
- No unnecessary formatting changes
- No bulk renames without explicit approval
- Always test before committing

**Failure Handling**:

- Report blockers immediately
- Provide alternative approaches
- Explain tradeoffs clearly

**Documentation Updates**:

- Update instructions for breaking changes
- Propose glossary updates for new concepts
- Suggest improvements when patterns change

## 12. Common Pitfalls & Solutions

| Issue                         | Cause                              | Solution                                 |
| ----------------------------- | ---------------------------------- | ---------------------------------------- |
| Dynamic virtual module import | String interpolation in import     | Use static string literals only          |
| SVG not displaying            | Missing `xmlns` attribute          | Add `xmlns="http://www.w3.org/2000/svg"` |
| Bundle analyzer failure       | Missing `rollup-plugin-visualizer` | Already handled by try/catch (ignore)    |
| Image cache key mismatch      | Query params in URL                | Handled by `cacheKeyWillBeUsed` plugin   |
| SW 404 errors                 | Virtual module path incorrect      | Verify static import path                |

## 13. Refactoring Triggers

**When to Refactor**:

- Function >150 lines
- Code duplication ≥3 instances
- Hook causing excessive re-renders (check React DevTools)
- Component complexity score >10 (mental model test)

**Refactoring Rules**:

- Tests must stay green before and after
- Incremental PRs for large refactors
- Document architectural decisions

## 14. Current Status & Priorities

**Project Metrics** (2025-12-09):

- Coverage: **75.88%** (1797 tests, 4 skipped)
- Tech Stack: React 19.1.1, Vite 7.1.4, TypeScript 5.7.3, Vitest 3.2.4
- Performance: Mobile Score 58, Desktop Score 59 (Phase 9 Week 1 rollback pending)

**Active Work** (2025 Q1 Project Refresh):

See [PROJECT_REFRESH_PLAN_2025Q1.md](../docs/tasks/PROJECT_REFRESH_PLAN_2025Q1.md) for complete 4-week plan.

**Week 1 (12/9-15) - Emergency Fixes**:

- 🔥 Vitest 4.0.15 migration (breaking changes: coverage.all, poolOptions)
- 🔥 Phase 9 Week 1 rollback (TBT +49% degradation)
- Node.js engines constraint (>=20.19.0)

**Week 2-4 Highlights**:

- Vite 7.2.7 upgrade, React 19 compatibility audit
- Google Maps API lazy loading (TBT -5,000ms target)
- Playwright E2E introduction (resolve 4 skipped tests)

**Key Lesson from Phase 9 Failure**:

- Micro-optimizations can backfire on small datasets (<1,000 items)
- Event loop overhead (480ms) > processing savings (150ms) for 623 items
- Always: Profile → Measure → Optimize (not: Assume → Optimize → Measure)

**Phase History**: See [TASKS.md Done section](../docs/tasks/TASKS.md) for Phase 2-8 completion details.

## 15. Key Documentation References

**Essential**:

- [TASKS.md](../docs/tasks/TASKS.md): Current tasks, phase history, priorities
- [PROJECT_REFRESH_PLAN_2025Q1.md](../docs/tasks/PROJECT_REFRESH_PLAN_2025Q1.md): 4-week technical refresh strategy
- [SHARED_GLOSSARY.md](../docs/guidelines/SHARED_GLOSSARY.md): Terms, quality standards, thresholds

**Implementation Details**:

- [pwa-implementation-notes.md](../docs/design/pwa-implementation-notes.md): Service Worker, caching strategies
- [COLLAB_PROMPT.md](../docs/guidelines/COLLAB_PROMPT.md): AI collaboration patterns

## 16. Python Data Platform

`data-platform/` is an independent Python environment:

- Uses `requirements.txt` (not package.json)
- Not imported by JavaScript side
- Future: Add pytest to CI matrix
- Run separately from Node workflows

---

**Version**: 2.8 (2025-12-09)
**Based on**: GitHub Copilot Custom Instructions Best Practices (Jan 2025)
**Last Update**: 2025 Q1プロジェクト刷新計画策定完了 - Phase 9失敗教訓、Vitest 4即時マイグレーション (Week 1)、Google Maps API最適化 (Week 3)、Playwright導入 (Week 4) - 詳細: PROJECT_REFRESH_PLAN_2025Q1.md, TASKS.md updated
