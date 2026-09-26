<script lang="ts" module>
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
	import { ChevronDownIcon, Plus } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { createReadingSchema, type CreateReadingSchema } from '$lib/zod';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import type { PageServerData } from '../../../routes/reading/$types';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarDate } from '@internationalized/date';

	type Props = {
		formId: string;
		meter: NonNullable<PageServerData['meter']>;
		children?: Snippet;
		className?: string;
		variant?: ButtonVariant;
		form: SuperValidated<Infer<CreateReadingSchema>>;
	};
</script>

<script lang="ts">
	const {
		meter,
		children,
		className,
		variant = 'default',
		form: initialForm,
		formId
	}: Props = $props();

	let open = $state(false);
	let submitting = $state(false);
	let isIcon = $derived(children ? false : true);
	let calendarOpen = $state(false);
	let triggerClass = $derived(
		isIcon
			? buttonVariants({ variant: variant, size: 'icon' })
			: buttonVariants({ variant: variant })
	);

	const form = superForm(
		{
			...initialForm,
			id: formId
		},
		{
			validators: zod4Client(createReadingSchema),
			multipleSubmits: 'prevent',
			onSubmit: () => {
				submitting = true;
			},
			onUpdate: ({ result }) => {
				submitting = false;
				if (result.type === 'failure') {
					toast.error(result.data['message']);
				} else {
					open = false;
					toast.message(result.data['form']['message']);
					form.reset({
						newState: {
							meterId: meter.id,
							readAt: new Date()
						}
					});
				}
			}
		}
	);
	const { form: formData, enhance } = form;
	$effect(() => {
		$formData.meterId = meter.id;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={cn(triggerClass, className)}>
		{#if children}
			{@render children?.()}
		{:else}
			<Plus />
		{/if}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				Add reading for <span class="font-semibold">{meter.name}</span> meter
			</Dialog.Description>

			<form method="POST" action="?/createReading" use:enhance>
				<Form.Field {form} name="reading">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Form.Label for="reading">Reading <span class="text-destructive">*</span></Form.Label>
							<Input
								{...props}
								name="reading"
								type="number"
								bind:value={$formData.reading}
								placeholder="Home"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="readAt">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Input type="hidden" value={$formData.readAt} name="readAt" />
							<div class="flex gap-4">
								<div class="flex flex-col gap-3">
									<Form.Label for="date" class="px-1">Date</Form.Label>
									<Popover.Root bind:open={calendarOpen}>
										<Popover.Trigger name="date">
											{#snippet child({ props })}
												<Button
													{...props}
													variant="outline"
													class="w-32 justify-between font-normal"
													name="date"
												>
													{$formData.readAt ? $formData.readAt.toLocaleDateString() : 'Select date'}
													<ChevronDownIcon />
												</Button>
											{/snippet}
										</Popover.Trigger>
										<Popover.Content class="w-auto overflow-hidden p-0" align="start">
											<Calendar
												type="single"
												value={new CalendarDate(
													$formData.readAt.getFullYear(),
													$formData.readAt.getMonth(),
													$formData.readAt.getDate()
												)}
												onValueChange={(value) => {
													calendarOpen = false;
													console.log(value);
													const date = $formData.readAt;
													if (value) {
														date.setFullYear(value.year);
														date.setMonth(value.month);
														date.setDate(value.day);
														$formData.readAt = date;
													}
												}}
												captionLayout="dropdown"
											/>
										</Popover.Content>
									</Popover.Root>
								</div>
								<div class="flex flex-col gap-3">
									<Form.Label for="time" class="px-1">Time</Form.Label>
									<Input
										{...props}
										type="time"
										name="time"
										id="time"
										step="1"
										value={$formData.readAt.toTimeString().slice(0, 8)}
										oninput={(event) => {
											const [hours, minutes, seconds = 0] = event.currentTarget.value
												.split(':')
												.map(Number);
											const date = $formData.readAt;
											date.setHours(hours, minutes, seconds);
											$formData.readAt = date;
										}}
										class="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
									/>
								</div>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<!-- HACK: set programatically -->
				<Form.Field {form} name="meterId">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Input {...props} type="hidden" value={meter.id} />
						{/snippet}
					</Form.Control>
				</Form.Field>
				<Form.Button disabled={submitting}>Submit</Form.Button>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
