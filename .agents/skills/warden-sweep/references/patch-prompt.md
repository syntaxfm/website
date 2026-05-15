Fix a verified code issue. You are working in a git worktree at: ${WORKTREE}

## Finding
- Title: ${TITLE}
- File: ${FILE_PATH}:${START_LINE}
- Description: ${DESCRIPTION}
- Verification: ${REASONING}
- Suggested Fix: ${FIX_DESCRIPTION}
```diff
${FIX_DIFF}
```

## Instructions

### Step 1: Understand the code
Read the file at ${WORKTREE}/${FILE_PATH}. Read at least 50 lines above and below the reported location. Trace callers and callees of the affected code using Grep/Glob to understand how it is used. Do NOT skip this step.

### Step 2: Apply a minimal fix
Apply the smallest change that addresses the finding. If the suggested diff doesn't apply cleanly, adapt it while preserving intent. Do NOT refactor surrounding code, rename variables, add comments, or make any change beyond what the finding requires.

### Step 3: Write tests
Write or update tests that verify the fix:
- Follow existing test patterns (co-located files, same framework)
- At minimum, write a test that would have caught the original bug
- Test the specific edge case, not just the happy path

Only modify the fix target and its test file.

### Step 4: Self-review
Before staging, run `git diff` in the worktree and review every changed line. Verify:
1. The change addresses the specific finding described, not something else
2. No unrelated code was modified (no drive-by cleanups, no formatting changes)
3. Trace through changed code paths: does the fix introduce any new bug, null reference, type error, or broken import?
4. Tests exercise the fix (the failure case), not just that the code runs

If ANY check fails, fix the problem before proceeding. If the suggested fix is wrong or would introduce a regression you cannot resolve, do NOT commit. Instead, skip to the output step and report why.

### Step 5: Commit
Do NOT run tests locally. CI will validate the changes.

Stage and commit with this exact message:

fix: ${TITLE}

Warden finding ${FINDING_ID}
Severity: ${SEVERITY}

Co-Authored-By: Warden <noreply@getsentry.com>

### Step 6: Output
Return ONLY valid JSON (no surrounding text). Use `"status": "applied"` if you committed a fix, or `"status": "skipped"` if you did not.

```json
{
  "status": "applied",
  "filesChanged": ["src/example.ts"],
  "testFilesChanged": ["src/example.test.ts"],
  "selfReview": "Verified the fix addresses the null check and test covers the failure case",
  "skipReason": null
}
```

When skipping:
```json
{
  "status": "skipped",
  "filesChanged": [],
  "testFilesChanged": [],
  "selfReview": null,
  "skipReason": "The suggested fix would introduce a regression in the error handling path"
}
```
