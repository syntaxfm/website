import type { AnyColumn, SQL } from 'drizzle-orm';

/**
 * Orders a content's guests or hosts the way they were added (main guest first). Postgres returns
 * link rows in whatever order is cheapest, so every relational query that lists them sorts by this:
 * `guests: { orderBy: in_order_added, with: { guest: true } }`.
 */
export function in_order_added(
	link: { position: AnyColumn },
	{ asc }: { asc: (column: AnyColumn) => SQL }
): SQL[] {
	return [asc(link.position)];
}
