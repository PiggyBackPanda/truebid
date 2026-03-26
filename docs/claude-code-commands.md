# TrueBid — Claude Code Custom Commands

## Overview

These are reusable prompt templates for Claude Code. Save each one as a separate .md file in `.claude/commands/` in the project root. Once saved, they are available as `/project:command-name` in Claude Code. The `$ARGUMENTS` placeholder is replaced with whatever you type after the command name.

---

## File: `.claude/commands/new-feature.md`

```markdown
Implement a new feature from its specification.

1. Read the spec at /docs/specs/$ARGUMENTS.md
2. Read CLAUDE.md for project conventions
3. Read /docs/design/design-tokens.md for any UI work
4. Plan the implementation — list all files you will create or modify
5. Implement everything described in the spec
6. Create Zod validation schemas in src/lib/validation.ts (if new validation needed)
7. Write tests for all new functionality (unit tests colocated, E2E in tests/e2e/)
8. Run npm run typecheck — fix any errors
9. Run npm run lint — fix any errors
10. Run npm run test — fix any failures
11. Commit all changes with a descriptive conventional commit message (feat: ...)

IMPORTANT: Follow the code style rules in CLAUDE.md exactly. Use Server Components by default. Currency in cents. Dates in UTC. No any types.
```

---

## File: `.claude/commands/fix-bug.md`

```markdown
Fix a bug in the application.

Bug description: $ARGUMENTS

1. Read CLAUDE.md for project conventions
2. Investigate the relevant source code to understand the current behaviour
3. Identify the root cause of the bug
4. Implement the fix with minimal changes — do not refactor unrelated code
5. Write a test that reproduces the bug (should fail before fix, pass after)
6. Run npm run typecheck — fix any errors
7. Run npm run test — ensure all tests pass including the new one
8. Commit with message: fix: [concise description of what was fixed]
```

---

## File: `.claude/commands/new-page.md`

```markdown
Create a new page in the application.

Page route/path: $ARGUMENTS

1. Read CLAUDE.md for project conventions
2. Read /docs/design/design-tokens.md for visual styling
3. Create the page at the specified route in src/app/
4. Use Server Components for the page shell, Client Components only for interactive parts
5. Include proper metadata export (title, description, openGraph)
6. Make the page fully responsive (mobile-first: 375px, tablet: 768px, desktop: 1024px)
7. Follow the design patterns in /docs/design/design-tokens.md
8. Run npm run typecheck and npm run lint — fix any errors
9. Commit with message: feat: add [page name] page
```

---

## File: `.claude/commands/review.md`

```markdown
Review all changed files in the current git branch for quality issues.

1. Run git diff main --name-only to identify changed files
2. Read each changed file and check for:
   - TypeScript errors or use of `any` type
   - Missing error handling in API routes (every route needs try/catch)
   - Security issues: SQL injection, XSS, exposed secrets, missing auth checks
   - Missing input validation (all API inputs should use Zod)
   - Accessibility issues in UI components (missing alt text, aria labels, semantic HTML)
   - Performance issues (N+1 queries, missing indexes, large bundle imports)
   - Deviations from CLAUDE.md conventions (wrong font, wrong colour, wrong pattern)
   - Missing tests for new functionality
3. Report findings grouped by severity: CRITICAL, WARNING, SUGGESTION
4. For each finding, include the file path, line reference, and a specific fix recommendation
5. Do NOT make changes — only report. Wait for instruction to fix.
```

---

## File: `.claude/commands/deploy-check.md`

```markdown
Run all checks required before deploying to production.

1. Run npm run typecheck — report any TypeScript errors
2. Run npm run lint — report any linting errors
3. Run npm run test — report any test failures
4. Run npm run build — report any build errors
5. Check for any TODO or FIXME comments in src/ — list them
6. Check that .env.local is in .gitignore
7. Check that no API keys or secrets are hardcoded in source files
8. Report a summary: PASS (all clear for deploy) or FAIL (with list of blockers)
```

---

## File: `.claude/commands/new-api.md`

```markdown
Create a new API endpoint.

Endpoint: $ARGUMENTS (e.g., "POST /api/listings/[id]/publish")

1. Read CLAUDE.md for conventions
2. Read /docs/specs/api-contracts.md for the endpoint specification
3. Create the route file at the correct path in src/app/api/
4. Add Zod validation schema to src/lib/validation.ts
5. Implement the endpoint following the pattern in CLAUDE.md:
   - try/catch wrapper
   - Authentication check (requireAuth)
   - Input validation with Zod
   - Business logic
   - Proper error responses with error codes
6. Write tests covering: success case, validation failure, auth failure, edge cases
7. Run npm run typecheck && npm run test — fix any issues
8. Commit with message: feat: add [METHOD] [path] endpoint
```

---

## File: `.claude/commands/new-component.md`

```markdown
Create a new UI component.

Component: $ARGUMENTS (e.g., "OfferRow" or "CountdownTimer")

1. Read CLAUDE.md for conventions
2. Read /docs/design/design-tokens.md for styling
3. Determine the correct directory:
   - Primitive/reusable → src/components/ui/
   - Layout → src/components/layout/
   - Listing-specific → src/components/listings/
   - Dashboard-specific → src/components/dashboard/
4. Create the component as a named export, TypeScript, with full prop types
5. Use Tailwind CSS for styling, referencing the design tokens
6. Make it responsive (mobile-first)
7. Include accessibility: proper semantic HTML, aria attributes where needed
8. If the component has interactive states, write a test file alongside it
9. Run npm run typecheck — fix any errors
10. Commit with message: feat: add [ComponentName] component
```

---

## File: `.claude/commands/seed-data.md`

```markdown
Regenerate or update the database seed data.

Context: $ARGUMENTS (e.g., "add 10 more listings in Fremantle area")

1. Read the fixture files in /docs/fixtures/
2. Update prisma/seed.ts based on the request
3. Run npm run db:reset to drop, recreate, and re-seed the database
4. Verify the seed completed successfully by querying the database
5. Report how many records were created for each model
```

---

## File: `.claude/commands/test-feature.md`

```markdown
Write comprehensive tests for an existing feature.

Feature: $ARGUMENTS (e.g., "offer submission" or "listing search")

1. Read CLAUDE.md for testing conventions
2. Read the relevant spec in /docs/specs/ to understand expected behaviour
3. Identify all files related to this feature
4. Write unit tests for utility functions and business logic
5. Write integration tests for API endpoints (test with real database)
6. Write at least one E2E test for the critical user path
7. Run npm run test — ensure all new tests pass
8. Report test coverage for the feature's files
9. Commit with message: test: add tests for [feature name]
```

---

## Usage Examples

Once these files are saved, here's how you use them in Claude Code:

```bash
# Build the offer system from its spec
/project:new-feature offer-system

# Fix a specific bug
/project:fix-bug "When placing an offer, the WebSocket event is not emitted so the offer board doesn't update in real time"

# Create a new page
/project:new-page "listings/[id]/page.tsx — the listing detail page with offer board"

# Create a new API endpoint
/project:new-api "POST /api/offers/[id]/increase"

# Create a new component
/project:new-component "CountdownTimer — shows days/hours/min/sec until listing closes"

# Review before deploying
/project:review

# Pre-deployment checks
/project:deploy-check

# Write tests for a feature
/project:test-feature "offer submission and anti-snipe logic"

# Update seed data
/project:seed-data "add 5 listings in Cottesloe with open offers and 3-4 bids each"
```

Each command is self-contained — Claude Code reads the spec, follows the conventions, implements, tests, and commits. Your only input is the command itself.
