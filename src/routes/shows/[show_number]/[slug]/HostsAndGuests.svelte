<script lang="ts">
	import type { Guest } from '@prisma/client';

	import twitter from '$assets/twitter.svg';
	export let guests: Guest[];
</script>

<div class="guests-and-hosts">
	<h5>Hosted By:</h5>
	<div class="featuring">
		<figure>
			<img src={`https://github.com/wesbos.png`} alt="" />
			<figcaption>
				<p>Wes Bos</p>
				<div class="featuring_socials">
					<img class="social-icon" src={twitter} alt="" />
				</div>
			</figcaption>
		</figure>
		<figure>
			<img src={`https://github.com/stolinski.png`} alt="" />
			<figcaption>
				<p>Scott Tolinski</p>
				<div class="featuring_socials">
					<img class="social-icon" src={twitter} alt="" />
				</div>
			</figcaption>
		</figure>
	</div>
	{#if guests.length > 0}
		<h5>Featuring:</h5>
		<div class="featuring">
			{#each guests as guest}
				<figure>
					<img src={`https://github.com/${guest.github}.png`} alt="" />
					<figcaption>
						<p><a href={'/guests/' + guest.slug}>{guest.name}</a></p>
						<div class="featuring_socials">
							<img class="social-icon" src={twitter} alt="" />
						</div>
					</figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	.guests-and-hosts {
		margin: 2rem 0;
		grid-column: start/end;
	}

	figure {
		display: grid;
		gap: 20px;
		grid-template-columns: 70px 1fr;
		margin: 0;
	}

	figure img {
		width: 100%;
		border-radius: 4px;
	}

	h5 {
		font-weight: 600;
		font-style: italic;
		opacity: 0.8;
		margin: 3rem 0 1rem;
	}

	.featuring {
		display: flex;
		gap: 20%;
		margin-bottom: 2rem;
	}

	figcaption p {
		margin: 0;
		margin-bottom: 0.5rem;
	}

	.social-icon {
		width: 20px;
	}
</style>
