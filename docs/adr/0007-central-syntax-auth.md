# ADR-0007 — Central Syntax Auth with local editorial profiles

## Status

Accepted.

## Decision

The website consumes the shared Better Auth session owned by `auth.syntax.fm`; it does not own authentication users, provider accounts, sessions, OAuth callbacks, or auth cookies. The immutable central User ID is mapped explicitly to an optional local Profile, and application roles remain attached to that Profile. Profiles retain the existing UUIDs used by Host and article-author relationships, while authenticated Users without a mapped Profile have no application roles.

## Why

Replacing the existing Profile UUIDs with Better Auth text IDs would rewrite historical Show and Article relationships and conflate central identity with public editorial data. Keeping the old app-local GitHub OAuth model would duplicate bearer sessions and violate the shared `*.syntax.fm` trust model. An explicit mapping preserves editorial identity while making central session validation the only authentication authority; it also fails closed because display names and email addresses never grant roles automatically.

## Trade-offs

- New administrators must be mapped to a Profile by central User ID before app roles take effect.
- A central User and a local Profile are deliberately separate concepts and IDs.
- The website depends on `auth.syntax.fm` for signed-in requests, so central failures are treated as signed out and never bypassed with cached identity data.

## Development

Development uses the same identity-to-Profile boundary, with a shared local Auth service on
loopback and browser sign-in/out on the website's own address. Localhost is the default; network
listening is opt-in and developer-managed HTTP/HTTPS names require explicit origins. Production's
Auth address remains fixed in code and cannot be replaced by these settings.

`pnpm preheat` idempotently maps `local-developer` to a local Profile with the admin role. This
bootstrap, database restore, and migrations target the local Docker database only. Development
session validation has a deadline covering headers and body reading; sign-out bounds its header
wait and discards the body. Failed admin remote writes return an error without executing,
redirecting, retrying, or replaying the command. See the
[developer guide](../../README.md#admin-sign-in) and
[shared consumer contract](../../../auth/CONSUMING_AUTH.md).
