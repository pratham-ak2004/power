<script lang="ts" module>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { LogOut } from '@lucide/svelte';
</script>

<script lang="ts">
	const { class: className }: { class?: string } = $props();
</script>

<form
	class={cn(className)}
	method="post"
	action="?/signOut"
	use:enhance={() => {
		return async ({ update }) => {
			await update();
			await invalidateAll();
		};
	}}
>
	<button class={buttonVariants({ variant: 'destructive', size: 'lg', class: 'cursor-pointer' })}
		><LogOut /></button
	>
</form>
