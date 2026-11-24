-- One-off: copies episodes' guests, hosts, transcripts and AI notes from the show-number / show-id
-- links onto content ids (migration 0011_content_links). Safe to run again: it only fills what is
-- missing. Run it once after 0011, and again right after the deploy that switches the code over, to
-- catch anything the old code wrote in between. Then migration 0012 drops the old links.
--
--   psql "$DATABASE_URL" --single-transaction -v ON_ERROR_STOP=1 -f scripts/backfill-content-links.sql
--
-- Delete this file once 0012 has run on production.

-- Every linked episode needs a content id, or its links would be left behind
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM shows s
		WHERE s.content_id IS NULL
			AND (
				EXISTS (SELECT 1 FROM show_guests g WHERE g.show_id = s.id)
				OR EXISTS (SELECT 1 FROM show_to_profile p WHERE p.show_id = s.id)
				OR EXISTS (SELECT 1 FROM transcripts t WHERE t.show_number = s.number)
				OR EXISTS (SELECT 1 FROM ai_show_notes a WHERE a.show_number = s.number)
			)
	) THEN
		RAISE EXCEPTION 'Some episodes with guests, hosts, a transcript or AI notes have no content_id';
	END IF;
END $$;

-- In the order the rows were first saved (ctid), which is the order pages list guests and hosts in
INSERT INTO content_guests (content_id, guest_id)
SELECT s.content_id, g.guest_id
FROM show_guests g
JOIN shows s ON s.id = g.show_id
ORDER BY g.ctid
ON CONFLICT DO NOTHING;

INSERT INTO content_hosts (content_id, profile_id)
SELECT s.content_id, p.profile_id
FROM show_to_profile p
JOIN shows s ON s.id = p.show_id
ORDER BY p.ctid
ON CONFLICT DO NOTHING;

-- A content item keeps the transcript it already has (one made by the new code wins)
UPDATE transcripts t
SET content_id = s.content_id
FROM shows s
WHERE t.show_number = s.number
	AND t.content_id IS NULL
	AND NOT EXISTS (SELECT 1 FROM transcripts other WHERE other.content_id = s.content_id);

UPDATE ai_show_notes a
SET content_id = s.content_id
FROM shows s
WHERE a.show_number = s.number
	AND a.content_id IS NULL
	AND NOT EXISTS (SELECT 1 FROM ai_show_notes other WHERE other.content_id = s.content_id);

-- What is still only on the old links (each should be 0)
SELECT
	(SELECT count(*) FROM show_guests g JOIN shows s ON s.id = g.show_id
		WHERE NOT EXISTS (SELECT 1 FROM content_guests c WHERE c.content_id = s.content_id AND c.guest_id = g.guest_id)) AS guests_left,
	(SELECT count(*) FROM show_to_profile p JOIN shows s ON s.id = p.show_id
		WHERE NOT EXISTS (SELECT 1 FROM content_hosts c WHERE c.content_id = s.content_id AND c.profile_id = p.profile_id)) AS hosts_left,
	(SELECT count(*) FROM transcripts WHERE show_number IS NOT NULL AND content_id IS NULL) AS transcripts_left,
	(SELECT count(*) FROM ai_show_notes WHERE show_number IS NOT NULL AND content_id IS NULL) AS ai_notes_left;
