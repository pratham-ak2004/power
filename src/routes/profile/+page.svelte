<script lang="ts" module>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { MeterCard, UserCard } from '$lib/components/profile';
	import { buttonVariants } from '$lib/components/ui/button';
	import { UserRound } from '@lucide/svelte';
	import type { LayoutServerData } from '../$types';
	import type { PageServerData } from './$types';

	type Props = {
		data: LayoutServerData & PageServerData;
	};
</script>

<script lang="ts">
	const { data }: Props = $props();

	let user = $derived(data.user);
</script>

<svelte:head>
	<title>{user?.name ?? 'Profile'} | Power</title>
</svelte:head>

{#if user}
	<div class="space-y-4 py-8">
		<div class="space-y-2">
			<div class="flex flex-row items-center gap-2">
				<UserRound class="size-6 text-primary" />
				<h1 class="text-3xl font-semibold tracking-tight">Profile</h1>
			</div>
		</div>
		<UserCard {data} />
		<MeterCard {data} />
	</div>
{:else}
	<form
		class="flex h-screen w-full items-center justify-center"
		method="post"
		action="?/signInSocial"
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				await invalidateAll();
			};
		}}
	>
		<button class={buttonVariants({ variant: 'default', size: 'lg' })}>Sign in with Google</button>
	</form>
{/if}
