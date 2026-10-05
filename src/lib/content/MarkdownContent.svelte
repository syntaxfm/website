<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		is_heading_tag,
		is_plain_tag,
		is_site_path,
		safe_fragment_id,
		safe_href,
		type ContentNode,
		type ContentTree
	} from './content_tree';

	// `content` comes from `markdown_to_content` on the server. Tags and URLs are checked again here
	// so the component stays safe even if it is handed a tree from somewhere else.
	let { content }: { content: ContentTree } = $props();
</script>

<!-- Svelte trims template whitespace at the edges of blocks and elements, so this markup adds no
text nodes: the only text rendered is the content's own. -->
{#snippet render_nodes(nodes: ContentNode[])}
	<!-- Content nodes have no identity of their own and never reorder; position is the key. -->
	{#each nodes as node, index (index)}
		{@render render_node(node)}
	{/each}
{/snippet}

{#snippet render_node(node: ContentNode)}
	{#if node.kind === 'text'}
		{node.value}
	{:else if node.kind === 'plain' && is_plain_tag(node.tag)}
		<svelte:element this={node.tag}>
			{@render render_nodes(node.children)}
		</svelte:element>
	{:else if node.kind === 'heading' && is_heading_tag(node.tag)}
		<svelte:element this={node.tag} id={safe_fragment_id(node.id)}>
			{@render render_nodes(node.children)}
		</svelte:element>
	{:else if node.kind === 'link'}
		{@const aria_hidden = node.aria_hidden ? 'true' : undefined}
		{@const tabindex = node.tab_index === -1 ? -1 : undefined}
		{#if node.target.type === 'fragment'}
			<a href="#{node.target.fragment}" aria-hidden={aria_hidden} {tabindex}>
				{@render render_nodes(node.children)}
			</a>
		{:else if node.target.type === 'site_path' && is_site_path(node.target.path)}
			<a href={resolve(node.target.path)} aria-hidden={aria_hidden} {tabindex}>
				{@render render_nodes(node.children)}
			</a>
		{:else if node.target.type === 'external' && safe_href(node.target.url)}
			<a href={node.target.url} rel="external" aria-hidden={aria_hidden} {tabindex}>
				{@render render_nodes(node.children)}
			</a>
		{:else}
			{@render render_nodes(node.children)}
		{/if}
	{:else if node.kind === 'anchor'}
		<span id={safe_fragment_id(node.id)}>
			{@render render_nodes(node.children)}
		</span>
	{:else if node.kind === 'ordered_list'}
		<ol start={node.start}>
			{@render render_nodes(node.children)}
		</ol>
	{:else if node.kind === 'styled_inline' && node.tag === 'code'}
		<code class={node.class_name}>
			{@render render_nodes(node.children)}
		</code>
	{:else if node.kind === 'styled_inline' && node.tag === 'span'}
		<span class={node.class_name}>
			{@render render_nodes(node.children)}
		</span>
	{:else if node.kind === 'cell' && node.tag === 'td'}
		<td rowspan={node.row_span} colspan={node.col_span} align={node.align}>
			{@render render_nodes(node.children)}
		</td>
	{:else if node.kind === 'cell' && node.tag === 'th'}
		<th rowspan={node.row_span} colspan={node.col_span} align={node.align}>
			{@render render_nodes(node.children)}
		</th>
	{:else if node.kind === 'line_break'}
		<br />
	{:else if node.kind === 'thematic_break'}
		<hr />
	{/if}
{/snippet}

{@render render_nodes(content)}
