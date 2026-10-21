<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { CalendarDays } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let liveDate = $state<Date | null>(null);

	onMount(() => {
		liveDate = new Date();
	});
</script>

<header class="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<p class="mb-2 text-sm font-medium text-primary">Power overview</p>
		<h1 class="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
			Your energy, at a glance.
		</h1>
		<p class="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
			Compare current readings across every connected meter, then focus on one when you need detail.
		</p>
	</div>
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<CalendarDays class="size-4" aria-hidden="true" />
		<span>{liveDate ? formatDate(liveDate) : 'Loading date...'}</span>
	</div>
</header>
