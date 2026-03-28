# TrueBid — Save & Push to GitHub

Run these three phases in order. Do not proceed to the next phase if the current phase has any failures. Report status after each phase.

---

## Phase 1 — Pre-commit audit (run first, fix anything flagged before continuing)

1. Confirm `.env` and `.env.local` are in `.gitignore` and will NOT be pushed
2. Scan all files for hardcoded secrets, API keys, or connection strings
3. Check for `console.log` statements exposing sensitive data (emails, tokens, addresses)
4. Run `tsc --noEmit` — must return zero type errors
5. Run `npm run build` — must complete without errors
6. Run the full test suite — all tests must be passing
7. Run ESLint — report any errors
8. Check for leftover `TODO`, `FIXME`, `HACK`, or `console.log` in recently changed files
9. Run `prisma migrate status` — confirm no pending migrations
10. Run `git status` — list all modified, new, and untracked files
11. Flag any files that should NOT be committed (build artifacts, .env files, .DS_Store, node_modules)

If anything in Phase 1 fails → stop, list what needs fixing, do not continue to Phase 2.

If Phase 1 is fully clean → print "✓ Phase 1 complete — codebase is clean" and continue.

---

## Phase 2 — Commit and push to GitHub

1. Stage all changes: `git add -A`
2. Ask me: "Please provide a one-line description of what was built or changed in this session." Wait for my response, then use it to construct the commit message in this format:
   `feat: [my description] — [X]/[X] tests passing`
3. Create the commit with that message
4. Push to GitHub: `git push origin main` (or the current active branch if different)
5. Confirm the push succeeded and show the commit hash

If the push fails for any reason → stop and report the exact error. Do not retry automatically.

If Phase 2 succeeds → print "✓ Phase 2 complete — pushed to GitHub" and continue.

---

## Phase 3 — Confirmation summary

Print a final summary in this format:

**TrueBid save complete ✓**
- Commit: [hash]
- Branch: [branch name]
- Files changed: [number]
- Tests passing: [X/X]
- Time: [timestamp]
- Next step: Go to GitHub and confirm the commit appears and no .env file is visible in the file tree

---

If any phase fails, clearly state which phase failed, what the error was, and what needs to be fixed before running /truebid-save again.
