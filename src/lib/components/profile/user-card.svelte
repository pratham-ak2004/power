<script lang="ts" module>
	import type { LayoutServerData } from '../../../routes/$types';

	type Props = {
		data: LayoutServerData;
	};
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Signout from './signout.svelte';

	const { data }: Props = $props();
	let user = $derived(data.user);
</script>

{#if user}
	<Card.Root>
		<Card.Header class="flex flex-row items-center space-x-6">
			<img src={user.image ?? '/default-profile.png'} alt="profile" class="size-20 rounded-full" />
			<div class="flex h-full w-full flex-1 flex-col justify-between gap-2 sm:flex-row">
				<div>
					<Card.Title>{user.name}</Card.Title>
					<Card.Description>{user.email}</Card.Description>
				</div>
				<Signout />
			</div>
		</Card.Header>
	</Card.Root>
{/if}
