<script lang="ts" module>
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import { Gauge, Plus } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
</script>

<Card.Root>
	<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
		<div class="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
			<Gauge class="size-5" />
		</div>
		<div class="flex flex-col">
			<h3 class="mt-3 font-semibold">No meters available</h3>
			<p class="mt-1 text-sm text-muted-foreground">Add a meter to start tracking readings.</p>
		</div>
		<a href={resolve('/profile')} class={buttonVariants({ variant: 'default' })}
			>Create Meter <Plus class="size-4" /></a
		>
	</Card.Content>
</Card.Root>
