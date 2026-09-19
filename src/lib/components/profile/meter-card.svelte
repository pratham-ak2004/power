<script lang="ts">
	import { Gauge, Hash, Users } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import CreateMeterDialog from './create-meter-dialog.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import type { PageServerData } from '../../../routes/profile/$types';

	const { data }: { data: PageServerData } = $props();
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Meters</Card.Title>
		<Card.Description>List of all the meters</Card.Description>
		<Card.Action>
			<CreateMeterDialog form={data.form.createMeterForm} />
		</Card.Action>
	</Card.Header>
	<Card.Content class="pb-(--card-spacing)">
		{#if data.meters.length > 0}
			<div class="grid gap-3 md:grid-cols-2">
				{#each data.meters as userMeter (userMeter.meter.id)}
					<div class="rounded-lg border border-border/70 bg-muted/20 p-4">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<p
									class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>
									<Gauge class="size-3.5" />
									Meter
								</p>
								<h3 class="mt-1 truncate text-base font-semibold">{userMeter.meter.name}</h3>
							</div>
							{#if userMeter.creator}
								<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
									>Owner</span
								>
							{/if}
						</div>

						<dl class="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
							<div>
								<dt class="flex items-center gap-1.5 text-xs">
									<Hash class="size-3.5" />
									RR number
								</dt>
								<dd class="mt-1 truncate font-medium text-foreground">{userMeter.meter.rrNo}</dd>
							</div>
							<div>
								<dt class="flex items-center gap-1.5 text-xs">Start reading</dt>
								<dd class="mt-1 font-medium text-foreground">
									{userMeter.meter.startReading.toFixed(2)}
								</dd>
							</div>
						</dl>

						<div class="mt-4 border-t border-border/60 pt-3">
							<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Users class="size-3.5" />
								<span>
									{userMeter.meter.users.length === 0
										? 'No other users'
										: `${userMeter.meter.users.length} other user${userMeter.meter.users.length === 1 ? '' : 's'}`}
								</span>
							</div>
							{#if userMeter.meter.users.length > 0}
								<div class="group flex -space-x-2 pt-2">
									{#each userMeter.meter.users as member (member.userId)}
										<Avatar.Root>
											<Avatar.Image src={member.user.image} alt={member.user.name} />
											<Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
										</Avatar.Root>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center"
			>
				<div
					class="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"
				>
					<Gauge class="size-5" />
				</div>
				<h3 class="mt-3 font-semibold">No meters yet</h3>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					Create your first meter to start tracking readings and bills.
				</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
