<script lang="ts" module>
	import { BillList } from '$lib/components/bills';
	import type { LayoutServerData } from '../$types';

	type Props = {
		data: LayoutServerData;
	};
</script>

<script lang="ts">
	const { data }: Props = $props();

	let meters = $derived(data.meters);
</script>

<svelte:head>
	<title>Bills | Power</title>
</svelte:head>

{#if meters.length > 0}
	<BillList form={data.forms.createBillForm} bills={data.meter?.bills ?? []} meter={data.meter} />
{/if}
