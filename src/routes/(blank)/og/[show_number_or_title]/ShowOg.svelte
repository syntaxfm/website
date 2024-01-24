<script lang="ts">
	import type { LatestShow } from '$server/ai/queries';
	import { format_show_type } from '$utilities/format_show_type';
	import { format } from 'date-fns';
	import { tick } from 'svelte';
	import FacePile from '../../../../lib/FacePile.svelte';

	export let show: LatestShow & { isPage?: boolean };
	export let show_date = show.date ? new Date(show.date) : null;

	function fitText(node: HTMLHeadElement) {
		node.classList.remove('finish-sizing-text');
		// Find out how many lines this text needs to be.
		let lineLimit = 1;
		const text = node.innerText;
		if (text.length > 20 && text.length < 50) {
			lineLimit = 2;
		} else if (text.length >= 50 && text.length < 80) {
			lineLimit = 3;
		} else if (text.length >= 80) {
			lineLimit = 3;
		}
		let fontSize = 0.5;
		let increment = 0.1;
		node.style.fontSize = `${fontSize}cqw`;

		function sizeText() {
			// We use tick here instead of await wait(), same technique, no async required since the action was complaining about returning a promise
			tick();
			node.style.fontSize = `${fontSize}cqw`;
			const lineHeight = parseInt(getComputedStyle(node).lineHeight, 10);
			const height = node.offsetHeight;
			const width = node.offsetWidth;
			const lines = height / lineHeight;
			// Handle overflow for single word titles "Syntax"
			const overflowing = width > window.innerWidth;
			if (overflowing) {
				fontSize = Math.min(fontSize - increment * 30, 12);
				node.style.fontSize = `${fontSize}cqw`;
				node.classList.add('finish-sizing-text');
				return;
			} else if (lines <= lineLimit + 1) {
				// Keep incrementing until we get to the right number of lines.
				fontSize += increment;
				// console.log('incrementing', fontSize);
				sizeText();
			} else if (lines >= lineLimit + 1) {
				// We overshot it, back off by 1 increment.
				fontSize -= increment;
				node.style.fontSize = `${fontSize}cqw`;
				// console.log('backing off', fontSize);
				// Add a class so Puppeteer can tell when the text is sized.
				node.classList.add('finish-sizing-text');
				// node.insertAdjacentHTML('beforebegin', `<small>${fontSize - increment}</small>`);
			}
		}

		return sizeText();
	}
</script>

