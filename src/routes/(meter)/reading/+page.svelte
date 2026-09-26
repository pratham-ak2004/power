<script lang="ts" module>
	import type { LayoutServerData } from '../$types';
	import { ReadingList } from '$lib/components/reading';

	type Props = {
		data: LayoutServerData;
	};
</script>

<script lang="ts">
	const { data }: Props = $props();

	let meters = $derived(data.meters);
	let readings = $derived(
		[...(data.meter?.readings ?? [])].sort(
			(first, second) => second.readAt.getTime() - first.readAt.getTime()
		)
	);
</script>

<svelte:head>
	<title>Readings | Power</title>
</svelte:head>

{#if meters.length > 0}
	<ReadingList {readings} meter={data.meter} form={data.forms.createReadingForm} />
{/if}
