export async function load({ locals, url, setHeaders }) {
	setHeaders({
		'cache-control': 'max-age=240'
	});

	const order = url.searchParams.get('order') === 'desc' ? 'desc' : 'asc'; // Ensure order can only be 'asc' or 'desc'
	const filter = url.searchParams.get('filter');

	let whereClause = '';
	const params = [];

	if (filter) {
		switch (filter) {
			case 'hasty':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(2); // Monday
				break;
			case 'tasty':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(4); // Wednesday
				break;
			case 'supper':
				whereClause += 'DAYOFWEEK(date) = ?';
				params.push(6); // Friday
				break;
			case 'special':
				whereClause += 'DAYOFWEEK(date) NOT IN (?, ?, ?)';
				params.push(2, 4, 6); // Not Monday, Wednesday, or Friday
				break;
		}
	}

	let sqlQuery = 'SELECT * FROM `Show`';
	if (whereClause !== '') {
		sqlQuery += ` WHERE ${whereClause}`;
	}
	sqlQuery += ` ORDER BY number ${order} LIMIT 20`;

	return {
		shows: locals.prisma.$queryRawUnsafe(sqlQuery, ...params)
	};
}
