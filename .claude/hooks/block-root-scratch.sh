#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# AGENTS.md: "No scratch files at the repo root. No test.ts, tmp.js, scratch.md, notes.md, output.json."
# Block creation via touch and shell redirects targeting these filenames at the repo root
# (no leading directory, or leading "./").

SCRATCH_NAMES='(test\.ts|tmp\.js|scratch\.md|notes\.md|output\.json)'

if echo "$COMMAND" | grep -Eq "(^|[;&|[:space:]])touch[[:space:]]+(\./)?${SCRATCH_NAMES}([[:space:]]|;|&|\||$)"; then
  echo "Blocked: AGENTS.md forbids scratch files at the repo root (test.ts, tmp.js, scratch.md, notes.md, output.json). Use /scratch/ (gitignored) instead." >&2
  exit 2
fi

if echo "$COMMAND" | grep -Eq ">>?[[:space:]]*(\./)?${SCRATCH_NAMES}([[:space:]]|;|&|\||$)"; then
  echo "Blocked: AGENTS.md forbids scratch files at the repo root (test.ts, tmp.js, scratch.md, notes.md, output.json). Use /scratch/ (gitignored) instead." >&2
  exit 2
fi

if echo "$COMMAND" | grep -Eq "(^|[;&|[:space:]])tee[[:space:]]+(-a[[:space:]]+)?(\./)?${SCRATCH_NAMES}([[:space:]]|;|&|\||$)"; then
  echo "Blocked: AGENTS.md forbids scratch files at the repo root (test.ts, tmp.js, scratch.md, notes.md, output.json). Use /scratch/ (gitignored) instead." >&2
  exit 2
fi

exit 0
