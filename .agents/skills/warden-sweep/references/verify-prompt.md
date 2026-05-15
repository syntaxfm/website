Verify a code analysis finding. Determine if this is a TRUE issue or a FALSE POSITIVE.
Do NOT write or edit any files. Research only.

## Finding
- Title: ${TITLE}
- Severity: ${SEVERITY} | Confidence: ${CONFIDENCE}
- Skill: ${SKILL}
- Location: ${FILE_PATH}:${START_LINE}-${END_LINE}
- Description: ${DESCRIPTION}
- Verification hint: ${VERIFICATION}

## Instructions
1. Read the file at the reported location. Examine at least 50 lines of surrounding context.
2. Trace data flow to/from the flagged code using Grep/Glob.
3. Check if the issue is mitigated elsewhere (guards, validation, try/catch upstream).
4. Check if the issue is actually reachable in practice.

Return your verdict as JSON:
{
  "findingId": "${FINDING_ID}",
  "verdict": "verified" or "rejected",
  "confidence": "high" or "medium" or "low",
  "reasoning": "2-3 sentence explanation",
  "traceNotes": "What code paths you examined"
}
