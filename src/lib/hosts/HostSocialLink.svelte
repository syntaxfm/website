<script lang="ts">
	export let link: string;
	import twitter from '$assets/twitter.svg';
</script>

<a href={link}>
	<img class="social-icon" src={twitter} alt="Twitter Icon" />
</a>

<style>
	.social-icon {
		width: 20px;
	}
</style>
