<script lang="ts" module>
	import * as Card from '$lib/components/ui/card';
	import { formatCurrency, formatNumber } from '$lib/utils';

	type Props = {
		meterCount: number;
		totalUsage: number;
		billTotal: number;
	};
</script>

<script>
	let { meterCount, totalUsage, billTotal }: Props = $props();
</script>

<section class="grid gap-3 sm:grid-cols-3" aria-label="Portfolio summary">
	<Card.Root class="bg-primary text-primary-foreground">
		<Card.Header class="pb-1">
			<Card.Description class="text-primary-foreground/75">Connected meters</Card.Description>
			<Card.Title class="text-3xl">{meterCount}</Card.Title>
		</Card.Header>
		<Card.Content class="text-sm text-primary-foreground/80">Across your account</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header class="pb-1">
			<Card.Description>Total usage this period</Card.Description>
			<Card.Title class="text-3xl"
				>{formatNumber(totalUsage)}
				<span class="text-base font-normal text-muted-foreground">units</span></Card.Title
			>
		</Card.Header>
		<Card.Content class="text-sm text-muted-foreground"
			>From the first to latest reading</Card.Content
		>
	</Card.Root>
	<Card.Root>
		<Card.Header class="pb-1">
			<Card.Description>Latest bill total</Card.Description>
			<Card.Title class="text-3xl">
				{formatCurrency(billTotal)}
			</Card.Title>
		</Card.Header>
		<Card.Content class="text-sm text-muted-foreground">Across all meters</Card.Content>
	</Card.Root>
</section>
