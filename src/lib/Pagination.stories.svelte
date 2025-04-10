<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Pagination from './Pagination.svelte';

	const { Story } = defineMeta({
		title: 'Content/Pagination',
		component: Pagination,
		parameters: {
			query: {
				page: 2
			}
		}
	});
</script>

<Story name="Default" args={{ count: 200, perPage: 10, page: 1 }} />
