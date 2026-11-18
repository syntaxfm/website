# Optional Midscene browser tests

This opt-in suite exercises audio timestamp sharing through the actual Syntax UI.
It complements the existing Playwright tests; it does not replace them.

## Coverage

- Play the fixture episode, pause, and skip forward twice with the visible controls.
- Copy a timestamped link, verify its timestamp against the real audio position,
  follow the short-link redirect in a fresh browser context, and verify the first
  playback event starts at that position.
- Enable and then disable timestamp sharing. Verify the copied URL has no query
  and a new listener starts at zero, without inheriting the sender's saved history.

UI actions use Midscene `aiAct`; clipboard, redirect, episode identity, and actual
media time are checked with deterministic assertions. The media is a generated,
seekable three-minute WAV served locally, not a mocked HTMLMediaElement. No live
podcast, account, Redis, YouTube, or podcast API credentials are required.

Issue [#2302](https://github.com/syntaxfm/website/issues/2302) motivated this suite.
It is **not claimed fixed**: the original report involves video, whereas this
initial suite covers audio-only sharing through the main episode Play button.
The suite reproduced an initialization bug: the preloaded episode was marked
LOADED, so its page Play button resumed instead of applying the shared timestamp.
The player now remains INITIAL until playback is requested.

YouTube timing, audio/video timeline mapping, and starting directly from the bottom
player control need separate coverage. The bottom control also started at zero in
local diagnosis; this change does not claim to fix that route.

## Run locally

Use the repository's Node/pnpm versions. Configure `.env` from `.env.example` with
`DATABASE_URL` pointing to a disposable MySQL database named `syntax_midscene`.
Never run schema or fixture commands against a shared or production database.
The seed script refuses other database names and upserts only fixture episode 9999.
Leave Redis and third-party API credentials empty.

```sh
pnpm install --frozen-lockfile
pnpm db:push
pnpm db:generate
pnpm test:midscene:seed
pnpm build
pnpm exec playwright install chromium
pnpm test:midscene:check
BROWSER_CHANNEL=chromium pnpm test:midscene
```

Export your Midscene model configuration in the shell before running. For example:

```sh
export MIDSCENE_MODEL_NAME=gpt-6.1-terra
export MIDSCENE_MODEL_FAMILY=gpt-6
export MIDSCENE_MODEL_PROTOCOL=openai-responses
export MIDSCENE_MODEL_BASE_URL=https://api.openai.com/v1
export MIDSCENE_MODEL_REASONING_EFFORT=low
# Set MIDSCENE_MODEL_API_KEY securely; do not commit it.
```

Ports 4180 (built app) and 4181 (audio) must be free. The default browser channel is
locally installed Chrome; set `BROWSER_CHANNEL=chromium` for Playwright's Chromium.
Cases run serially with zero retries. Reports are written beneath
`tests/midscene/midscene_run/`; machine-readable results are in `.midscene/test-results/`.

## Fork CI and reports

`.github/workflows/midscene.yml` runs only when repository variable
`MIDSCENE_E2E_ENABLED` is `true`. It supports manual dispatch and scoped pushes to
`main` / `test/midscene`. It never runs untrusted PR code with model or publishing
secrets. MySQL is an ephemeral job service seeded with only the test episode.

Set the five model variables above as repository variables and
`MIDSCENE_MODEL_API_KEY` as a repository secret. No credentials are needed upstream
until maintainers explicitly opt in.

For an online report, create a Cloudflare Pages direct-upload project and configure:

- `MIDSCENE_PAGES_PROJECT`: repository variable containing its name.
- `CLOUDFLARE_ACCOUNT_ID`: repository variable.
- `CLOUDFLARE_API_TOKEN`: repository secret with Pages Edit for that account.

The job uploads report artifacts for 14 days and publishes the HTML report even
when tests fail. The Actions Summary links to both the online report and artifacts.
Reports contain fixture screenshots and prompts and are public when published.
