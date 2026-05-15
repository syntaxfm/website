#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# ///
"""
Find top git contributors for a file to use as PR reviewers.

Usage:
    python find_reviewers.py <file-path>
    python find_reviewers.py src/foo.ts

Output: JSON to stdout with GitHub usernames of top 2 contributors
from the last 12 months.

{"reviewers": ["user1", "user2"]}

If no contributors found or mapping fails, returns empty list.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _utils import run_cmd_stdout as run_cmd  # noqa: E402


def get_top_authors(file_path: str, count: int = 2) -> list[str]:
    """Get top N author emails for a file from git log (last 12 months)."""
    output = run_cmd([
        "git", "log",
        "--format=%ae",
        "--since=12 months ago",
        "--", file_path,
    ])

    if not output:
        return []

    # Count occurrences of each email
    email_counts: dict[str, int] = {}
    for email in output.splitlines():
        email = email.strip()
        if email:
            email_counts[email] = email_counts.get(email, 0) + 1

    # Sort by count descending
    sorted_emails = sorted(email_counts.items(), key=lambda x: x[1], reverse=True)

    return [email for email, _ in sorted_emails[:count]]


def email_to_github_username(email: str) -> str | None:
    """Try to map a git email to a GitHub username.

    Extracts from noreply emails directly. For other emails,
    uses the GitHub search-by-email API via gh CLI.
    """
    # Handle GitHub noreply emails directly
    if email.endswith("@users.noreply.github.com"):
        # Format: 12345+username@users.noreply.github.com
        # or: username@users.noreply.github.com
        local = email.split("@")[0]
        if "+" in local:
            return local.split("+", 1)[1]
        return local

    # gh api handles URL encoding; pass email directly in the query
    output = run_cmd([
        "gh", "api", f"search/users?q={email}+in:email",
        "--jq", ".items[0].login",
    ])
    return output if output else None


def get_current_github_user() -> str | None:
    """Get the currently authenticated GitHub username."""
    output = run_cmd(["gh", "api", "/user", "--jq", ".login"])
    return output if output else None


def main():
    parser = argparse.ArgumentParser(
        description="Find top git contributors for PR reviewer assignment"
    )
    parser.add_argument("file_path", help="Path to the file to find reviewers for")
    parser.add_argument(
        "--count", type=int, default=2,
        help="Number of reviewers to find (default: 2)",
    )
    args = parser.parse_args()

    current_user = get_current_github_user()

    # Request extra candidates to compensate for self-exclusion
    fetch_count = args.count + 1 if current_user else args.count
    emails = get_top_authors(args.file_path, fetch_count)
    if not emails:
        print(json.dumps({"reviewers": [], "note": "No recent authors found"}))
        return

    reviewers: list[str] = []
    for email in emails:
        username = email_to_github_username(email)
        if username and username != current_user:
            reviewers.append(username)

    print(json.dumps({"reviewers": reviewers[:args.count]}))


if __name__ == "__main__":
    main()
