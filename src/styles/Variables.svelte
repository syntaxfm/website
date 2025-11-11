<script lang="ts">
	import variables from './variables.css?raw';

	interface Variable {
		name: string;
		value: string;
	}

	interface VariableSection {
		title: string;
		variables: Variable[];
		subsections?: Record<
			string,
			{
				title: string;
				variables: Variable[];
				subgroups?: Record<
					string,
					{
						title: string;
						variables: Variable[];
					}
				>;
			}
		>;
	}

	// Parse variables into categories
	const parseVariables = (css: string) => {
		const matches = Array.from(css.matchAll(/--([^:]+):\s*([^;]+);/g));
		const sections: Record<string, VariableSection> = {};

		let currentSection = '';
		let currentSubsection = '';
		let currentSubgroup = '';
		let currentSectionVars: Variable[] = [];

		// First pass: collect all variables and their section context
		css.split('\n').forEach((line) => {
			const mainSection = line.match(/\/\*\s+([A-Z][A-Z\s]+[A-Z])\s+\*\//);
			const subsection = line.match(/\/\*\s+([A-Z][a-z][\w\s]+)\s+\*\//);
			const subgroup = line.match(/\/\*\*\s+([^*]+)\s+\*\*\//);
			const varMatch = line.match(/--([^:]+):\s*([^;]+);/);

			if (mainSection) {
				// If we find a new main section, store the previous section's variables
				if (currentSection && currentSectionVars.length) {
					if (!sections[currentSection]) {
						sections[currentSection] = {
							title: currentSection,
							variables: [],
							subsections: {}
						};
					}
					sections[currentSection].variables.push(...currentSectionVars);
					currentSectionVars = [];
				}
				currentSection = mainSection[1];
				currentSubsection = '';
				currentSubgroup = '';
			} else if (subsection && currentSection) {
				currentSubsection = subsection[1];
				currentSubgroup = '';
			} else if (subgroup && currentSection && currentSubsection) {
				currentSubgroup = subgroup[1];
			} else if (varMatch) {
				const [_, name, value] = varMatch;
				const variable = { name: `--${name}`, value: value.trim() };

				if (currentSubgroup && currentSubsection) {
					if (!sections[currentSection]) {
						sections[currentSection] = {
							title: currentSection,
							variables: [],
							subsections: {}
						};
					}
					if (!sections[currentSection].subsections![currentSubsection]) {
						sections[currentSection].subsections![currentSubsection] = {
							title: currentSubsection,
							variables: [],
							subgroups: {}
						};
					}
					if (
						!sections[currentSection].subsections![currentSubsection].subgroups![currentSubgroup]
					) {
						sections[currentSection].subsections![currentSubsection].subgroups![currentSubgroup] = {
							title: currentSubgroup,
							variables: []
						};
					}
					sections[currentSection].subsections![currentSubsection].subgroups![
						currentSubgroup
					].variables.push(variable);
				} else if (currentSubsection) {
					if (!sections[currentSection]) {
						sections[currentSection] = {
							title: currentSection,
							variables: [],
							subsections: {}
						};
					}
					if (!sections[currentSection].subsections![currentSubsection]) {
						sections[currentSection].subsections![currentSubsection] = {
							title: currentSubsection,
							variables: [],
							subgroups: {}
						};
					}
					sections[currentSection].subsections![currentSubsection].variables.push(variable);
				} else if (currentSection) {
					currentSectionVars.push(variable);
				}
			}
		});

		// Add any remaining variables to their section
		if (currentSection && currentSectionVars.length) {
			if (!sections[currentSection]) {
				sections[currentSection] = {
					title: currentSection,
					variables: [],
					subsections: {}
				};
			}
			sections[currentSection].variables.push(...currentSectionVars);
		}

		return sections;
	};

	const categorizedVars = parseVariables(variables);

	// Custom media queries (breakpoints)
	const breakpoints = Array.from(
		variables.matchAll(/@custom-media\s+--([^(]+)\s*\(([^)]+)\);/g)
	).map(([_, name, condition]) => ({
		name: `--${name}`,
		condition
	}));
</script>

<div class="variables-display">
	{#if breakpoints.length}
		<section>
			<h2>Breakpoints</h2>
			<div class="breakpoints">
				{#each breakpoints as { name, condition }}
					<div class="breakpoint">
						<code>{name}</code>
						<span>{condition}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#each Object.entries(categorizedVars) as [sectionKey, section]}
		<section class="main-section">
			<h2>{section.title}</h2>
			{#if section.variables.length}
				<div>
					{#if section.title === 'COLORS'}
						<div class="var-grid">
							{#each section.variables as variable}
								<div class="var-box color-box" style:background="var({variable.name})">
									<span class="color-name">{variable.name}</span>
								</div>
							{/each}
						</div>
					{:else if section.title === 'TYPOGRAPHY'}
						<div class="typography-list">
							{#each section.variables as variable}
								<div class="typography-item">
									<code>{variable.name}</code>
									{#if variable.name.startsWith('--fs')}
										<p style:font-size="var({variable.name})">
											The quick brown fox jumps over the lazy dog
										</p>
									{:else if variable.name.startsWith('--fv')}
										<p style:font-variation-settings="var({variable.name})">
											The quick brown fox jumps over the lazy dog
										</p>
									{:else}
										<span class="var-value">{variable.value}</span>
									{/if}
								</div>
							{/each}
						</div>
					{:else if section.title === 'SHADOWS'}
						<div class="var-grid">
							{#each section.variables as variable}
								<div class="var-box shadow-box" style:box-shadow="var({variable.name})">
									<span class="var-name">{variable.name}</span>
								</div>
							{/each}
						</div>
					{:else if section.title === 'BORDERS'}
						<div class="var-grid">
							{#each section.variables as variable}
								<div class="var-box border-box" style:border="var({variable.name})">
									<span class="var-name">{variable.name}</span>
								</div>
							{/each}
						</div>
					{:else if section.title === 'BORDER RADIUS'}
						<div class="var-grid">
							{#each section.variables as variable}
								<div
									class="var-box radius-box"
									style:border-radius="var({variable.name})"
									style:background-color="var(--c-bg)"
								>
									<span class="var-name">{variable.name}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="var-grid">
							{#each section.variables as variable}
								<div class="var-box">
									<span class="var-name">{variable.name}</span>
									<span class="var-value">{variable.value}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if section.subsections}
				{#each Object.entries(section.subsections) as [subsectionKey, subsection]}
					<section class="subsection">
						<h3>{subsection.title}</h3>
						<div>
							{#if section.title === 'COLORS'}
								<div class="var-grid">
									{#each subsection.variables as variable}
										<div class="var-box color-box" style:background="var({variable.name})">
											<span class="color-name">{variable.name}</span>
										</div>
									{/each}
								</div>
							{:else if section.title === 'TYPOGRAPHY'}
								<div class="typography-list">
									{#each subsection.variables as variable}
										<div class="typography-item">
											<code>{variable.name}</code>
											{#if variable.name.startsWith('--fs')}
												<p style:font-size="var({variable.name})">
													The quick brown fox jumps over the lazy dog
												</p>
											{:else if variable.name.startsWith('--fv')}
												<p style:font-variation-settings="var({variable.name})">
													The quick brown fox jumps over the lazy dog
												</p>
											{:else}
												<span class="var-value">{variable.value}</span>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="var-grid">
									{#each subsection.variables as variable}
										<div class="var-box">
											<span class="var-name">{variable.name}</span>
											<span class="var-value">{variable.value}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						{#if subsection.subgroups}
							{#each Object.entries(subsection.subgroups) as [groupKey, group]}
								<section class="subgroup">
									<h4>{group.title}</h4>
									<div>
										{#if section.title === 'COLORS'}
											<div class="var-grid">
												{#each group.variables as variable}
													<div class="var-box color-box" style:background="var({variable.name})">
														<span class="color-name">{variable.name}</span>
													</div>
												{/each}
											</div>
										{:else if section.title === 'TYPOGRAPHY'}
											<div class="typography-list">
												{#each group.variables as variable}
													<div class="typography-item">
														<code>{variable.name}</code>
														{#if variable.name.startsWith('--fs')}
															<p style:font-size="var({variable.name})">
																The quick brown fox jumps over the lazy dog
															</p>
														{:else if variable.name.startsWith('--fv')}
															<p style:font-variation-settings="var({variable.name})">
																The quick brown fox jumps over the lazy dog
															</p>
														{:else}
															<span class="var-value">{variable.value}</span>
														{/if}
													</div>
												{/each}
											</div>
										{:else}
											<div class="var-grid">
												{#each group.variables as variable}
													<div class="var-box">
														<span class="var-name">{variable.name}</span>
														<span class="var-value">{variable.value}</span>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								</section>
							{/each}
						{/if}
					</section>
				{/each}
			{/if}
		</section>
	{/each}
</div>

<style>
	.variables-display {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	section {
		margin-bottom: 2rem;
	}

	.breakpoints {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.breakpoint {
		display: flex;
		gap: 1rem;
		font-family: var(--ff-body);
	}

	.var-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.var-box,
	.color-box,
	.shadow-box,
	.border-box,
	.radius-box {
		height: 100px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--c-fg);
		border-radius: var(--br-small);
		position: relative;
		overflow: hidden;
		padding: 0.5rem;
		text-align: center;
	}

	.color-box {
		padding: 0;
	}

	.shadow-box {
		background: var(--c-bg);
	}

	.var-name,
	.color-name {
		font-size: var(--fs-1);
		margin-bottom: 0.5rem;
	}

	.color-name {
		background: var(--c-tint-or-shade-hard);
		padding: 0.25rem 0.5rem;
		color: var(--c-bg);
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		margin: 0;
	}

	.var-value {
		font-size: var(--fs-1);
		color: var(--c-tint-or-shade-hard);
	}

	.typography-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.typography-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.typography-item code {
		font-size: var(--fs-1);
		color: var(--c-tint-or-shade-hard);
	}

	.typography-item p {
		margin: 0;
		font-family: var(--ff-body);
	}

	.main-section {
		margin-bottom: 3rem;
	}

	.subsection {
		margin: 2rem 0;
	}

	.subgroup {
		margin: 1rem 0;
	}

	h2 {
		font-size: var(--fs-2);
		margin-bottom: 1.5rem;
	}

	h3 {
		font-size: var(--fs-3);
		margin-bottom: 1rem;
	}

	h4 {
		font-size: var(--fs-4);
		margin-bottom: 0.75rem;
	}
</style>
