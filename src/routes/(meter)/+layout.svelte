<script lang="ts" module>
	import { ReceiptText, Zap } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutServerData as RootLayoutServerData } from '../$types';
	import type { LayoutServerData } from './$types';
	import { MeterSelect, MeterInfo, NoMeterAvailable } from '$lib/components/meter';
	import { page } from '$app/state';
	import { capitalize } from '$lib/utils';

	type Props = {
		data: LayoutServerData & RootLayoutServerData;
		children: Snippet;
	};
</script>

<script lang="ts">
	let { children, data }: Props = $props();

	let meters = $derived(data.meters);
	let readings = $derived(
		[...(data.meter?.readings ?? [])].sort(
			(first, second) => second.readAt.getTime() - first.readAt.getTime()
		)
	);
	let latestReading = $derived(readings.at(0));

	const route = $derived(page.url.pathname.substring(1, page.url.pathname.length));
</script>

<div class="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
	<div class="space-y-2">
		<div class="flex flex-row items-center gap-2">
			{#if route === 'reading'}
				<Zap class="size-6 text-primary" />
			{:else if route == 'bills'}
				<ReceiptText class="size-6 text-primary" />
			{/if}
			<h1 class="text-3xl font-semibold tracking-tight">
				{capitalize(route)}
			</h1>
		</div>
	</div>

	<section>
		{#if meters.length > 0}
			<MeterSelect meter={data.meter} {meters} />
			<MeterInfo
				meter={data.meter}
				latestReading={latestReading?.value.toFixed(2) ?? null}
				form={data.forms}
				{route}
			/>
			{@render children()}
		{:else}
			<NoMeterAvailable />
		{/if}
	</section>
</div>
