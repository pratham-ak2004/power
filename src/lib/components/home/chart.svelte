<script lang="ts" module>
	import * as Chart from '$lib/components/ui/chart';
	import { BarChart, Highlight } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { ChevronLeft, ChevronRight, Gauge } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { cubicInOut } from 'svelte/easing';
	import { SvelteDate, SvelteMap } from 'svelte/reactivity';

	type Range = 'week' | 'month';

	type Props = {
		data: Array<{
			readAt: Date;
			value: number;
		}>;
	};

	const chartConfig = {
		usage: {
			label: 'Usage',
			color: 'var(--chart-4)'
		}
	} satisfies Chart.ChartConfig;

	const formatDateKey = (date: Date | string) => {
		const value = new Date(date);
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, '0');
		const day = String(value.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	function niceUpperBound(value: number, headroom = 0.1): number {
		if (!Number.isFinite(value) || value <= 0) return 1;
		const target = value * (1 + headroom);
		// HACK: needs testing for optimal magnitude
		const magnitude = 6 ** Math.floor(Math.log10(target));
		console.log(magnitude);
		const normalized = target / magnitude;
		const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
		return niceStep * magnitude;
	}
</script>

<script lang="ts">
	let { data }: Props = $props();
	let range = $state<Range>('week');
	let currentPage = $state(0);
	let today = $derived(new SvelteDate());

	let dailyUsage = $derived.by(() => {
		const readings = [...data].sort(
			(a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime()
		);
		const usageByDate = new SvelteMap<string, number>();

		readings.forEach((reading, index) => {
			const previousValue = readings[index - 1]?.value ?? reading.value;
			const usage = Math.max(reading.value - previousValue, 0);
			const dateKey = formatDateKey(reading.readAt);
			usageByDate.set(dateKey, (usageByDate.get(dateKey) ?? 0) + usage);
		});

		return [...usageByDate.entries()]
			.map(([dateKey, usage]) => {
				const date = new Date(`${dateKey}T00:00:00`);
				return { date, usage };
			})
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	});
	let pageSize = $derived(range === 'week' ? 7 : 30);
	let totalPages = $derived.by(() => {
		const earliestDate = dailyUsage[0]?.date;
		if (!earliestDate) return 1;

		const elapsedDays = Math.max(
			0,
			Math.floor((today.getTime() - earliestDate.getTime()) / 86_400_000)
		);
		return Math.floor(elapsedDays / pageSize) + 1;
	});

	let visibleChartData = $derived.by(() => {
		const end = new SvelteDate(today);
		end.setDate(end.getDate() - currentPage * pageSize);
		const start = new SvelteDate(end);
		start.setDate(start.getDate() - pageSize + 1);

		const usageByDate = new Map(
			dailyUsage.map((reading) => [formatDateKey(reading.date), reading.usage])
		);
		const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
		return Array.from({ length: days }, (_, index) => {
			const date = new SvelteDate(start);
			date.setDate(start.getDate() + index);
			return { date, usage: usageByDate.get(formatDateKey(date)) ?? 0 };
		});
	});

	let maxUsage = $derived(Math.max(...visibleChartData.map((reading) => reading.usage), 0));
	let yDomain = $derived([0, niceUpperBound(maxUsage)] as [number, number]);

	function changePage(direction: -1 | 1) {
		currentPage = Math.min(Math.max(currentPage + direction, 0), totalPages - 1);
	}
	function changeRange(nextRange: Range) {
		range = nextRange;
		currentPage = 0;
	}
</script>

<div class="space-y-4">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<p class="text-sm font-medium">Daily usage</p>
			<p class="text-xs text-muted-foreground">
				Units used on each day, shown in {range === 'week' ? '7-day' : '30-day'} windows
			</p>
		</div>
		<div class="flex flex-row items-center justify-center space-x-4">
			<label class="grid gap-1.5 text-xs font-medium">
				<span class="sr-only">Select chart range</span>
				<select
					value={range}
					onchange={(event) => changeRange(event.currentTarget.value as Range)}
					class="h-9 min-w-28 rounded-md border-input bg-background px-3 text-sm font-normal shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Select chart range"
				>
					<option value="week">Week</option>
					<option value="month">Month</option>
				</select>
			</label>
			<Gauge class="size-5 text-primary" aria-hidden="true" />
		</div>
	</div>

	{#if visibleChartData.length}
		<Chart.Container config={chartConfig} class="min-h-56 w-full">
			<BarChart
				data={visibleChartData}
				x="date"
				y="usage"
				xScale={scaleBand().padding(0.4)}
				{yDomain}
				axis="x"
				series={[
					{
						key: 'usage',
						label: chartConfig.usage.label,
						color: chartConfig.usage.color
					}
				]}
				props={{
					bars: {
						stroke: 'none',
						rounded: 'none',
						motion: { type: 'tween', duration: 500, easing: cubicInOut }
					},
					highlight: { area: { fill: 'none' } },
					xAxis: {
						format: (date: Date) =>
							date.toLocaleDateString('en-IN', {
								weekday: range === 'week' ? 'short' : undefined,
								month: range === 'month' ? 'short' : undefined,
								day: 'numeric'
							}),
						tickSpacing: 75
					}
				}}
			>
				{#snippet belowMarks()}
					<Highlight area={{ class: 'fill-muted' }} />
				{/snippet}
				{#snippet tooltip()}
					<Chart.Tooltip
						nameKey="usage"
						labelFormatter={(date: Date) =>
							date.toLocaleDateString('en-IN', {
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							})}
					/>
				{/snippet}
			</BarChart>
		</Chart.Container>
		{#if totalPages > 1}
			<div class="flex items-center justify-between gap-3 border-t pt-3">
				<p class="text-xs text-muted-foreground">
					{range === 'week' ? '7-day window' : '30-day window'}
					{currentPage + 1} of {totalPages}
				</p>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="size-9"
						disabled={currentPage === totalPages - 1}
						onclick={() => changePage(1)}
						aria-label="Show earlier dates"
					>
						<ChevronLeft class="size-4" aria-hidden="true" />
					</Button>
					<span class="min-w-16 text-center text-xs text-muted-foreground">
						{currentPage + 1} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="icon"
						class="size-9"
						disabled={currentPage === 0}
						onclick={() => changePage(-1)}
						aria-label="Show later dates"
					>
						<ChevronRight class="size-4" aria-hidden="true" />
					</Button>
				</div>
			</div>
		{/if}
	{:else}
		<div
			class="flex min-h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
		>
			No readings recorded for this range.
		</div>
	{/if}
</div>
