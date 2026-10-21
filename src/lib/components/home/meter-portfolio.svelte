<script lang="ts" module>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { RouteId } from '$app/types';
	import * as Card from '$lib/components/ui/card';
	import { formatNumber } from '$lib/utils';
	import { ArrowUpRight } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type Props = {
		selectedMeterId: string;
		meters: Array<{
			id: string;
			name: string;
			readings: Array<{
				value: number;
			}>;
		}>;
	};

	async function handleChangeMeter(meterId: string) {
		window.cookieStore.set('meter', meterId);
		const searchParams = new SvelteURLSearchParams();
		searchParams.set('meter', meterId);
		await goto(resolve(`${page.url.pathname}?${searchParams.toString()}` as RouteId), {
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<script lang="ts">
	let { meters, selectedMeterId }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Description>Meter portfolio</Card.Description>
		<Card.Title>All meters</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-2">
		{#each meters as meter (meter.id)}
			<button
				type="button"
				class="flex min-h-14 w-full items-center justify-between rounded-md border px-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {meter.id ===
				selectedMeterId
					? 'border-primary bg-primary/5'
					: ''}"
				onclick={async () => {
					await handleChangeMeter(meter.id);
				}}
				aria-pressed={meter.id === selectedMeterId}
			>
				<span>
					<span class="block text-sm font-medium">{meter.name}</span>
					<span class="block text-xs text-muted-foreground"
						>{formatNumber(meter.readings.at(-1)?.value ?? 0)} current</span
					>
				</span>
				<ArrowUpRight class="size-4 text-muted-foreground" aria-hidden="true" />
			</button>
		{/each}
	</Card.Content>
</Card.Root>
