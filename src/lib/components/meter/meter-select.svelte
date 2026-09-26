<script lang="ts" module>
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '../ui/button';
	import type { LayoutServerData } from '../../../routes/(meter)/$types';
	import { CheckIcon, ChevronsUpDownIcon } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type Props = {
		meters: NonNullable<LayoutServerData['meters']>;
		meter: LayoutServerData['meter'];
	};
</script>

<script lang="ts">
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const { meter, meters }: Props = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Card.Root size="sm">
	<Card.Header>
		<Card.Title>Select a meter</Card.Title>
		<Card.Description>Choose a meter to view its details</Card.Description>
		<Card.Action>
			<Popover.Root bind:open>
				<Popover.Trigger bind:ref={triggerRef}>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							class="w-50 justify-between"
							role="combobox"
							aria-expanded={open}
						>
							{meter?.name || 'Select a meter...'}
							<ChevronsUpDownIcon class="opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-50 p-0">
					<Command.Root value={meter?.id ?? ''}>
						<Command.Input placeholder="Search meter..." />
						<Command.List>
							<Command.Empty>No meter found.</Command.Empty>
							<Command.Group value="meter">
								{#each meters as m (m.meterId)}
									<Command.Item
										class="flex flex-row flex-nowrap justify-between"
										value={m.meterId}
										onSelect={async () => {
											closeAndFocusTrigger();

											window.cookieStore.set('meter', m.meterId);

											const searchParams = new SvelteURLSearchParams();
											searchParams.set('meter', m.meterId);
											await goto(
												resolve(`${page.url.pathname}?${searchParams.toString()}` as RouteId),
												{
													keepFocus: true,
													noScroll: true
												}
											);
										}}
									>
										<CheckIcon class={meter?.id === m.meterId ? 'opacity-100' : 'opacity-0'} />
										<span class="flex-1 truncate">
											{m.meter.name}
										</span>
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</Card.Action>
	</Card.Header>
</Card.Root>
