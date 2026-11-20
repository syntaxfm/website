// A browser in words, e.g. "Safari 18.2 on iOS 18.2", from the user agent and, where the browser
// has them (Chromium), User-Agent Client Hints, which name the real brand (Edge, Brave, Chrome).

export interface ClientHints {
	brands: { brand: string; version: string }[];
	platform: string;
	mobile: boolean;
}

// UA tokens in the order they must be tried: Edge, Opera and Samsung also say "Chrome", and every
// iOS browser also says "Safari"
const BROWSER_PATTERNS: [name: string, pattern: RegExp][] = [
	['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
	['Opera', /(?:OPR|OPT)\/([\d.]+)/],
	['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
	['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
	['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
	['Safari', /Version\/([\d.]+).*Safari/]
];

// Major for most browsers; Safari and iOS ship fixes in their minor versions
function short_version(version: string, parts: number): string {
	return version.split('.').slice(0, parts).join('.');
}

export function operating_system(user_agent: string, max_touch_points = 0): string | null {
	const ios = user_agent.match(/(?:iPhone|iPad|iPod).*? OS (\d+)_(\d+)/);
	if (ios) return `${/iPad/.test(user_agent) ? 'iPadOS' : 'iOS'} ${ios[1]}.${ios[2]}`;
	// iPads ask for the desktop site and say "Macintosh"; only touch gives them away
	if (/Macintosh/.test(user_agent)) return max_touch_points > 1 ? 'iPadOS' : 'macOS';
	const android = user_agent.match(/Android (\d+(?:\.\d+)?)/);
	if (android) return `Android ${android[1]}`;
	if (/Windows/.test(user_agent)) return 'Windows';
	if (/CrOS/.test(user_agent)) return 'ChromeOS';
	if (/Linux/.test(user_agent)) return 'Linux';
	return null;
}

function name_from_hints(hints: ClientHints): string | null {
	const real = hints.brands.filter(({ brand }) => !/not.?a.?brand/i.test(brand));
	const named = real.find(({ brand }) => brand !== 'Chromium') ?? real[0];
	return named ? `${named.brand.replace(/^Google /, '')} ${named.version}` : null;
}

function name_from_user_agent(user_agent: string): string | null {
	for (const [name, pattern] of BROWSER_PATTERNS) {
		const match = user_agent.match(pattern);
		if (match) return `${name} ${short_version(match[1], name === 'Safari' ? 2 : 1)}`;
	}
	return null;
}

export function browser_name(
	user_agent: string,
	hints: ClientHints | null = null,
	max_touch_points = 0
): string {
	const browser = (hints && name_from_hints(hints)) ?? name_from_user_agent(user_agent);
	// The UA's OS is more exact than the hints' platform on iOS and Android
	const os = operating_system(user_agent, max_touch_points) ?? (hints?.platform || null);
	if (!browser) return os ? `Unknown browser on ${os}` : 'Unknown browser';
	return os ? `${browser} on ${os}` : browser;
}
