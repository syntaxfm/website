export function replace_special_chars(str: string) {
	return str.replace(/[&<>"']/g, (match) => {
		return (
			{
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			}[match] || ''
		);
	});
}
