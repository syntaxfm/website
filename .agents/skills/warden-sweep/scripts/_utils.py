"""Shared utilities for warden-sweep scripts."""
from __future__ import annotations

import json
import os
import subprocess
from typing import Any


def run_cmd(
    args: list[str], timeout: int = 30, cwd: str | None = None
) -> subprocess.CompletedProcess[str]:
    """Run a command and return the result."""
    return subprocess.run(
        args,
        capture_output=True,
        text=True,
        timeout=timeout,
        cwd=cwd,
    )


def run_cmd_stdout(
    args: list[str], timeout: int = 30, cwd: str | None = None
) -> str | None:
    """Run a command and return stripped stdout, or None on failure."""
    try:
        result = run_cmd(args, timeout=timeout, cwd=cwd)
        return result.stdout.strip() if result.returncode == 0 else None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def read_json(path: str) -> dict[str, Any] | None:
    """Read a JSON file and return parsed object, or None on failure."""
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def write_json(path: str, data: dict[str, Any]) -> None:
    """Write a dict to a JSON file with trailing newline."""
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def read_jsonl(path: str) -> list[dict[str, Any]]:
    """Read a JSONL file and return list of parsed objects."""
    entries: list[dict[str, Any]] = []
    if not os.path.exists(path):
        return entries
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def severity_badge(severity: str) -> str:
    """Return a markdown-friendly severity indicator."""
    badges = {
        "critical": "**CRITICAL**",
        "high": "**HIGH**",
        "medium": "MEDIUM",
        "low": "LOW",
        "info": "info",
    }
    return badges.get(severity, severity)


def pr_number_from_url(pr_url: str) -> str:
    """Extract the PR or issue number from a GitHub URL's last path segment."""
    return pr_url.rstrip("/").split("/")[-1]


def ensure_github_label(name: str, color: str, description: str) -> None:
    """Create a GitHub label if it doesn't exist (idempotent)."""
    try:
        subprocess.run(
            [
                "gh", "label", "create", name,
                "--color", color,
                "--description", description,
            ],
            capture_output=True,
            timeout=15,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
