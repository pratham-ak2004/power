<script lang="ts" module>
	import * as Card from '$lib/components/ui/card';
	import { formatCurrency, formatNumber } from '$lib/utils';
	import { Chart } from '.';

	type Props = {
		selectedMeter: {
			name: string;
			rrNo: string;
		};
		selectedBill: {
			total: number;
		} | null;
		selectedReadings: Array<{
			readAt: Date;
			value: number;
		}>;
		currentReading: number;
		periodUsage: number;
	};
</script>

<script lang="ts">
	let { selectedMeter, selectedBill, currentReading, periodUsage, selectedReadings }: Props =
		$props();
</script>

<Card.Root class="overflow-hidden">
	<Card.Header class="gap-4 border-b sm:flex-row sm:items-start sm:justify-between">
		<div>
			<Card.Description>Meter analytics</Card.Description>
			<Card.Title class="mt-1 text-2xl">{selectedMeter.name}</Card.Title>
			<p class="mt-1 text-xs text-muted-foreground">RR number {selectedMeter.rrNo}</p>
		</div>
	</Card.Header>
	<Card.Content class="space-y-6">
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<p class="text-sm text-muted-foreground">Current reading</p>
				<p class="mt-1 text-2xl font-semibold">{formatNumber(currentReading)}</p>
			</div>
			<div>
				<p class="text-sm text-muted-foreground">Period usage</p>
				<p class="mt-1 text-2xl font-semibold">
					{formatNumber(periodUsage)}
					<span class="text-sm font-normal text-muted-foreground">units</span>
				</p>
			</div>
			<div>
				<p class="text-sm text-muted-foreground">Latest bill</p>
				<p class="mt-1 text-2xl font-semibold">{formatCurrency(selectedBill?.total ?? 0)}</p>
			</div>
		</div>

		<div class="rounded-lg border bg-muted/30 p-4">
			{#if selectedReadings.length}
				<Chart data={selectedReadings} />
			{:else}
				<div class="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
					No readings recorded for this meter.
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
