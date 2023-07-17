<script lang="ts">
	import { prisma_client } from '../../../hooks.server';

	const is_on = 'on';
	prisma_client.show.findUnique({
		where: {
			number: 300
		}
	});
</script>

<div>
	<div class="text-container">
		<h1>{is_on}</h1>
	</div>
</div>

<style>
	h1 {
		color: green;
	}
	div {
		display: flex;
	}
</style>
