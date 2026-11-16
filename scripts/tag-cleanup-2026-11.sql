-- One-time tag cleanup (2026-11-16): merges 58 duplicate topic tags into 52 and gives 396
-- all-lowercase tags proper names (javascript -> JavaScript). Data only, so it isn't a migration.
--
-- Run once against production after a backup:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/tag-cleanup-2026-11.sql
-- Every statement is keyed by slug, so a tag that isn't there is skipped and a second run changes
-- nothing. Local copies get the result on the next db pull. Delete this file once it has run.

BEGIN;

-- webdev → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webdev' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'webdev';
-- web-dev → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'web-dev' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'web-dev';
-- WebDevelopment → Web Development
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webdevelopment' JOIN "tags" kept ON kept."slug" = 'web-development' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'webdevelopment';
-- front-end → Frontend
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'front-end' JOIN "tags" kept ON kept."slug" = 'frontend' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'front-end';
-- front end development → Frontend
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'front-end-development' JOIN "tags" kept ON kept."slug" = 'frontend' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'front-end-development';
-- OpenSource → Open Source
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'opensource' JOIN "tags" kept ON kept."slug" = 'open-source' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'opensource';
-- oss → Open Source
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'oss' JOIN "tags" kept ON kept."slug" = 'open-source' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'oss';
-- node → Node.js
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'node' JOIN "tags" kept ON kept."slug" = 'nodejs' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'node';
-- reactjs → React
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'reactjs' JOIN "tags" kept ON kept."slug" = 'react' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'reactjs';
-- vuejs → Vue
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'vuejs' JOIN "tags" kept ON kept."slug" = 'vue' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'vuejs';
-- Artificial Intelligence → AI
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'artificial-intelligence' JOIN "tags" kept ON kept."slug" = 'ai' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'artificial-intelligence';
-- api → APIs
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'api' JOIN "tags" kept ON kept."slug" = 'apis' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'api';
-- a11y → Accessibility
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'a11y' JOIN "tags" kept ON kept."slug" = 'accessibility' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'a11y';
-- DeveloperTools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'developertools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'developertools';
-- Dev Tools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'dev-tools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'dev-tools';
-- DevTools → Developer Tools
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'devtools' JOIN "tags" kept ON kept."slug" = 'developer-tools' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'devtools';
-- careers → Career
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'careers' JOIN "tags" kept ON kept."slug" = 'career' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'careers';
-- podcast → Podcasts
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'podcast' JOIN "tags" kept ON kept."slug" = 'podcasts' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'podcast';
-- webcomponents → Web Components
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webcomponents' JOIN "tags" kept ON kept."slug" = 'web-components' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'webcomponents';
-- webperf → Web Performance
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webperf' JOIN "tags" kept ON kept."slug" = 'web-performance' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'webperf';
-- wasm → WebAssembly
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'wasm' JOIN "tags" kept ON kept."slug" = 'webassembly' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'wasm';
-- vs code → VS Code
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'vs-code' JOIN "tags" kept ON kept."slug" = 'vscode' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'vs-code';
-- timemanagement → Time Management
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'timemanagement' JOIN "tags" kept ON kept."slug" = 'time-management' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'timemanagement';
-- StateOfJS → State of JS
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'stateofjs' JOIN "tags" kept ON kept."slug" = 'state-of-js' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'stateofjs';
-- impostersyndrome → Imposter Syndrome
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'impostersyndrome' JOIN "tags" kept ON kept."slug" = 'imposter-syndrome' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'impostersyndrome';
-- ruralinternet → Rural Internet
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'ruralinternet' JOIN "tags" kept ON kept."slug" = 'rural-internet' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'ruralinternet';
-- fullstack → Full Stack
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'fullstack' JOIN "tags" kept ON kept."slug" = 'full-stack' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'fullstack';
-- livecoding → Live Coding
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'livecoding' JOIN "tags" kept ON kept."slug" = 'live-coding' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'livecoding';
-- NoCode → No Code
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'nocode' JOIN "tags" kept ON kept."slug" = 'no-code' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'nocode';
-- codegeneration → Code Generation
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'codegeneration' JOIN "tags" kept ON kept."slug" = 'code-generation' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'codegeneration';
-- servercomponents → Server Components
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'servercomponents' JOIN "tags" kept ON kept."slug" = 'server-components' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'servercomponents';
-- smarthome → Smart Home
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'smarthome' JOIN "tags" kept ON kept."slug" = 'smart-home' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'smarthome';
-- webapi → Web APIs
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'webapi' JOIN "tags" kept ON kept."slug" = 'web-api' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'webapi';
-- framework → Frameworks
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'framework' JOIN "tags" kept ON kept."slug" = 'frameworks' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'framework';
-- beginner → Beginners
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'beginner' JOIN "tags" kept ON kept."slug" = 'beginners' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'beginner';
-- bootcamp → Bootcamps
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'bootcamp' JOIN "tags" kept ON kept."slug" = 'bootcamps' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'bootcamp';
-- Conference → Conferences
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'conference' JOIN "tags" kept ON kept."slug" = 'conferences' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'conference';
-- Database → Databases
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'database' JOIN "tags" kept ON kept."slug" = 'databases' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'database';
-- Client → Clients
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'client' JOIN "tags" kept ON kept."slug" = 'clients' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'client';
-- Portfolio → Portfolios
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'portfolio' JOIN "tags" kept ON kept."slug" = 'portfolios' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'portfolio';
-- Monorepos → Monorepos
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'monorepos' JOIN "tags" kept ON kept."slug" = 'monorepo' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'monorepos';
-- GatsbyJS → Gatsby
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'gatsbyjs' JOIN "tags" kept ON kept."slug" = 'gatsby' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'gatsbyjs';
-- GitHubCopilot → GitHub Copilot
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'githubcopilot' JOIN "tags" kept ON kept."slug" = 'copilot' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'githubcopilot';
-- holiday → Holidays
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'holiday' JOIN "tags" kept ON kept."slug" = 'holidays' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'holiday';
-- Licenses → Licensing
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'licenses' JOIN "tags" kept ON kept."slug" = 'licensing' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'licenses';
-- Server → Servers
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'server' JOIN "tags" kept ON kept."slug" = 'servers' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'server';
-- game → Games
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'game' JOIN "tags" kept ON kept."slug" = 'games' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'game';
-- compiler → Compilers
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'compiler' JOIN "tags" kept ON kept."slug" = 'compilers' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'compiler';
-- terminal → Terminals
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'terminal' JOIN "tags" kept ON kept."slug" = 'terminals' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'terminal';
-- polyfill → Polyfills
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'polyfill' JOIN "tags" kept ON kept."slug" = 'polyfills' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'polyfill';
-- workflows → Workflow
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'workflows' JOIN "tags" kept ON kept."slug" = 'workflow' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'workflows';
-- devrel → Developer Relations
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'devrel' JOIN "tags" kept ON kept."slug" = 'developer-relations' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'devrel';
-- Interviews → Interviews
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'interviews' JOIN "tags" kept ON kept."slug" = 'interview' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'interviews';
-- self-hosted → Self-Hosting
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'self-hosted' JOIN "tags" kept ON kept."slug" = 'self-hosting' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'self-hosted';
-- responsive → Responsive Design
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'responsive' JOIN "tags" kept ON kept."slug" = 'responsive-design' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'responsive';
-- horror stories → Horror
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'horror-stories' JOIN "tags" kept ON kept."slug" = 'horror' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'horror-stories';
-- light/dark → Dark Mode
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'lightdark' JOIN "tags" kept ON kept."slug" = 'dark-mode' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'lightdark';
-- Tips & Tricks → Tips
INSERT INTO "content_tags" ("content_id", "tag_id") SELECT ct."content_id", kept."id" FROM "content_tags" ct JOIN "tags" merged ON merged."id" = ct."tag_id" AND merged."slug" = 'tips-tricks' JOIN "tags" kept ON kept."slug" = 'tips' ON CONFLICT DO NOTHING;
DELETE FROM "tags" WHERE "slug" = 'tips-tricks';
UPDATE "tags" SET "name" = 'JavaScript' WHERE "slug" = 'javascript';
UPDATE "tags" SET "name" = 'React' WHERE "slug" = 'react';
UPDATE "tags" SET "name" = 'TypeScript' WHERE "slug" = 'typescript';
UPDATE "tags" SET "name" = 'Productivity' WHERE "slug" = 'productivity';
UPDATE "tags" SET "name" = 'Performance' WHERE "slug" = 'performance';
UPDATE "tags" SET "name" = 'Frontend' WHERE "slug" = 'frontend';
UPDATE "tags" SET "name" = 'Node.js' WHERE "slug" = 'nodejs';
UPDATE "tags" SET "name" = 'Accessibility' WHERE "slug" = 'accessibility';
UPDATE "tags" SET "name" = 'Programming' WHERE "slug" = 'programming';
UPDATE "tags" SET "name" = 'Serverless' WHERE "slug" = 'serverless';
UPDATE "tags" SET "name" = 'HTML' WHERE "slug" = 'html';
UPDATE "tags" SET "name" = 'GraphQL' WHERE "slug" = 'graphql';
UPDATE "tags" SET "name" = 'Security' WHERE "slug" = 'security';
UPDATE "tags" SET "name" = 'APIs' WHERE "slug" = 'apis';
UPDATE "tags" SET "name" = 'Debugging' WHERE "slug" = 'debugging';
UPDATE "tags" SET "name" = 'Design' WHERE "slug" = 'design';
UPDATE "tags" SET "name" = 'Cloudflare' WHERE "slug" = 'cloudflare';
UPDATE "tags" SET "name" = 'Next.js' WHERE "slug" = 'nextjs';
UPDATE "tags" SET "name" = 'Databases' WHERE "slug" = 'databases';
UPDATE "tags" SET "name" = 'Automation' WHERE "slug" = 'automation';
UPDATE "tags" SET "name" = 'Deno' WHERE "slug" = 'deno';
UPDATE "tags" SET "name" = 'Testing' WHERE "slug" = 'testing';
UPDATE "tags" SET "name" = 'Tips' WHERE "slug" = 'tips';
UPDATE "tags" SET "name" = 'Coding' WHERE "slug" = 'coding';
UPDATE "tags" SET "name" = 'GitHub' WHERE "slug" = 'github';
UPDATE "tags" SET "name" = 'Mobile' WHERE "slug" = 'mobile';
UPDATE "tags" SET "name" = 'Video' WHERE "slug" = 'video';
UPDATE "tags" SET "name" = 'AWS' WHERE "slug" = 'aws';
UPDATE "tags" SET "name" = 'Caching' WHERE "slug" = 'caching';
UPDATE "tags" SET "name" = 'Tools' WHERE "slug" = 'tools';
UPDATE "tags" SET "name" = 'Astro' WHERE "slug" = 'astro';
UPDATE "tags" SET "name" = 'Git' WHERE "slug" = 'git';
UPDATE "tags" SET "name" = 'Local-First' WHERE "slug" = 'local-first';
UPDATE "tags" SET "name" = 'Privacy' WHERE "slug" = 'privacy';
UPDATE "tags" SET "name" = 'E-commerce' WHERE "slug" = 'ecommerce';
UPDATE "tags" SET "name" = 'Horror' WHERE "slug" = 'horror';
UPDATE "tags" SET "name" = 'Offline' WHERE "slug" = 'offline';
UPDATE "tags" SET "name" = 'Prisma' WHERE "slug" = 'prisma';
UPDATE "tags" SET "name" = 'Components' WHERE "slug" = 'components';
UPDATE "tags" SET "name" = 'Edge Computing' WHERE "slug" = 'edge-computing';
UPDATE "tags" SET "name" = 'Gatsby' WHERE "slug" = 'gatsby';
UPDATE "tags" SET "name" = 'Office' WHERE "slug" = 'office';
UPDATE "tags" SET "name" = 'Optimization' WHERE "slug" = 'optimization';
UPDATE "tags" SET "name" = 'Vue' WHERE "slug" = 'vue';
UPDATE "tags" SET "name" = 'Web Components' WHERE "slug" = 'web-components';
UPDATE "tags" SET "name" = 'Bundlers' WHERE "slug" = 'bundlers';
UPDATE "tags" SET "name" = 'Career Change' WHERE "slug" = 'career-change';
UPDATE "tags" SET "name" = 'Cloud' WHERE "slug" = 'cloud';
UPDATE "tags" SET "name" = 'Container Queries' WHERE "slug" = 'container-queries';
UPDATE "tags" SET "name" = 'Content Creation' WHERE "slug" = 'content-creation';
UPDATE "tags" SET "name" = 'Education' WHERE "slug" = 'education';
UPDATE "tags" SET "name" = 'Extensions' WHERE "slug" = 'extensions';
UPDATE "tags" SET "name" = 'Hardware' WHERE "slug" = 'hardware';
UPDATE "tags" SET "name" = 'Headless' WHERE "slug" = 'headless';
UPDATE "tags" SET "name" = 'History' WHERE "slug" = 'history';
UPDATE "tags" SET "name" = 'Home Automation' WHERE "slug" = 'home-automation';
UPDATE "tags" SET "name" = 'Hosting' WHERE "slug" = 'hosting';
UPDATE "tags" SET "name" = 'Images' WHERE "slug" = 'images';
UPDATE "tags" SET "name" = 'jQuery' WHERE "slug" = 'jquery';
UPDATE "tags" SET "name" = 'Learning' WHERE "slug" = 'learning';
UPDATE "tags" SET "name" = 'Mistakes' WHERE "slug" = 'mistakes';
UPDATE "tags" SET "name" = 'Monorepos' WHERE "slug" = 'monorepo';
UPDATE "tags" SET "name" = 'Organization' WHERE "slug" = 'organization';
UPDATE "tags" SET "name" = 'Project Management' WHERE "slug" = 'project-management';
UPDATE "tags" SET "name" = 'Promises' WHERE "slug" = 'promises';
UPDATE "tags" SET "name" = 'Reactivity' WHERE "slug" = 'reactivity';
UPDATE "tags" SET "name" = 'Remix' WHERE "slug" = 'remix';
UPDATE "tags" SET "name" = 'SEO' WHERE "slug" = 'seo';
UPDATE "tags" SET "name" = 'Skills' WHERE "slug" = 'skills';
UPDATE "tags" SET "name" = 'State Management' WHERE "slug" = 'state-management';
UPDATE "tags" SET "name" = 'VS Code' WHERE "slug" = 'vscode';
UPDATE "tags" SET "name" = 'Webpack' WHERE "slug" = 'webpack';
UPDATE "tags" SET "name" = 'Web Performance' WHERE "slug" = 'web-performance';
UPDATE "tags" SET "name" = 'Workflow' WHERE "slug" = 'workflow';
UPDATE "tags" SET "name" = 'ADHD' WHERE "slug" = 'adhd';
UPDATE "tags" SET "name" = 'Analytics' WHERE "slug" = 'analytics';
UPDATE "tags" SET "name" = 'Animations' WHERE "slug" = 'animations';
UPDATE "tags" SET "name" = 'Audio' WHERE "slug" = 'audio';
UPDATE "tags" SET "name" = 'Auth' WHERE "slug" = 'auth';
UPDATE "tags" SET "name" = 'Browsers' WHERE "slug" = 'browsers';
UPDATE "tags" SET "name" = 'Code Quality' WHERE "slug" = 'code-quality';
UPDATE "tags" SET "name" = 'Conferences' WHERE "slug" = 'conferences';
UPDATE "tags" SET "name" = 'Cypress' WHERE "slug" = 'cypress';
UPDATE "tags" SET "name" = 'Data' WHERE "slug" = 'data';
UPDATE "tags" SET "name" = 'Design Systems' WHERE "slug" = 'design-systems';
UPDATE "tags" SET "name" = 'Drag and Drop' WHERE "slug" = 'drag-and-drop';
UPDATE "tags" SET "name" = 'Electric Vehicles' WHERE "slug" = 'electric-vehicles';
UPDATE "tags" SET "name" = 'Electron' WHERE "slug" = 'electron';
UPDATE "tags" SET "name" = 'Errors' WHERE "slug" = 'errors';
UPDATE "tags" SET "name" = 'ESM' WHERE "slug" = 'esm';
UPDATE "tags" SET "name" = 'Express' WHERE "slug" = 'express';
UPDATE "tags" SET "name" = 'Fetch' WHERE "slug" = 'fetch';
UPDATE "tags" SET "name" = 'Firebase' WHERE "slug" = 'firebase';
UPDATE "tags" SET "name" = 'Functions' WHERE "slug" = 'functions';
UPDATE "tags" SET "name" = 'Gear' WHERE "slug" = 'gear';
UPDATE "tags" SET "name" = 'Gift Guide' WHERE "slug" = 'gift-guide';
UPDATE "tags" SET "name" = 'Goals' WHERE "slug" = 'goals';
UPDATE "tags" SET "name" = 'Hack Week' WHERE "slug" = 'hackweek';
UPDATE "tags" SET "name" = 'Health' WHERE "slug" = 'health';
UPDATE "tags" SET "name" = 'Interoperability' WHERE "slug" = 'interoperability';
UPDATE "tags" SET "name" = 'Lambda' WHERE "slug" = 'lambda';
UPDATE "tags" SET "name" = 'Laravel' WHERE "slug" = 'laravel';
UPDATE "tags" SET "name" = 'Layout' WHERE "slug" = 'layout';
UPDATE "tags" SET "name" = 'Legal' WHERE "slug" = 'legal';
UPDATE "tags" SET "name" = 'Linting' WHERE "slug" = 'linting';
UPDATE "tags" SET "name" = 'Live Streaming' WHERE "slug" = 'live-streaming';
UPDATE "tags" SET "name" = 'Logging' WHERE "slug" = 'logging';
UPDATE "tags" SET "name" = 'Mental Health' WHERE "slug" = 'mental-health';
UPDATE "tags" SET "name" = 'Music' WHERE "slug" = 'music';
UPDATE "tags" SET "name" = 'Networking' WHERE "slug" = 'networking';
UPDATE "tags" SET "name" = 'Nuxt' WHERE "slug" = 'nuxt';
UPDATE "tags" SET "name" = 'ORM' WHERE "slug" = 'orm';
UPDATE "tags" SET "name" = 'PHP' WHERE "slug" = 'php';
UPDATE "tags" SET "name" = 'PlanetScale' WHERE "slug" = 'planetscale';
UPDATE "tags" SET "name" = 'Potluck' WHERE "slug" = 'potluck';
UPDATE "tags" SET "name" = 'Pricing' WHERE "slug" = 'pricing';
UPDATE "tags" SET "name" = 'Production' WHERE "slug" = 'production';
UPDATE "tags" SET "name" = 'Public Speaking' WHERE "slug" = 'public-speaking';
UPDATE "tags" SET "name" = 'Servers' WHERE "slug" = 'servers';
UPDATE "tags" SET "name" = 'Server-Side' WHERE "slug" = 'server-side';
UPDATE "tags" SET "name" = 'Services' WHERE "slug" = 'services';
UPDATE "tags" SET "name" = 'Spam' WHERE "slug" = 'spam';
UPDATE "tags" SET "name" = 'Speed' WHERE "slug" = 'speed';
UPDATE "tags" SET "name" = 'SQLite' WHERE "slug" = 'sqlite';
UPDATE "tags" SET "name" = 'Styling' WHERE "slug" = 'styling';
UPDATE "tags" SET "name" = 'Sustainability' WHERE "slug" = 'sustainability';
UPDATE "tags" SET "name" = 'SvelteKit' WHERE "slug" = 'sveltekit';
UPDATE "tags" SET "name" = 'Technology' WHERE "slug" = 'technology';
UPDATE "tags" SET "name" = 'Theming' WHERE "slug" = 'theming';
UPDATE "tags" SET "name" = 'Time Management' WHERE "slug" = 'time-management';
UPDATE "tags" SET "name" = 'Tori' WHERE "slug" = 'tori';
UPDATE "tags" SET "name" = 'Troubleshooting' WHERE "slug" = 'troubleshooting';
UPDATE "tags" SET "name" = 'Tutorial' WHERE "slug" = 'tutorial';
UPDATE "tags" SET "name" = 'Typography' WHERE "slug" = 'typography';
UPDATE "tags" SET "name" = 'Version Control' WHERE "slug" = 'version-control';
UPDATE "tags" SET "name" = 'Vim' WHERE "slug" = 'vim';
UPDATE "tags" SET "name" = 'WebRTC' WHERE "slug" = 'webrtc';
UPDATE "tags" SET "name" = 'WebSockets' WHERE "slug" = 'websockets';
UPDATE "tags" SET "name" = '1Password' WHERE "slug" = '1password';
UPDATE "tags" SET "name" = '2FA' WHERE "slug" = '2fa';
UPDATE "tags" SET "name" = '3D Printing' WHERE "slug" = '3dprinting';
UPDATE "tags" SET "name" = 'Abstraction' WHERE "slug" = 'abstraction';
UPDATE "tags" SET "name" = 'Accidents' WHERE "slug" = 'accidents';
UPDATE "tags" SET "name" = 'API Calls' WHERE "slug" = 'apicalls';
UPDATE "tags" SET "name" = 'Appright' WHERE "slug" = 'appright';
UPDATE "tags" SET "name" = 'Apps' WHERE "slug" = 'apps';
UPDATE "tags" SET "name" = 'App Versioning' WHERE "slug" = 'app-versioning';
UPDATE "tags" SET "name" = 'Architect' WHERE "slug" = 'architect';
UPDATE "tags" SET "name" = 'Architecture' WHERE "slug" = 'architecture';
UPDATE "tags" SET "name" = 'Assistant' WHERE "slug" = 'assistant';
UPDATE "tags" SET "name" = 'Async' WHERE "slug" = 'async';
UPDATE "tags" SET "name" = 'Asynchronous' WHERE "slug" = 'asynchronous';
UPDATE "tags" SET "name" = 'Audio AI' WHERE "slug" = 'audio-ai';
UPDATE "tags" SET "name" = 'Await' WHERE "slug" = 'await';
UPDATE "tags" SET "name" = 'Axios' WHERE "slug" = 'axios';
UPDATE "tags" SET "name" = 'Backblaze' WHERE "slug" = 'backblaze';
UPDATE "tags" SET "name" = 'Backyard' WHERE "slug" = 'backyard';
UPDATE "tags" SET "name" = 'Bandwidth' WHERE "slug" = 'bandwidth';
UPDATE "tags" SET "name" = 'Begin' WHERE "slug" = 'begin';
UPDATE "tags" SET "name" = 'Blockchain' WHERE "slug" = 'blockchain';
UPDATE "tags" SET "name" = 'Bluesky' WHERE "slug" = 'bluesky';
UPDATE "tags" SET "name" = 'Bookmarks' WHERE "slug" = 'bookmarks';
UPDATE "tags" SET "name" = 'Burnout' WHERE "slug" = 'burnout';
UPDATE "tags" SET "name" = 'CDN' WHERE "slug" = 'cdn';
UPDATE "tags" SET "name" = 'Charging' WHERE "slug" = 'charging';
UPDATE "tags" SET "name" = 'Chromium' WHERE "slug" = 'chromium';
UPDATE "tags" SET "name" = 'Closures' WHERE "slug" = 'closures';
UPDATE "tags" SET "name" = 'Clothing' WHERE "slug" = 'clothing';
UPDATE "tags" SET "name" = 'Cloudinary' WHERE "slug" = 'cloudinary';
UPDATE "tags" SET "name" = 'Cloud Storage' WHERE "slug" = 'cloud-storage';
UPDATE "tags" SET "name" = 'Code Generation' WHERE "slug" = 'code-generation';
UPDATE "tags" SET "name" = 'Coding Conventions' WHERE "slug" = 'coding-conventions';
UPDATE "tags" SET "name" = 'Coding Mistakes' WHERE "slug" = 'codingmistakes';
UPDATE "tags" SET "name" = 'Coding Workspace' WHERE "slug" = 'codingworkspace';
UPDATE "tags" SET "name" = 'Colors' WHERE "slug" = 'colors';
UPDATE "tags" SET "name" = 'Compatibility' WHERE "slug" = 'compatibility';
UPDATE "tags" SET "name" = 'Concurrency' WHERE "slug" = 'concurrency';
UPDATE "tags" SET "name" = 'Config Files' WHERE "slug" = 'configfiles';
UPDATE "tags" SET "name" = 'Connections' WHERE "slug" = 'connections';
UPDATE "tags" SET "name" = 'Connectivity' WHERE "slug" = 'connectivity';
UPDATE "tags" SET "name" = 'Consistency' WHERE "slug" = 'consistency';
UPDATE "tags" SET "name" = 'Content Strategy' WHERE "slug" = 'content-strategy';
UPDATE "tags" SET "name" = 'Conventional Commits' WHERE "slug" = 'conventionalcommits';
UPDATE "tags" SET "name" = 'Conversion' WHERE "slug" = 'conversion';
UPDATE "tags" SET "name" = 'GitHub Copilot' WHERE "slug" = 'copilot';
UPDATE "tags" SET "name" = 'Cottage Life' WHERE "slug" = 'cottagelife';
UPDATE "tags" SET "name" = 'Country Codes' WHERE "slug" = 'country-codes';
UPDATE "tags" SET "name" = 'COVID-19' WHERE "slug" = 'covid19';
UPDATE "tags" SET "name" = 'CSRF' WHERE "slug" = 'csrf';
UPDATE "tags" SET "name" = 'Curriculum' WHERE "slug" = 'curriculum';
UPDATE "tags" SET "name" = 'Customization' WHERE "slug" = 'customization';
UPDATE "tags" SET "name" = 'Dark Mode' WHERE "slug" = 'dark-mode';
UPDATE "tags" SET "name" = 'Data Collection' WHERE "slug" = 'data-collection';
UPDATE "tags" SET "name" = 'Data Fetching' WHERE "slug" = 'data-fetching';
UPDATE "tags" SET "name" = 'Date' WHERE "slug" = 'date';
UPDATE "tags" SET "name" = 'Decorators' WHERE "slug" = 'decorators';
UPDATE "tags" SET "name" = 'Deliverability' WHERE "slug" = 'deliverability';
UPDATE "tags" SET "name" = 'Dependencies' WHERE "slug" = 'dependencies';
UPDATE "tags" SET "name" = 'Desk Setup' WHERE "slug" = 'desksetup';
UPDATE "tags" SET "name" = 'Desktop Development' WHERE "slug" = 'desktopdev';
UPDATE "tags" SET "name" = 'Developer Experience' WHERE "slug" = 'developer-experience';
UPDATE "tags" SET "name" = 'Developer Gear' WHERE "slug" = 'developergear';
UPDATE "tags" SET "name" = 'Developer Hiring' WHERE "slug" = 'developer-hiring';
UPDATE "tags" SET "name" = 'Developer Relations' WHERE "slug" = 'developer-relations';
UPDATE "tags" SET "name" = 'Dev Fails' WHERE "slug" = 'devfails';
UPDATE "tags" SET "name" = 'Digital Nomad' WHERE "slug" = 'digital-nomad';
UPDATE "tags" SET "name" = 'Discussion' WHERE "slug" = 'discussion';
UPDATE "tags" SET "name" = 'DNS' WHERE "slug" = 'dns';
UPDATE "tags" SET "name" = 'Domain Registrars' WHERE "slug" = 'domain-registrars';
UPDATE "tags" SET "name" = 'Edge Functions' WHERE "slug" = 'edge-functions';
UPDATE "tags" SET "name" = 'Efficiency' WHERE "slug" = 'efficiency';
UPDATE "tags" SET "name" = 'Electronics' WHERE "slug" = 'electronics';
UPDATE "tags" SET "name" = 'Emergency Preparedness' WHERE "slug" = 'emergency-preparedness';
UPDATE "tags" SET "name" = 'Encoding' WHERE "slug" = 'encoding';
UPDATE "tags" SET "name" = 'Enums' WHERE "slug" = 'enums';
UPDATE "tags" SET "name" = 'Environment' WHERE "slug" = 'environment';
UPDATE "tags" SET "name" = 'Environment Variables' WHERE "slug" = 'envvars';
UPDATE "tags" SET "name" = 'Error Handling' WHERE "slug" = 'error-handling';
UPDATE "tags" SET "name" = 'Ethics' WHERE "slug" = 'ethics';
UPDATE "tags" SET "name" = 'Events' WHERE "slug" = 'events';
UPDATE "tags" SET "name" = 'EV Ownership' WHERE "slug" = 'ev-ownership';
UPDATE "tags" SET "name" = 'Executables' WHERE "slug" = 'executables';
UPDATE "tags" SET "name" = 'Exercise' WHERE "slug" = 'exercise';
UPDATE "tags" SET "name" = 'Facebook' WHERE "slug" = 'facebook';
UPDATE "tags" SET "name" = 'Failures' WHERE "slug" = 'failures';
UPDATE "tags" SET "name" = 'Family' WHERE "slug" = 'family';
UPDATE "tags" SET "name" = 'Favicons' WHERE "slug" = 'favicons';
UPDATE "tags" SET "name" = 'Filament' WHERE "slug" = 'filament';
UPDATE "tags" SET "name" = 'Firebug' WHERE "slug" = 'firebug';
UPDATE "tags" SET "name" = 'First Jobs' WHERE "slug" = 'first-jobs';
UPDATE "tags" SET "name" = 'Font Loading' WHERE "slug" = 'fontloading';
UPDATE "tags" SET "name" = 'Framer' WHERE "slug" = 'framer';
UPDATE "tags" SET "name" = 'Fulfillment' WHERE "slug" = 'fulfillment';
UPDATE "tags" SET "name" = 'Full Stack' WHERE "slug" = 'full-stack';
UPDATE "tags" SET "name" = 'Fusion' WHERE "slug" = 'fusion';
UPDATE "tags" SET "name" = 'Gardening' WHERE "slug" = 'gardening';
UPDATE "tags" SET "name" = 'Global' WHERE "slug" = 'global';
UPDATE "tags" SET "name" = 'Grid' WHERE "slug" = 'grid';
UPDATE "tags" SET "name" = 'Halloween' WHERE "slug" = 'halloween';
UPDATE "tags" SET "name" = 'Hardware Hacks' WHERE "slug" = 'hardware-hacks';
UPDATE "tags" SET "name" = 'Headings' WHERE "slug" = 'headings';
UPDATE "tags" SET "name" = 'Hono' WHERE "slug" = 'honojs';
UPDATE "tags" SET "name" = 'Hooks' WHERE "slug" = 'hooks';
UPDATE "tags" SET "name" = 'IE11' WHERE "slug" = 'ie11';
UPDATE "tags" SET "name" = 'Iframes' WHERE "slug" = 'iframes';
UPDATE "tags" SET "name" = 'Immutability' WHERE "slug" = 'immutability';
UPDATE "tags" SET "name" = 'Income Share' WHERE "slug" = 'incomeshare';
UPDATE "tags" SET "name" = 'Inspiration' WHERE "slug" = 'inspiration';
UPDATE "tags" SET "name" = 'Interviews' WHERE "slug" = 'interview';
UPDATE "tags" SET "name" = 'Interview Tips' WHERE "slug" = 'interview-tips';
UPDATE "tags" SET "name" = 'Job Search' WHERE "slug" = 'job-search';
UPDATE "tags" SET "name" = 'JSON' WHERE "slug" = 'json';
UPDATE "tags" SET "name" = 'Libraries' WHERE "slug" = 'libraries';
UPDATE "tags" SET "name" = 'Licensing' WHERE "slug" = 'licensing';
UPDATE "tags" SET "name" = 'LinkeDOM' WHERE "slug" = 'linkeddom';
UPDATE "tags" SET "name" = 'Link Tag' WHERE "slug" = 'link-tag';
UPDATE "tags" SET "name" = 'Linux' WHERE "slug" = 'linux';
UPDATE "tags" SET "name" = 'Lit' WHERE "slug" = 'lit';
UPDATE "tags" SET "name" = 'Live Podcast' WHERE "slug" = 'live-podcast';
UPDATE "tags" SET "name" = 'Local Storage' WHERE "slug" = 'local-storage';
UPDATE "tags" SET "name" = 'Login' WHERE "slug" = 'login';
UPDATE "tags" SET "name" = 'LTE Internet' WHERE "slug" = 'lte-internet';
UPDATE "tags" SET "name" = 'Lua' WHERE "slug" = 'lua';
UPDATE "tags" SET "name" = 'MacBook' WHERE "slug" = 'macbook';
UPDATE "tags" SET "name" = 'Margins' WHERE "slug" = 'margins';
UPDATE "tags" SET "name" = 'Markdown' WHERE "slug" = 'markdown';
UPDATE "tags" SET "name" = 'MCP' WHERE "slug" = 'mcp';
UPDATE "tags" SET "name" = 'MDX' WHERE "slug" = 'mdx';
UPDATE "tags" SET "name" = 'Media' WHERE "slug" = 'media';
UPDATE "tags" SET "name" = 'Meteor' WHERE "slug" = 'meteor';
UPDATE "tags" SET "name" = 'Micro Frontends' WHERE "slug" = 'microfrontends';
UPDATE "tags" SET "name" = 'Middleware' WHERE "slug" = 'middleware';
UPDATE "tags" SET "name" = 'Milestone' WHERE "slug" = 'milestone';
UPDATE "tags" SET "name" = 'Modeling' WHERE "slug" = 'modeling';
UPDATE "tags" SET "name" = 'Module Federation' WHERE "slug" = 'module-federation';
UPDATE "tags" SET "name" = 'Monkey Patch' WHERE "slug" = 'monkey-patch';
UPDATE "tags" SET "name" = 'Motion' WHERE "slug" = 'motion';
UPDATE "tags" SET "name" = 'Mozilla' WHERE "slug" = 'mozilla';
UPDATE "tags" SET "name" = 'Native' WHERE "slug" = 'native';
UPDATE "tags" SET "name" = 'Neovim' WHERE "slug" = 'neovim';
UPDATE "tags" SET "name" = 'Nostalgia' WHERE "slug" = 'nostalgia';
UPDATE "tags" SET "name" = 'OAuth' WHERE "slug" = 'oauth';
UPDATE "tags" SET "name" = 'Offline Data' WHERE "slug" = 'offline-data';
UPDATE "tags" SET "name" = 'OG Images' WHERE "slug" = 'ogimage';
UPDATE "tags" SET "name" = 'Online Business' WHERE "slug" = 'online-business';
UPDATE "tags" SET "name" = 'Packaging' WHERE "slug" = 'packaging';
UPDATE "tags" SET "name" = 'PageSpeed' WHERE "slug" = 'pagespeed';
UPDATE "tags" SET "name" = 'Parcel' WHERE "slug" = 'parcel';
UPDATE "tags" SET "name" = 'Parenting' WHERE "slug" = 'parenting';
UPDATE "tags" SET "name" = 'Passkeys' WHERE "slug" = 'passkeys';
UPDATE "tags" SET "name" = 'Payload' WHERE "slug" = 'payload';
UPDATE "tags" SET "name" = 'Perfmatters' WHERE "slug" = 'perfmatters';
UPDATE "tags" SET "name" = 'Planning' WHERE "slug" = 'planning';
UPDATE "tags" SET "name" = 'Polyfills' WHERE "slug" = 'polyfills';
UPDATE "tags" SET "name" = 'Pop!_OS' WHERE "slug" = 'pop-os';
UPDATE "tags" SET "name" = 'PostCSS' WHERE "slug" = 'postcss';
UPDATE "tags" SET "name" = 'Postgres' WHERE "slug" = 'postgres';
UPDATE "tags" SET "name" = 'Prefetching' WHERE "slug" = 'prefetching';
UPDATE "tags" SET "name" = 'Presents' WHERE "slug" = 'presents';
UPDATE "tags" SET "name" = 'Print CSS' WHERE "slug" = 'print-css';
UPDATE "tags" SET "name" = 'Progressive Enhancement' WHERE "slug" = 'progressive-enhancement';
UPDATE "tags" SET "name" = 'Proposals' WHERE "slug" = 'proposals';
UPDATE "tags" SET "name" = 'Protocols' WHERE "slug" = 'protocols';
UPDATE "tags" SET "name" = 'PWA' WHERE "slug" = 'pwa';
UPDATE "tags" SET "name" = 'Raycast' WHERE "slug" = 'raycast';
UPDATE "tags" SET "name" = 'React Native' WHERE "slug" = 'react-native';
UPDATE "tags" SET "name" = 'Rebase' WHERE "slug" = 'rebase';
UPDATE "tags" SET "name" = 'Records' WHERE "slug" = 'records';
UPDATE "tags" SET "name" = 'Refresh Strategies' WHERE "slug" = 'refresh-strategies';
UPDATE "tags" SET "name" = 'Render' WHERE "slug" = 'render';
UPDATE "tags" SET "name" = 'Rendering' WHERE "slug" = 'rendering';
UPDATE "tags" SET "name" = 'Responsive Design' WHERE "slug" = 'responsive-design';
UPDATE "tags" SET "name" = 'Reverse Proxy' WHERE "slug" = 'reverse-proxy';
UPDATE "tags" SET "name" = 'Rollup' WHERE "slug" = 'rollup';
UPDATE "tags" SET "name" = 'Rural Internet' WHERE "slug" = 'rural-internet';
UPDATE "tags" SET "name" = 'Safari' WHERE "slug" = 'safari';
UPDATE "tags" SET "name" = 'Sanity' WHERE "slug" = 'sanity';
UPDATE "tags" SET "name" = 'Scaling' WHERE "slug" = 'scaling';
UPDATE "tags" SET "name" = 'Scope' WHERE "slug" = 'scope';
UPDATE "tags" SET "name" = 'Scrolling' WHERE "slug" = 'scrolling';
UPDATE "tags" SET "name" = 'Self-Care' WHERE "slug" = 'selfcare';
UPDATE "tags" SET "name" = 'Self-Improvement' WHERE "slug" = 'self-improvement';
UPDATE "tags" SET "name" = 'Server Components' WHERE "slug" = 'server-components';
UPDATE "tags" SET "name" = 'Service Workers' WHERE "slug" = 'service-workers';
UPDATE "tags" SET "name" = 'Shipping Logistics' WHERE "slug" = 'shippinglogistics';
UPDATE "tags" SET "name" = 'Shopify' WHERE "slug" = 'shopify';
UPDATE "tags" SET "name" = 'Shortcuts' WHERE "slug" = 'shortcuts';
UPDATE "tags" SET "name" = 'Side Hustles' WHERE "slug" = 'side-hustles';
UPDATE "tags" SET "name" = 'Side Projects' WHERE "slug" = 'side-projects';
UPDATE "tags" SET "name" = 'Smart Home' WHERE "slug" = 'smart-home';
UPDATE "tags" SET "name" = 'Snowpack' WHERE "slug" = 'snowpack';
UPDATE "tags" SET "name" = 'Social Media' WHERE "slug" = 'socialmedia';
UPDATE "tags" SET "name" = 'Soft Skills' WHERE "slug" = 'soft-skills';
UPDATE "tags" SET "name" = 'Software Gone Wrong' WHERE "slug" = 'softwaregonewrong';
UPDATE "tags" SET "name" = 'SolidJS' WHERE "slug" = 'solidjs';
UPDATE "tags" SET "name" = 'Speaking' WHERE "slug" = 'speaking';
UPDATE "tags" SET "name" = 'Sports' WHERE "slug" = 'sports';
UPDATE "tags" SET "name" = 'Sprite Maps' WHERE "slug" = 'sprite-maps';
UPDATE "tags" SET "name" = 'SQL' WHERE "slug" = 'sql';
UPDATE "tags" SET "name" = 'SSL' WHERE "slug" = 'ssl';
UPDATE "tags" SET "name" = 'SSR' WHERE "slug" = 'ssr';
UPDATE "tags" SET "name" = 'Stale-While-Revalidate' WHERE "slug" = 'stale-while-revalidate';
UPDATE "tags" SET "name" = 'Starlink' WHERE "slug" = 'starlink';
UPDATE "tags" SET "name" = 'Startups' WHERE "slug" = 'startups';
UPDATE "tags" SET "name" = 'Stickers' WHERE "slug" = 'stickers';
UPDATE "tags" SET "name" = 'Stretches' WHERE "slug" = 'stretches';
UPDATE "tags" SET "name" = 'Supabase' WHERE "slug" = 'supabase';
UPDATE "tags" SET "name" = 'System76' WHERE "slug" = 'system76';
UPDATE "tags" SET "name" = 'Systems' WHERE "slug" = 'systems';
UPDATE "tags" SET "name" = 'Tailwind' WHERE "slug" = 'tailwind';
UPDATE "tags" SET "name" = 'Team Dynamics' WHERE "slug" = 'team-dynamics';
UPDATE "tags" SET "name" = 'Tech' WHERE "slug" = 'tech';
UPDATE "tags" SET "name" = 'Technical Debt' WHERE "slug" = 'technical-debt';
UPDATE "tags" SET "name" = 'Technology Predictions' WHERE "slug" = 'technology-predictions';
UPDATE "tags" SET "name" = 'Time' WHERE "slug" = 'time';
UPDATE "tags" SET "name" = 'Tamagui' WHERE "slug" = 'tomagui';
UPDATE "tags" SET "name" = 'Transitions' WHERE "slug" = 'transitions';
UPDATE "tags" SET "name" = 'Transpile' WHERE "slug" = 'transpile';
UPDATE "tags" SET "name" = 'Travel' WHERE "slug" = 'travel';
UPDATE "tags" SET "name" = 'Tuples' WHERE "slug" = 'tuples';
UPDATE "tags" SET "name" = 'Turbolinks' WHERE "slug" = 'turbolinks';
UPDATE "tags" SET "name" = 'Twitch' WHERE "slug" = 'twitch';
UPDATE "tags" SET "name" = 'Types' WHERE "slug" = 'types';
UPDATE "tags" SET "name" = 'UI Development' WHERE "slug" = 'ui-development';
UPDATE "tags" SET "name" = 'UI Frameworks' WHERE "slug" = 'ui-frameworks';
UPDATE "tags" SET "name" = 'Ukraine' WHERE "slug" = 'ukraine';
UPDATE "tags" SET "name" = 'Utilities' WHERE "slug" = 'utilities';
UPDATE "tags" SET "name" = 'Utility' WHERE "slug" = 'utility';
UPDATE "tags" SET "name" = 'Vaccine' WHERE "slug" = 'vaccine';
UPDATE "tags" SET "name" = 'Vercel' WHERE "slug" = 'vercel';
UPDATE "tags" SET "name" = 'Versioning' WHERE "slug" = 'versioning';
UPDATE "tags" SET "name" = 'Vibe Coding' WHERE "slug" = 'vibecoding';
UPDATE "tags" SET "name" = 'Video Production' WHERE "slug" = 'video-production';
UPDATE "tags" SET "name" = 'Video Streaming' WHERE "slug" = 'videostreaming';
UPDATE "tags" SET "name" = 'Viewport' WHERE "slug" = 'viewport';
UPDATE "tags" SET "name" = 'Visibility' WHERE "slug" = 'visibility';
UPDATE "tags" SET "name" = 'Vitest' WHERE "slug" = 'vitest';
UPDATE "tags" SET "name" = 'Vitkit' WHERE "slug" = 'vitkit';
UPDATE "tags" SET "name" = 'Web Almanac' WHERE "slug" = 'webalmanac';
UPDATE "tags" SET "name" = 'Web APIs' WHERE "slug" = 'web-api';
UPDATE "tags" SET "name" = 'Web App Updates' WHERE "slug" = 'web-app-updates';
UPDATE "tags" SET "name" = 'Web Audio' WHERE "slug" = 'web-audio';
UPDATE "tags" SET "name" = 'Web Fonts' WHERE "slug" = 'webfonts';
UPDATE "tags" SET "name" = 'Webhooks' WHERE "slug" = 'webhooks';
UPDATE "tags" SET "name" = 'Web Infrastructure' WHERE "slug" = 'web-infrastructure';
UPDATE "tags" SET "name" = 'WebKit' WHERE "slug" = 'webkit';
UPDATE "tags" SET "name" = 'Web MIDI' WHERE "slug" = 'web-midi';
UPDATE "tags" SET "name" = 'Website' WHERE "slug" = 'website';
UPDATE "tags" SET "name" = 'Website Design' WHERE "slug" = 'website-design';
UPDATE "tags" SET "name" = 'Web Streams' WHERE "slug" = 'web-streams';
UPDATE "tags" SET "name" = 'Wellness' WHERE "slug" = 'wellness';
UPDATE "tags" SET "name" = 'Window Management' WHERE "slug" = 'window-management';
UPDATE "tags" SET "name" = 'Windows' WHERE "slug" = 'windows';
UPDATE "tags" SET "name" = 'Working from Home' WHERE "slug" = 'working-from-home';
UPDATE "tags" SET "name" = 'Work-Life Balance' WHERE "slug" = 'work-life-balance';
UPDATE "tags" SET "name" = 'YouTube' WHERE "slug" = 'youtube';

COMMIT;
