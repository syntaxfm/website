#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# AGENTS.md: "Package manager: pnpm". Block npm/yarn/bun package-manager subcommands.

if echo "$COMMAND" | grep -Eq '(^|[;&|[:space:]])npm[[:space:]]+(install|i|add|ci|run|exec|rm|remove|uninstall|update|upgrade|outdated|audit|publish|pack|link|init|test|start)\b'; then
  echo "Blocked: this repo uses pnpm (see AGENTS.md). Use 'pnpm' instead of 'npm'." >&2
  exit 2
fi

if echo "$COMMAND" | grep -Eq '(^|[;&|[:space:]])npx([[:space:]]|$)'; then
  echo "Blocked: this repo uses pnpm (see AGENTS.md). Use 'pnx' (https://pnpm.io/cli/pnx) or 'pnpm exec' instead of 'npx'." >&2
  exit 2
fi

if echo "$COMMAND" | grep -Eq '(^|[;&|[:space:]])bun[[:space:]]+(install|i|add|run|rm|remove|update|upgrade|link|init|test)\b'; then
  echo "Blocked: this repo uses pnpm (see AGENTS.md). Use 'pnpm' instead of 'bun'." >&2
  exit 2
fi

if echo "$COMMAND" | grep -Eq '(^|[;&|[:space:]])yarn([[:space:]]|$)'; then
  echo "Blocked: this repo uses pnpm (see AGENTS.md). Use 'pnpm' instead of 'yarn'." >&2
  exit 2
fi

exit 0
