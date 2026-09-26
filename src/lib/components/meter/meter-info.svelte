<script lang="ts" module>
	import * as Card from '$lib/components/ui/card';
	import { Activity, Gauge, Hash } from '@lucide/svelte';
	import type { LayoutServerData } from '../../../routes/(meter)/$types';

	import { CreateReadingDialog } from '../reading';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { CreateReadingSchema } from '$lib/zod';

	type Props = {
		meter: LayoutServerData['meter'];
		latestReading: string | null;
		form: SuperValidated<Infer<CreateReadingSchema>>;
	};
</script>

<script lang="ts">
	const { meter, latestReading, form }: Props = $props();
</script>

{#if meter}
	<Card.Root size="sm" class="mt-4">
		<Card.Header class="pb-3">
			<Card.Title class="flex items-center gap-2 text-base">
				<Activity class="size-4 text-primary" />
				{meter.name}
			</Card.Title>
			<Card.Description>Selected meter details</Card.Description>
			<Card.Action>
				<CreateReadingDialog {meter} {form} formId="create-reading-form" />
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
				<div>
					<dt class="flex items-center gap-1 text-xs text-muted-foreground">
						<Hash class="size-3" /> RR number
					</dt>
					<dd class="mt-1 font-medium">{meter.rrNo}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">Start reading</dt>
					<dd class="mt-1 font-medium">{meter.startReading.toFixed(2)}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">Latest reading</dt>
					<dd class="mt-1 font-medium">
						{latestReading ?? 'Not recorded'}
					</dd>
				</div>
			</dl>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root size="sm" class="mt-4">
		<Card.Content class="flex flex-col items-center justify-center py-10 text-center">
			<Gauge class="size-8 text-muted-foreground" />
			<h2 class="mt-3 font-semibold">Select a meter to perform any action</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Choose a meter from the dropdown above to continue.
			</p>
		</Card.Content>
	</Card.Root>
{/if}
