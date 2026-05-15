# Verify Phase

Deep-trace every finding before patching. This phase qualifies true issues and rejects false positives.

## Input

Read findings from:

```text
<sweep-dir>/data/all-findings.jsonl
```

## Process

For each finding:

1. If `data/verify/<finding-id>.json` exists, skip it.
2. Launch verification work using the host agent's task/delegation mechanism when available. Process findings in parallel batches up to 8 if the host supports parallel work.
3. Read `references/verify-prompt.md` and substitute the finding values into the `${...}` placeholders.
4. Parse the returned JSON.
5. Write the raw result to `data/verify/<finding-id>.json`.
6. Append verified findings to `data/verified.jsonl`.
7. Append rejected findings to `data/rejected.jsonl`.
8. For verified findings, generate `findings/<finding-id>.md`.

If the host does not support delegated tasks, run the same verification prompt serially.

## Verified Finding Report

````markdown
# ${TITLE}

**ID**: ${FINDING_ID} | **Severity**: ${SEVERITY} | **Confidence**: ${CONFIDENCE}
**Skill**: ${SKILL} | **File**: ${FILE_PATH}:${START_LINE}

## Description
${DESCRIPTION}

## Verification
**Verdict**: Verified (${VERIFICATION_CONFIDENCE})
**Reasoning**: ${REASONING}
**Code trace**: ${TRACE_NOTES}

## Suggested Fix
${FIX_DESCRIPTION}
```diff
${FIX_DIFF}
```
````

Update the manifest: set `phases.verify` to `"complete"`.

## Report Template

```markdown
## Verification Complete

**{verified}** verified, **{rejected}** rejected.

### Verified Findings

| # | Severity | Confidence | File | Title | Reasoning |
|---|----------|------------|------|-------|-----------|
| 1 | **HIGH** | high | `src/db/query.ts:42` | SQL injection in query builder | User input flows directly into... |

### Rejected ({rejected_count})

- `{findingId}` {file}: {reasoning}
```