<article style="--title-length: {show.title.length}">
	{#if show.number}
		<span class="grit show-number">{show.number}</span>
	{/if}

	<div class="details">
		<header>
			{#if show_date}
				<p class="date">
					{format_show_type(show.date)}
					<span aria-hidden="true">×</span>
					<time datetime={show_date.toDateString()} title={show_date.toDateString()}
						>{format(show_date, 'MMMM do, yyyy')}</time
					>
				</p>
			{/if}
		</header>

		<h1 use:fitText class="show-title" class:center={show.isPage}>
			{show.title}
		</h1>

		<div class="brand-footer">
			<FacePile
				size="120px"
				faces={[
					{ name: 'Wes Bos', github: 'wesbos' },
					{ name: 'Scott Tolinski', github: 'stolinski' },
					...(show.guests || []).map((guest) => ({
						name: guest.Guest.name,
						github: guest.Guest.github || ''
					}))
				]}
			/>
			<div class="grit logos">
				<svg height="100px" viewBox="0 0 1371 1212" fill="none" xmlns="http://www.w3.org/2000/svg">
					<title>Syntax</title>
					<path
						d="M255.125 590.149C293.973 588.793 328.25 580.303 357.957 564.68C387.663 549.056 410.404 527.329 426.179 499.497C441.953 471.665 449.219 439.944 447.975 404.333C446.675 367.104 436.983 337.055 418.897 314.187C400.812 291.319 379.282 274.244 354.308 262.961C329.334 251.679 298.565 240.733 262 230.125C226.514 219.48 201.053 209.7 185.615 200.785C170.178 191.87 162.167 179.05 161.583 162.324C161.074 147.756 166.619 136.352 178.216 128.114C189.813 119.876 205.593 115.409 225.557 114.711C274.117 113.016 316.128 132.617 351.59 173.516L418.564 95.8166C389.992 66.5623 359.962 45.8673 328.476 33.7315C296.99 21.5958 263.172 16.1591 227.021 17.4215C170.368 19.3999 124.856 34.8997 90.4849 63.9211C56.1142 92.9425 39.7956 132.273 41.529 181.912C42.6784 214.825 51.4441 241.53 67.8261 262.026C84.2081 282.523 103.788 297.91 126.566 308.189C149.344 318.468 177.917 328.41 212.286 338.014C239.566 345.705 260.872 352.524 276.206 358.471C291.54 364.418 303.962 372.087 313.474 381.479C322.986 390.871 328.005 403.12 328.533 418.228C329.211 437.652 322.608 453.549 308.725 465.919C294.841 478.288 275.759 484.897 251.479 485.745C223.961 486.706 197.905 479.242 173.311 463.354C148.716 447.467 126.672 423.386 107.178 391.114L22.1153 461.341C49.0383 505.239 82.5988 538.101 122.797 559.926C162.995 581.752 207.104 591.826 255.125 590.149ZM482.056 719.98C528.998 718.34 566.24 713.528 593.782 705.544C621.324 697.559 643.794 683.539 661.191 663.484C678.588 643.429 693.911 614.262 707.16 575.984L852.655 147.915L725.589 152.352L651.48 443.415L645.815 443.613L552.391 158.4L426.135 162.809L591.584 561.383C584.69 580.531 572.668 595.942 555.518 607.615C538.369 619.289 512.798 625.719 478.806 626.906L482.056 719.98ZM1015.6 557.11L1007.04 311.881C1006.19 287.601 1013.33 267.769 1028.46 252.385C1043.59 237 1063.56 228.875 1088.38 228.008C1110.51 227.236 1127.98 232.703 1140.82 244.409C1153.65 256.116 1160.49 274.109 1161.34 298.39L1170.19 551.712L1288.35 547.586L1278.77 273.22C1277.22 228.977 1262.89 193.688 1235.77 167.354C1208.65 141.02 1173.51 128.607 1130.34 130.114C1101.75 131.113 1076.85 137.52 1055.66 149.334C1034.46 161.149 1017.7 176.185 1005.37 194.443L1001.32 194.584L999.514 142.786L882.16 146.884L896.631 561.265L1015.6 557.11ZM302.156 1194.4L298.934 1102.13L249.564 1103.86C236.615 1104.31 227.194 1101.4 221.303 1095.12C215.412 1088.84 212.202 1078.15 211.674 1063.04L204.581 859.9L290.37 856.904L287.685 780.017L201.896 783.013L196.865 638.951L78.7017 643.077L83.7324 787.139L26.2695 789.146L28.9545 866.033L86.4174 864.026L94.5288 1096.31C95.697 1129.76 105.099 1155.36 122.736 1173.11C140.373 1190.86 164.838 1199.19 196.133 1198.1L302.156 1194.4ZM473.605 1197.32C495.727 1196.55 518.763 1191.02 542.714 1180.73C566.664 1170.44 587.501 1156.07 605.224 1137.63L606.835 1183.76L711.24 1180.11L701.376 897.653C699.737 850.712 681.516 816.234 646.714 794.22C611.911 772.206 566.993 762.16 511.958 764.082C469.872 765.552 434.646 773.94 406.279 789.246C377.912 804.552 354.218 826.043 335.196 853.718L409.986 907.019C423.914 888.165 438.964 874.404 455.138 865.736C471.312 857.068 491.539 852.31 515.819 851.462C543.337 850.501 563.456 854.255 576.177 862.725C588.897 871.194 595.886 885.671 597.141 906.155C585.384 909.807 576.556 912.276 570.659 913.563C523.611 927.631 489.409 938.279 468.053 945.507C446.697 952.735 426.997 960.986 408.954 970.26C358.06 997.967 333.49 1036.91 335.242 1087.09C336.486 1122.7 349.606 1150.33 374.602 1169.99C399.598 1189.64 432.599 1198.76 473.605 1197.32ZM502.898 1107.98C490.488 1108.41 480.119 1105.39 471.79 1098.93C463.461 1092.47 459.08 1083.04 458.647 1070.63C457.969 1051.2 469.572 1035.4 493.456 1023.22C504.059 1017.45 519.369 1011.11 539.385 1004.2C559.402 997.284 579.558 990.503 599.854 983.852L602.398 1056.69C589.455 1072.81 574.358 1085.22 557.105 1093.93C539.852 1102.63 521.783 1107.32 502.898 1107.98ZM882.378 1174.14L960.267 1037.71L1047.48 1168.37L1191.55 1163.34L1039.38 959.589L1177.07 748.959L1033.01 753.99L955.011 887.176L867.908 759.755L723.846 764.786L874.277 965.355L738.316 1179.17L882.378 1174.14Z"
						fill="var(--primary, #fabf46)"
					/>
					<path
						d="M1366.31 1031.2L1370.78 1159.08L1227.52 1164.08L1223.06 1036.21L1366.31 1031.2Z"
						fill="var(--primary, #fabf46)"
					/>
				</svg>

				<svg class="sentry" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 44"
					><path
						d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z M124.32,28.28,109.56,9.22h-3.68V34.77h3.73V15.19l15.18,19.58h3.26V9.22h-3.73ZM87.15,23.54h13.23V20.22H87.14V12.53h14.93V9.21H83.34V34.77h18.92V31.45H87.14ZM71.59,20.3h0C66.44,19.06,65,18.08,65,15.7c0-2.14,1.89-3.59,4.71-3.59a12.06,12.06,0,0,1,7.07,2.55l2-2.83a14.1,14.1,0,0,0-9-3c-5.06,0-8.59,3-8.59,7.27,0,4.6,3,6.19,8.46,7.52C74.51,24.74,76,25.78,76,28.11s-2,3.77-5.09,3.77a12.34,12.34,0,0,1-8.3-3.26l-2.25,2.69a15.94,15.94,0,0,0,10.42,3.85c5.48,0,9-2.95,9-7.51C79.75,23.79,77.47,21.72,71.59,20.3ZM195.7,9.22l-7.69,12-7.64-12h-4.46L186,24.67V34.78h3.84V24.55L200,9.22Zm-64.63,3.46h8.37v22.1h3.84V12.68h8.37V9.22H131.08ZM169.41,24.8c3.86-1.07,6-3.77,6-7.63,0-4.91-3.59-8-9.38-8H154.67V34.76h3.8V25.58h6.45l6.48,9.2h4.44l-7-9.82Zm-10.95-2.5V12.6h7.17c3.74,0,5.88,1.77,5.88,4.84s-2.29,4.86-5.84,4.86Z"
						fill="#ffffff"
					/></svg
				>
			</div>
		</div>
	</div>
</article>

<style lang="postcss">
	article {
		border: 10px solid var(--yellow);
		border-radius: 35px;
		container: show-card / inline-size;
		display: grid;
		padding: 20px;
		background-image: var(--bgGritDark),
			radial-gradient(farthest-side circle at 50% 0%, #3a006b66 4% 4%, #000 100%);
		background-color: black;
		color: var(--fg);
		position: relative;
		align-items: start;
		height: 100%;

		.details {
			gap: 0.5rem;
			display: grid;
			grid-template-rows: auto 1fr auto;
			align-items: center;
			justify-content: center;
			height: 100%;
		}
	}

	h1 {
		margin: 0;
		font-weight: 600;
		line-height: 1;
		font-size: 50px;
		width: 100%;
		font-style: italic;
		transform: rotate(-1deg);
		text-align: center;

		/* black text outline in case white h1 text goes over yellow show number */
		text-shadow:
			2px 0 0 black,
			0 2px 0 black,
			-2px 0 0 black,
			0 -2px 0 black;
	}

	.date {
		font-size: var(--font-size-md);
		margin: 0;
	}

	.sentry {
		font-size: var(--font-size-sm);
		width: 100%;
	}

	.show-number {
		position: absolute;
		right: 0;
		top: 0;
		transform: translate(6.9%, -22%);
		font-size: 20cqw;
		font-weight: 900;
		color: var(--yellow);
		line-height: 1;
		z-index: -1;
	}

	@container show-card (width > 600px) {
		.show-number {
			--max-font-size: 20cqw;
		}
	}

	.brand-footer {
		display: grid;
		grid-template-columns: auto auto;
		gap: 5rem;
		justify-content: center;
		align-items: center;
		margin-bottom: 4rem;
	}
	.logos {
		bottom: 10px;
		right: 10px;
		gap: 10px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		width: 100px;
		svg {
			display: block;
			width: 100%;
			height: auto;
		}
	}
</style>
