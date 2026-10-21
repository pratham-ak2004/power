<script lang="ts" module>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { RotateCw } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { BillingContext, Heading, MeterPortfolio } from '$lib/components/home';
</script>

<script lang="ts">
	import { GlobalAnalyitics, MeterAnalytics } from '$lib/components/home';

	let { data }: { data: PageData } = $props();

	let selectedMeterId = $derived(data.selectedMeter);
	let meters = $derived(
		data.meters.map(({ meterId, meter }) => ({
			id: meterId,
			...meter
		}))
	);
	let selectedMeter = $derived(meters.find((meter) => meter.id === selectedMeterId) ?? meters[0]);

	let selectedReadings = $derived(selectedMeter?.readings ?? []);
	let currentReading = $derived(selectedReadings.at(-1)?.value ?? 0);
	let previousReading = $derived(selectedReadings.at(-2)?.value ?? currentReading);
	let periodUsage = $derived(Math.max(currentReading - previousReading, 0));
	let selectedBill = $derived(selectedMeter?.bills.at(-1));
	let meterCount = $derived(meters.length);
	let totalUsage = $derived(
		meters.reduce((sum, meter) => {
			const readings = meter.readings;
			return sum + Math.max((readings.at(-1)?.value ?? 0) - (readings[0]?.value ?? 0), 0);
		}, 0)
	);
</script>

<svelte:head>
	<title>Energy overview | Power</title>
	<meta name="description" content="A clear view of meter readings, usage, and bills." />
</svelte:head>

{#if !meterCount}
	<section class="flex min-h-[70vh] items-center justify-center py-16">
		<Card.Root class="w-full max-w-lg">
			<Card.Header>
				<Card.Title>No meters connected</Card.Title>
				<Card.Description>Add a meter to see readings and billing analytics here.</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href="/profile">Add a meter</Button>
			</Card.Footer>
		</Card.Root>
	</section>
{:else if selectedMeter}
	<div class="space-y-7 pt-8 pb-12 sm:pt-12">
		<Heading />
		<GlobalAnalyitics
			{meterCount}
			{totalUsage}
			billTotal={meters.reduce((sum, meter) => sum + (meter.bills.at(-1)?.total ?? 0), 0)}
		/>

		<section class="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
			<MeterAnalytics
				selectedBill={selectedBill ?? null}
				{selectedMeter}
				{selectedReadings}
				{currentReading}
				{periodUsage}
			/>

			<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
				<MeterPortfolio selectedMeterId={selectedMeterId ?? ''} {meters} />
				<BillingContext
					selectedMeterName={selectedMeter.name ?? ''}
					selectedBill={selectedBill ?? null}
				/>
			</div>
		</section>
	</div>
{/if}
