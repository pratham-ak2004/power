<script lang="ts" module>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ReceiptIndianRupee } from '@lucide/svelte';
	import { formatCurrency, formatDate } from '$lib/utils';

	type Props = {
		selectedMeterName: string;
		selectedBill: {
			billedOn: Date;
			total: number;
			payable: number;
		} | null;
	};
</script>

<script lang="ts">
	let { selectedMeterName, selectedBill }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Description>Billing context</Card.Description>
		<Card.Title>{selectedMeterName}</Card.Title>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="flex items-center justify-between text-sm">
			<span class="text-muted-foreground">Billed on</span>
			<span class="font-medium"
				>{selectedBill ? formatDate(selectedBill.billedOn) : 'Not billed'}</span
			>
		</div>
		<div class="flex items-center justify-between text-sm">
			<span class="text-muted-foreground">Amount paid</span>
			<span class="font-medium">{formatCurrency(selectedBill?.total ?? 0)}</span>
		</div>
		<Button variant="outline" class="w-full" href="/bills">
			<ReceiptIndianRupee class="size-4" aria-hidden="true" />
			View bills
		</Button>
	</Card.Content>
</Card.Root>
