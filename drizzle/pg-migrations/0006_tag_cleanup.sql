-- Merges duplicate topic tags and fixes all-lowercase names (2026-11-16). Keyed by slug, so it
-- skips any tag that isn't there. A merged tag's old URL redirects to the tag it joined.

-- webdev → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webdev' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'webdev' AND kept."slug" = 'web-development' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'webdev', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-development' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'webdev') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'webdev';
--> statement-breakpoint
-- web-dev → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'web-dev' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'web-dev' AND kept."slug" = 'web-development' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'web-dev', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-development' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'web-dev') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'web-dev';
--> statement-breakpoint
-- WebDevelopment → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webdevelopment' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'webdevelopment' AND kept."slug" = 'web-development' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'webdevelopment', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-development' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'webdevelopment') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'webdevelopment';
--> statement-breakpoint
-- front-end → Frontend
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'front-end' JOIN "tags" kept ON kept."slug" = 'frontend' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'front-end' AND kept."slug" = 'frontend' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'front-end', kept."id" FROM "tags" kept WHERE kept."slug" = 'frontend' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'front-end') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'front-end';
--> statement-breakpoint
-- front end development → Frontend
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'front-end-development' JOIN "tags" kept ON kept."slug" = 'frontend' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'front-end-development' AND kept."slug" = 'frontend' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'front-end-development', kept."id" FROM "tags" kept WHERE kept."slug" = 'frontend' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'front-end-development') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'front-end-development';
--> statement-breakpoint
-- OpenSource → Open Source
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'opensource' JOIN "tags" kept ON kept."slug" = 'open-source' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'opensource' AND kept."slug" = 'open-source' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'opensource', kept."id" FROM "tags" kept WHERE kept."slug" = 'open-source' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'opensource') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'opensource';
--> statement-breakpoint
-- oss → Open Source
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'oss' JOIN "tags" kept ON kept."slug" = 'open-source' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'oss' AND kept."slug" = 'open-source' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'oss', kept."id" FROM "tags" kept WHERE kept."slug" = 'open-source' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'oss') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'oss';
--> statement-breakpoint
-- node → Node.js
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'node' JOIN "tags" kept ON kept."slug" = 'nodejs' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'node' AND kept."slug" = 'nodejs' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'node', kept."id" FROM "tags" kept WHERE kept."slug" = 'nodejs' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'node') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'node';
--> statement-breakpoint
-- reactjs → React
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'reactjs' JOIN "tags" kept ON kept."slug" = 'react' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'reactjs' AND kept."slug" = 'react' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'reactjs', kept."id" FROM "tags" kept WHERE kept."slug" = 'react' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'reactjs') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'reactjs';
--> statement-breakpoint
-- vuejs → Vue
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'vuejs' JOIN "tags" kept ON kept."slug" = 'vue' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'vuejs' AND kept."slug" = 'vue' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'vuejs', kept."id" FROM "tags" kept WHERE kept."slug" = 'vue' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'vuejs') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'vuejs';
--> statement-breakpoint
-- Artificial Intelligence → AI
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'artificial-intelligence' JOIN "tags" kept ON kept."slug" = 'ai' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'artificial-intelligence' AND kept."slug" = 'ai' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'artificial-intelligence', kept."id" FROM "tags" kept WHERE kept."slug" = 'ai' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'artificial-intelligence') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'artificial-intelligence';
--> statement-breakpoint
-- api → APIs
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'api' JOIN "tags" kept ON kept."slug" = 'apis' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'api' AND kept."slug" = 'apis' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'api', kept."id" FROM "tags" kept WHERE kept."slug" = 'apis' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'api') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'api';
--> statement-breakpoint
-- a11y → Accessibility
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'a11y' JOIN "tags" kept ON kept."slug" = 'accessibility' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'a11y' AND kept."slug" = 'accessibility' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'a11y', kept."id" FROM "tags" kept WHERE kept."slug" = 'accessibility' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'a11y') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'a11y';
--> statement-breakpoint
-- DeveloperTools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'developertools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'developertools' AND kept."slug" = 'developer-tools' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'developertools', kept."id" FROM "tags" kept WHERE kept."slug" = 'developer-tools' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'developertools') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'developertools';
--> statement-breakpoint
-- Dev Tools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'dev-tools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'dev-tools' AND kept."slug" = 'developer-tools' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'dev-tools', kept."id" FROM "tags" kept WHERE kept."slug" = 'developer-tools' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'dev-tools') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'dev-tools';
--> statement-breakpoint
-- DevTools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'devtools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'devtools' AND kept."slug" = 'developer-tools' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'devtools', kept."id" FROM "tags" kept WHERE kept."slug" = 'developer-tools' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'devtools') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'devtools';
--> statement-breakpoint
-- careers → Career
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'careers' JOIN "tags" kept ON kept."slug" = 'career' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'careers' AND kept."slug" = 'career' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'careers', kept."id" FROM "tags" kept WHERE kept."slug" = 'career' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'careers') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'careers';
--> statement-breakpoint
-- podcast → Podcasts
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'podcast' JOIN "tags" kept ON kept."slug" = 'podcasts' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'podcast' AND kept."slug" = 'podcasts' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'podcast', kept."id" FROM "tags" kept WHERE kept."slug" = 'podcasts' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'podcast') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'podcast';
--> statement-breakpoint
-- webcomponents → Web Components
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webcomponents' JOIN "tags" kept ON kept."slug" = 'web-components' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'webcomponents' AND kept."slug" = 'web-components' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'webcomponents', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-components' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'webcomponents') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'webcomponents';
--> statement-breakpoint
-- webperf → Web Performance
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webperf' JOIN "tags" kept ON kept."slug" = 'web-performance' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'webperf' AND kept."slug" = 'web-performance' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'webperf', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-performance' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'webperf') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'webperf';
--> statement-breakpoint
-- wasm → WebAssembly
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'wasm' JOIN "tags" kept ON kept."slug" = 'webassembly' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'wasm' AND kept."slug" = 'webassembly' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'wasm', kept."id" FROM "tags" kept WHERE kept."slug" = 'webassembly' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'wasm') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'wasm';
--> statement-breakpoint
-- vs code → VS Code
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'vs-code' JOIN "tags" kept ON kept."slug" = 'vscode' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'vs-code' AND kept."slug" = 'vscode' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'vs-code', kept."id" FROM "tags" kept WHERE kept."slug" = 'vscode' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'vs-code') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'vs-code';
--> statement-breakpoint
-- timemanagement → Time Management
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'timemanagement' JOIN "tags" kept ON kept."slug" = 'time-management' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'timemanagement' AND kept."slug" = 'time-management' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'timemanagement', kept."id" FROM "tags" kept WHERE kept."slug" = 'time-management' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'timemanagement') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'timemanagement';
--> statement-breakpoint
-- StateOfJS → State of JS
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'stateofjs' JOIN "tags" kept ON kept."slug" = 'state-of-js' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'stateofjs' AND kept."slug" = 'state-of-js' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'stateofjs', kept."id" FROM "tags" kept WHERE kept."slug" = 'state-of-js' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'stateofjs') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'stateofjs';
--> statement-breakpoint
-- impostersyndrome → Imposter Syndrome
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'impostersyndrome' JOIN "tags" kept ON kept."slug" = 'imposter-syndrome' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'impostersyndrome' AND kept."slug" = 'imposter-syndrome' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'impostersyndrome', kept."id" FROM "tags" kept WHERE kept."slug" = 'imposter-syndrome' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'impostersyndrome') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'impostersyndrome';
--> statement-breakpoint
-- ruralinternet → Rural Internet
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'ruralinternet' JOIN "tags" kept ON kept."slug" = 'rural-internet' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'ruralinternet' AND kept."slug" = 'rural-internet' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'ruralinternet', kept."id" FROM "tags" kept WHERE kept."slug" = 'rural-internet' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'ruralinternet') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'ruralinternet';
--> statement-breakpoint
-- fullstack → Full Stack
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'fullstack' JOIN "tags" kept ON kept."slug" = 'full-stack' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'fullstack' AND kept."slug" = 'full-stack' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'fullstack', kept."id" FROM "tags" kept WHERE kept."slug" = 'full-stack' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'fullstack') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'fullstack';
--> statement-breakpoint
-- livecoding → Live Coding
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'livecoding' JOIN "tags" kept ON kept."slug" = 'live-coding' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'livecoding' AND kept."slug" = 'live-coding' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'livecoding', kept."id" FROM "tags" kept WHERE kept."slug" = 'live-coding' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'livecoding') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'livecoding';
--> statement-breakpoint
-- NoCode → No Code
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'nocode' JOIN "tags" kept ON kept."slug" = 'no-code' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'nocode' AND kept."slug" = 'no-code' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'nocode', kept."id" FROM "tags" kept WHERE kept."slug" = 'no-code' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'nocode') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'nocode';
--> statement-breakpoint
-- codegeneration → Code Generation
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'codegeneration' JOIN "tags" kept ON kept."slug" = 'code-generation' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'codegeneration' AND kept."slug" = 'code-generation' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'codegeneration', kept."id" FROM "tags" kept WHERE kept."slug" = 'code-generation' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'codegeneration') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'codegeneration';
--> statement-breakpoint
-- servercomponents → Server Components
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'servercomponents' JOIN "tags" kept ON kept."slug" = 'server-components' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'servercomponents' AND kept."slug" = 'server-components' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'servercomponents', kept."id" FROM "tags" kept WHERE kept."slug" = 'server-components' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'servercomponents') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'servercomponents';
--> statement-breakpoint
-- smarthome → Smart Home
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'smarthome' JOIN "tags" kept ON kept."slug" = 'smart-home' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'smarthome' AND kept."slug" = 'smart-home' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'smarthome', kept."id" FROM "tags" kept WHERE kept."slug" = 'smart-home' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'smarthome') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'smarthome';
--> statement-breakpoint
-- webapi → Web APIs
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webapi' JOIN "tags" kept ON kept."slug" = 'web-api' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'webapi' AND kept."slug" = 'web-api' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'webapi', kept."id" FROM "tags" kept WHERE kept."slug" = 'web-api' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'webapi') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'webapi';
--> statement-breakpoint
-- framework → Frameworks
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'framework' JOIN "tags" kept ON kept."slug" = 'frameworks' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'framework' AND kept."slug" = 'frameworks' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'framework', kept."id" FROM "tags" kept WHERE kept."slug" = 'frameworks' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'framework') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'framework';
--> statement-breakpoint
-- beginner → Beginners
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'beginner' JOIN "tags" kept ON kept."slug" = 'beginners' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'beginner' AND kept."slug" = 'beginners' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'beginner', kept."id" FROM "tags" kept WHERE kept."slug" = 'beginners' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'beginner') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'beginner';
--> statement-breakpoint
-- bootcamp → Bootcamps
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'bootcamp' JOIN "tags" kept ON kept."slug" = 'bootcamps' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'bootcamp' AND kept."slug" = 'bootcamps' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'bootcamp', kept."id" FROM "tags" kept WHERE kept."slug" = 'bootcamps' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'bootcamp') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'bootcamp';
--> statement-breakpoint
-- Conference → Conferences
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'conference' JOIN "tags" kept ON kept."slug" = 'conferences' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'conference' AND kept."slug" = 'conferences' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'conference', kept."id" FROM "tags" kept WHERE kept."slug" = 'conferences' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'conference') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'conference';
--> statement-breakpoint
-- Database → Databases
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'database' JOIN "tags" kept ON kept."slug" = 'databases' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'database' AND kept."slug" = 'databases' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'database', kept."id" FROM "tags" kept WHERE kept."slug" = 'databases' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'database') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'database';
--> statement-breakpoint
-- Client → Clients
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'client' JOIN "tags" kept ON kept."slug" = 'clients' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'client' AND kept."slug" = 'clients' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'client', kept."id" FROM "tags" kept WHERE kept."slug" = 'clients' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'client') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'client';
--> statement-breakpoint
-- Portfolio → Portfolios
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'portfolio' JOIN "tags" kept ON kept."slug" = 'portfolios' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'portfolio' AND kept."slug" = 'portfolios' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'portfolio', kept."id" FROM "tags" kept WHERE kept."slug" = 'portfolios' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'portfolio') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'portfolio';
--> statement-breakpoint
-- Monorepos → Monorepos
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'monorepos' JOIN "tags" kept ON kept."slug" = 'monorepo' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'monorepos' AND kept."slug" = 'monorepo' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'monorepos', kept."id" FROM "tags" kept WHERE kept."slug" = 'monorepo' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'monorepos') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'monorepos';
--> statement-breakpoint
-- GatsbyJS → Gatsby
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'gatsbyjs' JOIN "tags" kept ON kept."slug" = 'gatsby' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'gatsbyjs' AND kept."slug" = 'gatsby' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'gatsbyjs', kept."id" FROM "tags" kept WHERE kept."slug" = 'gatsby' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'gatsbyjs') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'gatsbyjs';
--> statement-breakpoint
-- GitHubCopilot → GitHub Copilot
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'githubcopilot' JOIN "tags" kept ON kept."slug" = 'copilot' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'githubcopilot' AND kept."slug" = 'copilot' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'githubcopilot', kept."id" FROM "tags" kept WHERE kept."slug" = 'copilot' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'githubcopilot') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'githubcopilot';
--> statement-breakpoint
-- holiday → Holidays
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'holiday' JOIN "tags" kept ON kept."slug" = 'holidays' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'holiday' AND kept."slug" = 'holidays' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'holiday', kept."id" FROM "tags" kept WHERE kept."slug" = 'holidays' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'holiday') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'holiday';
--> statement-breakpoint
-- Licenses → Licensing
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'licenses' JOIN "tags" kept ON kept."slug" = 'licensing' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'licenses' AND kept."slug" = 'licensing' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'licenses', kept."id" FROM "tags" kept WHERE kept."slug" = 'licensing' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'licenses') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'licenses';
--> statement-breakpoint
-- Server → Servers
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'server' JOIN "tags" kept ON kept."slug" = 'servers' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'server' AND kept."slug" = 'servers' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'server', kept."id" FROM "tags" kept WHERE kept."slug" = 'servers' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'server') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'server';
--> statement-breakpoint
-- game → Games
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'game' JOIN "tags" kept ON kept."slug" = 'games' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'game' AND kept."slug" = 'games' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'game', kept."id" FROM "tags" kept WHERE kept."slug" = 'games' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'game') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'game';
--> statement-breakpoint
-- compiler → Compilers
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'compiler' JOIN "tags" kept ON kept."slug" = 'compilers' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'compiler' AND kept."slug" = 'compilers' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'compiler', kept."id" FROM "tags" kept WHERE kept."slug" = 'compilers' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'compiler') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'compiler';
--> statement-breakpoint
-- terminal → Terminals
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'terminal' JOIN "tags" kept ON kept."slug" = 'terminals' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'terminal' AND kept."slug" = 'terminals' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'terminal', kept."id" FROM "tags" kept WHERE kept."slug" = 'terminals' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'terminal') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'terminal';
--> statement-breakpoint
-- polyfill → Polyfills
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'polyfill' JOIN "tags" kept ON kept."slug" = 'polyfills' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'polyfill' AND kept."slug" = 'polyfills' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'polyfill', kept."id" FROM "tags" kept WHERE kept."slug" = 'polyfills' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'polyfill') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'polyfill';
--> statement-breakpoint
-- workflows → Workflow
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'workflows' JOIN "tags" kept ON kept."slug" = 'workflow' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'workflows' AND kept."slug" = 'workflow' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'workflows', kept."id" FROM "tags" kept WHERE kept."slug" = 'workflow' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'workflows') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'workflows';
--> statement-breakpoint
-- devrel → Developer Relations
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'devrel' JOIN "tags" kept ON kept."slug" = 'developer-relations' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'devrel' AND kept."slug" = 'developer-relations' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'devrel', kept."id" FROM "tags" kept WHERE kept."slug" = 'developer-relations' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'devrel') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'devrel';
--> statement-breakpoint
-- Interviews → Interviews
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'interviews' JOIN "tags" kept ON kept."slug" = 'interview' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'interviews' AND kept."slug" = 'interview' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'interviews', kept."id" FROM "tags" kept WHERE kept."slug" = 'interview' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'interviews') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'interviews';
--> statement-breakpoint
-- self-hosted → Self-Hosting
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'self-hosted' JOIN "tags" kept ON kept."slug" = 'self-hosting' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'self-hosted' AND kept."slug" = 'self-hosting' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'self-hosted', kept."id" FROM "tags" kept WHERE kept."slug" = 'self-hosting' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'self-hosted') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'self-hosted';
--> statement-breakpoint
-- responsive → Responsive Design
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'responsive' JOIN "tags" kept ON kept."slug" = 'responsive-design' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'responsive' AND kept."slug" = 'responsive-design' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'responsive', kept."id" FROM "tags" kept WHERE kept."slug" = 'responsive-design' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'responsive') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'responsive';
--> statement-breakpoint
-- horror stories → Horror
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'horror-stories' JOIN "tags" kept ON kept."slug" = 'horror' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'horror-stories' AND kept."slug" = 'horror' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'horror-stories', kept."id" FROM "tags" kept WHERE kept."slug" = 'horror' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'horror-stories') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'horror-stories';
--> statement-breakpoint
-- light/dark → Dark Mode
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'lightdark' JOIN "tags" kept ON kept."slug" = 'dark-mode' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'lightdark' AND kept."slug" = 'dark-mode' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'lightdark', kept."id" FROM "tags" kept WHERE kept."slug" = 'dark-mode' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'lightdark') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'lightdark';
--> statement-breakpoint
-- Tips & Tricks → Tips
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'tips-tricks' JOIN "tags" kept ON kept."slug" = 'tips' ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "tag_redirects" SET "tag_id" = kept."id" FROM "tags" merged, "tags" kept WHERE merged."slug" = 'tips-tricks' AND kept."slug" = 'tips' AND "tag_redirects"."tag_id" = merged."id";
--> statement-breakpoint
INSERT INTO "tag_redirects" ("old_slug", "tag_id") SELECT 'tips-tricks', kept."id" FROM "tags" kept WHERE kept."slug" = 'tips' AND EXISTS (SELECT 1 FROM "tags" WHERE "slug" = 'tips-tricks') ON CONFLICT ("old_slug") DO NOTHING;
--> statement-breakpoint
DELETE FROM "tags" WHERE "slug" = 'tips-tricks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'JavaScript' WHERE "slug" = 'javascript';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'React' WHERE "slug" = 'react';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'TypeScript' WHERE "slug" = 'typescript';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Productivity' WHERE "slug" = 'productivity';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Performance' WHERE "slug" = 'performance';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Frontend' WHERE "slug" = 'frontend';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Node.js' WHERE "slug" = 'nodejs';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Accessibility' WHERE "slug" = 'accessibility';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Programming' WHERE "slug" = 'programming';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Serverless' WHERE "slug" = 'serverless';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'HTML' WHERE "slug" = 'html';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'GraphQL' WHERE "slug" = 'graphql';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Security' WHERE "slug" = 'security';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'APIs' WHERE "slug" = 'apis';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Debugging' WHERE "slug" = 'debugging';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Design' WHERE "slug" = 'design';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cloudflare' WHERE "slug" = 'cloudflare';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Next.js' WHERE "slug" = 'nextjs';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Databases' WHERE "slug" = 'databases';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Automation' WHERE "slug" = 'automation';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Deno' WHERE "slug" = 'deno';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Testing' WHERE "slug" = 'testing';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tips' WHERE "slug" = 'tips';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Coding' WHERE "slug" = 'coding';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'GitHub' WHERE "slug" = 'github';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Mobile' WHERE "slug" = 'mobile';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Video' WHERE "slug" = 'video';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'AWS' WHERE "slug" = 'aws';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Caching' WHERE "slug" = 'caching';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tools' WHERE "slug" = 'tools';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Astro' WHERE "slug" = 'astro';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Git' WHERE "slug" = 'git';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Local-First' WHERE "slug" = 'local-first';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Privacy' WHERE "slug" = 'privacy';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'E-commerce' WHERE "slug" = 'ecommerce';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Horror' WHERE "slug" = 'horror';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Offline' WHERE "slug" = 'offline';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Prisma' WHERE "slug" = 'prisma';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Components' WHERE "slug" = 'components';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Edge Computing' WHERE "slug" = 'edge-computing';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Gatsby' WHERE "slug" = 'gatsby';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Office' WHERE "slug" = 'office';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Optimization' WHERE "slug" = 'optimization';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vue' WHERE "slug" = 'vue';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Components' WHERE "slug" = 'web-components';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Bundlers' WHERE "slug" = 'bundlers';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Career Change' WHERE "slug" = 'career-change';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cloud' WHERE "slug" = 'cloud';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Container Queries' WHERE "slug" = 'container-queries';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Content Creation' WHERE "slug" = 'content-creation';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Education' WHERE "slug" = 'education';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Extensions' WHERE "slug" = 'extensions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hardware' WHERE "slug" = 'hardware';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Headless' WHERE "slug" = 'headless';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'History' WHERE "slug" = 'history';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Home Automation' WHERE "slug" = 'home-automation';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hosting' WHERE "slug" = 'hosting';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Images' WHERE "slug" = 'images';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'jQuery' WHERE "slug" = 'jquery';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Learning' WHERE "slug" = 'learning';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Mistakes' WHERE "slug" = 'mistakes';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Monorepos' WHERE "slug" = 'monorepo';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Organization' WHERE "slug" = 'organization';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Project Management' WHERE "slug" = 'project-management';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Promises' WHERE "slug" = 'promises';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Reactivity' WHERE "slug" = 'reactivity';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Remix' WHERE "slug" = 'remix';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SEO' WHERE "slug" = 'seo';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Skills' WHERE "slug" = 'skills';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'State Management' WHERE "slug" = 'state-management';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'VS Code' WHERE "slug" = 'vscode';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Webpack' WHERE "slug" = 'webpack';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Performance' WHERE "slug" = 'web-performance';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Workflow' WHERE "slug" = 'workflow';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'ADHD' WHERE "slug" = 'adhd';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Analytics' WHERE "slug" = 'analytics';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Animations' WHERE "slug" = 'animations';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Audio' WHERE "slug" = 'audio';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Auth' WHERE "slug" = 'auth';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Browsers' WHERE "slug" = 'browsers';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Code Quality' WHERE "slug" = 'code-quality';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Conferences' WHERE "slug" = 'conferences';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cypress' WHERE "slug" = 'cypress';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Data' WHERE "slug" = 'data';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Design Systems' WHERE "slug" = 'design-systems';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Drag and Drop' WHERE "slug" = 'drag-and-drop';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Electric Vehicles' WHERE "slug" = 'electric-vehicles';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Electron' WHERE "slug" = 'electron';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Errors' WHERE "slug" = 'errors';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'ESM' WHERE "slug" = 'esm';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Express' WHERE "slug" = 'express';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Fetch' WHERE "slug" = 'fetch';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Firebase' WHERE "slug" = 'firebase';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Functions' WHERE "slug" = 'functions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Gear' WHERE "slug" = 'gear';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Gift Guide' WHERE "slug" = 'gift-guide';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Goals' WHERE "slug" = 'goals';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hack Week' WHERE "slug" = 'hackweek';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Health' WHERE "slug" = 'health';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Interoperability' WHERE "slug" = 'interoperability';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Lambda' WHERE "slug" = 'lambda';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Laravel' WHERE "slug" = 'laravel';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Layout' WHERE "slug" = 'layout';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Legal' WHERE "slug" = 'legal';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Linting' WHERE "slug" = 'linting';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Live Streaming' WHERE "slug" = 'live-streaming';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Logging' WHERE "slug" = 'logging';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Mental Health' WHERE "slug" = 'mental-health';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Music' WHERE "slug" = 'music';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Networking' WHERE "slug" = 'networking';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Nuxt' WHERE "slug" = 'nuxt';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'ORM' WHERE "slug" = 'orm';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'PHP' WHERE "slug" = 'php';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'PlanetScale' WHERE "slug" = 'planetscale';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Potluck' WHERE "slug" = 'potluck';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Pricing' WHERE "slug" = 'pricing';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Production' WHERE "slug" = 'production';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Public Speaking' WHERE "slug" = 'public-speaking';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Servers' WHERE "slug" = 'servers';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Server-Side' WHERE "slug" = 'server-side';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Services' WHERE "slug" = 'services';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Spam' WHERE "slug" = 'spam';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Speed' WHERE "slug" = 'speed';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SQLite' WHERE "slug" = 'sqlite';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Styling' WHERE "slug" = 'styling';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Sustainability' WHERE "slug" = 'sustainability';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SvelteKit' WHERE "slug" = 'sveltekit';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Technology' WHERE "slug" = 'technology';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Theming' WHERE "slug" = 'theming';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Time Management' WHERE "slug" = 'time-management';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tori' WHERE "slug" = 'tori';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Troubleshooting' WHERE "slug" = 'troubleshooting';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tutorial' WHERE "slug" = 'tutorial';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Typography' WHERE "slug" = 'typography';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Version Control' WHERE "slug" = 'version-control';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vim' WHERE "slug" = 'vim';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'WebRTC' WHERE "slug" = 'webrtc';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'WebSockets' WHERE "slug" = 'websockets';
--> statement-breakpoint
UPDATE "tags" SET "name" = '1Password' WHERE "slug" = '1password';
--> statement-breakpoint
UPDATE "tags" SET "name" = '2FA' WHERE "slug" = '2fa';
--> statement-breakpoint
UPDATE "tags" SET "name" = '3D Printing' WHERE "slug" = '3dprinting';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Abstraction' WHERE "slug" = 'abstraction';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Accidents' WHERE "slug" = 'accidents';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'API Calls' WHERE "slug" = 'apicalls';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Appright' WHERE "slug" = 'appright';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Apps' WHERE "slug" = 'apps';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'App Versioning' WHERE "slug" = 'app-versioning';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Architect' WHERE "slug" = 'architect';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Architecture' WHERE "slug" = 'architecture';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Assistant' WHERE "slug" = 'assistant';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Async' WHERE "slug" = 'async';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Asynchronous' WHERE "slug" = 'asynchronous';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Audio AI' WHERE "slug" = 'audio-ai';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Await' WHERE "slug" = 'await';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Axios' WHERE "slug" = 'axios';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Backblaze' WHERE "slug" = 'backblaze';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Backyard' WHERE "slug" = 'backyard';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Bandwidth' WHERE "slug" = 'bandwidth';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Begin' WHERE "slug" = 'begin';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Blockchain' WHERE "slug" = 'blockchain';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Bluesky' WHERE "slug" = 'bluesky';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Bookmarks' WHERE "slug" = 'bookmarks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Burnout' WHERE "slug" = 'burnout';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'CDN' WHERE "slug" = 'cdn';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Charging' WHERE "slug" = 'charging';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Chromium' WHERE "slug" = 'chromium';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Closures' WHERE "slug" = 'closures';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Clothing' WHERE "slug" = 'clothing';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cloudinary' WHERE "slug" = 'cloudinary';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cloud Storage' WHERE "slug" = 'cloud-storage';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Code Generation' WHERE "slug" = 'code-generation';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Coding Conventions' WHERE "slug" = 'coding-conventions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Coding Mistakes' WHERE "slug" = 'codingmistakes';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Coding Workspace' WHERE "slug" = 'codingworkspace';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Colors' WHERE "slug" = 'colors';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Compatibility' WHERE "slug" = 'compatibility';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Concurrency' WHERE "slug" = 'concurrency';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Config Files' WHERE "slug" = 'configfiles';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Connections' WHERE "slug" = 'connections';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Connectivity' WHERE "slug" = 'connectivity';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Consistency' WHERE "slug" = 'consistency';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Content Strategy' WHERE "slug" = 'content-strategy';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Conventional Commits' WHERE "slug" = 'conventionalcommits';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Conversion' WHERE "slug" = 'conversion';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'GitHub Copilot' WHERE "slug" = 'copilot';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Cottage Life' WHERE "slug" = 'cottagelife';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Country Codes' WHERE "slug" = 'country-codes';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'COVID-19' WHERE "slug" = 'covid19';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'CSRF' WHERE "slug" = 'csrf';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Curriculum' WHERE "slug" = 'curriculum';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Customization' WHERE "slug" = 'customization';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Dark Mode' WHERE "slug" = 'dark-mode';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Data Collection' WHERE "slug" = 'data-collection';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Data Fetching' WHERE "slug" = 'data-fetching';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Date' WHERE "slug" = 'date';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Decorators' WHERE "slug" = 'decorators';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Deliverability' WHERE "slug" = 'deliverability';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Dependencies' WHERE "slug" = 'dependencies';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Desk Setup' WHERE "slug" = 'desksetup';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Desktop Development' WHERE "slug" = 'desktopdev';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Developer Experience' WHERE "slug" = 'developer-experience';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Developer Gear' WHERE "slug" = 'developergear';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Developer Hiring' WHERE "slug" = 'developer-hiring';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Developer Relations' WHERE "slug" = 'developer-relations';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Dev Fails' WHERE "slug" = 'devfails';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Digital Nomad' WHERE "slug" = 'digital-nomad';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Discussion' WHERE "slug" = 'discussion';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'DNS' WHERE "slug" = 'dns';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Domain Registrars' WHERE "slug" = 'domain-registrars';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Edge Functions' WHERE "slug" = 'edge-functions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Efficiency' WHERE "slug" = 'efficiency';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Electronics' WHERE "slug" = 'electronics';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Emergency Preparedness' WHERE "slug" = 'emergency-preparedness';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Encoding' WHERE "slug" = 'encoding';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Enums' WHERE "slug" = 'enums';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Environment' WHERE "slug" = 'environment';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Environment Variables' WHERE "slug" = 'envvars';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Error Handling' WHERE "slug" = 'error-handling';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Ethics' WHERE "slug" = 'ethics';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Events' WHERE "slug" = 'events';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'EV Ownership' WHERE "slug" = 'ev-ownership';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Executables' WHERE "slug" = 'executables';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Exercise' WHERE "slug" = 'exercise';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Facebook' WHERE "slug" = 'facebook';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Failures' WHERE "slug" = 'failures';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Family' WHERE "slug" = 'family';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Favicons' WHERE "slug" = 'favicons';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Filament' WHERE "slug" = 'filament';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Firebug' WHERE "slug" = 'firebug';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'First Jobs' WHERE "slug" = 'first-jobs';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Font Loading' WHERE "slug" = 'fontloading';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Framer' WHERE "slug" = 'framer';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Fulfillment' WHERE "slug" = 'fulfillment';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Full Stack' WHERE "slug" = 'full-stack';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Fusion' WHERE "slug" = 'fusion';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Gardening' WHERE "slug" = 'gardening';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Global' WHERE "slug" = 'global';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Grid' WHERE "slug" = 'grid';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Halloween' WHERE "slug" = 'halloween';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hardware Hacks' WHERE "slug" = 'hardware-hacks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Headings' WHERE "slug" = 'headings';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hono' WHERE "slug" = 'honojs';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Hooks' WHERE "slug" = 'hooks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'IE11' WHERE "slug" = 'ie11';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Iframes' WHERE "slug" = 'iframes';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Immutability' WHERE "slug" = 'immutability';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Income Share' WHERE "slug" = 'incomeshare';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Inspiration' WHERE "slug" = 'inspiration';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Interviews' WHERE "slug" = 'interview';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Interview Tips' WHERE "slug" = 'interview-tips';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Job Search' WHERE "slug" = 'job-search';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'JSON' WHERE "slug" = 'json';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Libraries' WHERE "slug" = 'libraries';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Licensing' WHERE "slug" = 'licensing';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'LinkeDOM' WHERE "slug" = 'linkeddom';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Link Tag' WHERE "slug" = 'link-tag';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Linux' WHERE "slug" = 'linux';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Lit' WHERE "slug" = 'lit';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Live Podcast' WHERE "slug" = 'live-podcast';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Local Storage' WHERE "slug" = 'local-storage';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Login' WHERE "slug" = 'login';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'LTE Internet' WHERE "slug" = 'lte-internet';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Lua' WHERE "slug" = 'lua';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'MacBook' WHERE "slug" = 'macbook';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Margins' WHERE "slug" = 'margins';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Markdown' WHERE "slug" = 'markdown';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'MCP' WHERE "slug" = 'mcp';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'MDX' WHERE "slug" = 'mdx';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Media' WHERE "slug" = 'media';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Meteor' WHERE "slug" = 'meteor';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Micro Frontends' WHERE "slug" = 'microfrontends';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Middleware' WHERE "slug" = 'middleware';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Milestone' WHERE "slug" = 'milestone';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Modeling' WHERE "slug" = 'modeling';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Module Federation' WHERE "slug" = 'module-federation';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Monkey Patch' WHERE "slug" = 'monkey-patch';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Motion' WHERE "slug" = 'motion';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Mozilla' WHERE "slug" = 'mozilla';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Native' WHERE "slug" = 'native';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Neovim' WHERE "slug" = 'neovim';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Nostalgia' WHERE "slug" = 'nostalgia';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'OAuth' WHERE "slug" = 'oauth';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Offline Data' WHERE "slug" = 'offline-data';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'OG Images' WHERE "slug" = 'ogimage';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Online Business' WHERE "slug" = 'online-business';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Packaging' WHERE "slug" = 'packaging';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'PageSpeed' WHERE "slug" = 'pagespeed';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Parcel' WHERE "slug" = 'parcel';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Parenting' WHERE "slug" = 'parenting';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Passkeys' WHERE "slug" = 'passkeys';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Payload' WHERE "slug" = 'payload';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Perfmatters' WHERE "slug" = 'perfmatters';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Planning' WHERE "slug" = 'planning';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Polyfills' WHERE "slug" = 'polyfills';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Pop!_OS' WHERE "slug" = 'pop-os';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'PostCSS' WHERE "slug" = 'postcss';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Postgres' WHERE "slug" = 'postgres';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Prefetching' WHERE "slug" = 'prefetching';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Presents' WHERE "slug" = 'presents';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Print CSS' WHERE "slug" = 'print-css';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Progressive Enhancement' WHERE "slug" = 'progressive-enhancement';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Proposals' WHERE "slug" = 'proposals';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Protocols' WHERE "slug" = 'protocols';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'PWA' WHERE "slug" = 'pwa';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Raycast' WHERE "slug" = 'raycast';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'React Native' WHERE "slug" = 'react-native';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Rebase' WHERE "slug" = 'rebase';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Records' WHERE "slug" = 'records';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Refresh Strategies' WHERE "slug" = 'refresh-strategies';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Render' WHERE "slug" = 'render';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Rendering' WHERE "slug" = 'rendering';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Responsive Design' WHERE "slug" = 'responsive-design';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Reverse Proxy' WHERE "slug" = 'reverse-proxy';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Rollup' WHERE "slug" = 'rollup';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Rural Internet' WHERE "slug" = 'rural-internet';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Safari' WHERE "slug" = 'safari';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Sanity' WHERE "slug" = 'sanity';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Scaling' WHERE "slug" = 'scaling';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Scope' WHERE "slug" = 'scope';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Scrolling' WHERE "slug" = 'scrolling';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Self-Care' WHERE "slug" = 'selfcare';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Self-Improvement' WHERE "slug" = 'self-improvement';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Server Components' WHERE "slug" = 'server-components';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Service Workers' WHERE "slug" = 'service-workers';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Shipping Logistics' WHERE "slug" = 'shippinglogistics';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Shopify' WHERE "slug" = 'shopify';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Shortcuts' WHERE "slug" = 'shortcuts';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Side Hustles' WHERE "slug" = 'side-hustles';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Side Projects' WHERE "slug" = 'side-projects';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Smart Home' WHERE "slug" = 'smart-home';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Snowpack' WHERE "slug" = 'snowpack';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Social Media' WHERE "slug" = 'socialmedia';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Soft Skills' WHERE "slug" = 'soft-skills';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Software Gone Wrong' WHERE "slug" = 'softwaregonewrong';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SolidJS' WHERE "slug" = 'solidjs';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Speaking' WHERE "slug" = 'speaking';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Sports' WHERE "slug" = 'sports';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Sprite Maps' WHERE "slug" = 'sprite-maps';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SQL' WHERE "slug" = 'sql';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SSL' WHERE "slug" = 'ssl';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'SSR' WHERE "slug" = 'ssr';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Stale-While-Revalidate' WHERE "slug" = 'stale-while-revalidate';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Starlink' WHERE "slug" = 'starlink';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Startups' WHERE "slug" = 'startups';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Stickers' WHERE "slug" = 'stickers';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Stretches' WHERE "slug" = 'stretches';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Supabase' WHERE "slug" = 'supabase';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'System76' WHERE "slug" = 'system76';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Systems' WHERE "slug" = 'systems';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tailwind' WHERE "slug" = 'tailwind';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Team Dynamics' WHERE "slug" = 'team-dynamics';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tech' WHERE "slug" = 'tech';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Technical Debt' WHERE "slug" = 'technical-debt';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Technology Predictions' WHERE "slug" = 'technology-predictions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Time' WHERE "slug" = 'time';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tamagui' WHERE "slug" = 'tomagui';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Transitions' WHERE "slug" = 'transitions';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Transpile' WHERE "slug" = 'transpile';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Travel' WHERE "slug" = 'travel';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Tuples' WHERE "slug" = 'tuples';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Turbolinks' WHERE "slug" = 'turbolinks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Twitch' WHERE "slug" = 'twitch';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Types' WHERE "slug" = 'types';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'UI Development' WHERE "slug" = 'ui-development';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'UI Frameworks' WHERE "slug" = 'ui-frameworks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Ukraine' WHERE "slug" = 'ukraine';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Utilities' WHERE "slug" = 'utilities';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Utility' WHERE "slug" = 'utility';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vaccine' WHERE "slug" = 'vaccine';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vercel' WHERE "slug" = 'vercel';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Versioning' WHERE "slug" = 'versioning';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vibe Coding' WHERE "slug" = 'vibecoding';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Video Production' WHERE "slug" = 'video-production';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Video Streaming' WHERE "slug" = 'videostreaming';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Viewport' WHERE "slug" = 'viewport';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Visibility' WHERE "slug" = 'visibility';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vitest' WHERE "slug" = 'vitest';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Vitkit' WHERE "slug" = 'vitkit';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Almanac' WHERE "slug" = 'webalmanac';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web APIs' WHERE "slug" = 'web-api';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web App Updates' WHERE "slug" = 'web-app-updates';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Audio' WHERE "slug" = 'web-audio';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Fonts' WHERE "slug" = 'webfonts';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Webhooks' WHERE "slug" = 'webhooks';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Infrastructure' WHERE "slug" = 'web-infrastructure';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'WebKit' WHERE "slug" = 'webkit';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web MIDI' WHERE "slug" = 'web-midi';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Website' WHERE "slug" = 'website';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Website Design' WHERE "slug" = 'website-design';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Web Streams' WHERE "slug" = 'web-streams';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Wellness' WHERE "slug" = 'wellness';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Window Management' WHERE "slug" = 'window-management';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Windows' WHERE "slug" = 'windows';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Working from Home' WHERE "slug" = 'working-from-home';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'Work-Life Balance' WHERE "slug" = 'work-life-balance';
--> statement-breakpoint
UPDATE "tags" SET "name" = 'YouTube' WHERE "slug" = 'youtube';
