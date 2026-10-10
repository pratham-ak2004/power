<script lang="ts" module>
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Calendar } from '$lib/components/ui/calendar';
	import { ChevronDownIcon, Plus } from '@lucide/svelte';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { LayoutServerData } from '../../../routes/(meter)/$types';
	import { createBillSchema, type CreateBillSchema } from '$lib/zod';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';

	type Props = {
		meter: NonNullable<LayoutServerData['meter']>;
		form: SuperValidated<Infer<CreateBillSchema>>;
		formId: string;
		children?: Snippet;
		className?: string;
		variant?: ButtonVariant;
	};
</script>

<script lang="ts">
	const {
		meter,
		form: initialForm,
		formId,
		children,
		className,
		variant = 'default'
	}: Props = $props();

	let open = $state(false);
	let submitting = $state(false);
	let calendarOpen = $state(false);
	let isIcon = $derived(children ? false : true);
	let triggerClass = $derived(
		isIcon
			? buttonVariants({ variant: variant, size: 'icon' })
			: buttonVariants({ variant: variant })
	);

	const form = untrack(() =>
		superForm(
			{
				...initialForm,
				id: formId
			},
			{
				validators: zod4Client(createBillSchema),
				multipleSubmits: 'prevent',
				onSubmit: ({ formData, cancel }) => {
					const entries = Object.fromEntries(formData.entries());
					const billedOn = String(entries.billedOn);
					const result = createBillSchema.safeParse({
						...entries,
						previousReading: Number(entries.previousReading),
						currentReading: Number(entries.currentReading),
						total: Number(entries.total),
						payable: Number(entries.payable),
						billedOn: new Date(billedOn)
					});
					if (!result.success) {
						toast.error(result.error.issues[0].message ?? 'Failed to parse data');
						submitting = false;
						cancel();
					} else {
						submitting = true;
					}
				},
				onUpdate: ({ result }) => {
					submitting = false;
					if (result.type === 'failure') {
						toast.error(result.data['message']);
					} else {
						open = false;
						toast.success(result.data['form']['message']);
						form.reset({
							newState: {
								meterId: meter.id
							}
						});
					}
				}
			}
		)
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
		<span class="sr-only">Add bill</span>
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Add electricity bill</Dialog.Title>
			<Dialog.Description>
				Record the readings and amounts for <span class="font-semibold">{meter.name}</span>.
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="?/createBill" use:enhance class="space-y-5">
			<Form.Field {form} name="previousReading">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="previous-reading">Previous reading</Form.Label>
						<Input
							{...props}
							id="previous-reading"
							name="previousReading"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							bind:value={$formData.previousReading}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="currentReading">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="current-reading">Current reading</Form.Label>
						<Input
							{...props}
							id="current-reading"
							name="currentReading"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							bind:value={$formData.currentReading}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid gap-4 sm:grid-cols-2">
				<Form.Field {form} name="total">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label for="total">Total</Form.Label>
							<Input
								{...props}
								id="total"
								name="total"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								bind:value={$formData.total}
							/>
							<Form.Description>Total amount paid</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="payable">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label for="payable">Payable amount</Form.Label>
							<Input
								{...props}
								id="payable"
								name="payable"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								bind:value={$formData.payable}
							/>
							<Form.Description>Total bill amount</Form.Description>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field {form} name="billedOn">
				<Form.Control>
					<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
					{#snippet children({ props }: any)}
						<Input type="hidden" {...props} value={$formData.billedOn} name="billedOn" />
						<div>
							<div class="flex flex-col gap-3">
								<Form.Label for="date" class="px-1">Billed on</Form.Label>
								<Popover.Root bind:open={calendarOpen}>
									<Popover.Trigger name="date">
										{#snippet child({ props })}
											<Button
												{...props}
												variant="outline"
												class="justify-between font-normal"
												name="date"
											>
												{$formData.billedOn
													? $formData.billedOn.toLocaleDateString()
													: 'Select date'}
												<ChevronDownIcon />
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-auto overflow-hidden p-0" align="start">
										<Calendar
											type="single"
											value={new CalendarDate(
												$formData.billedOn.getFullYear(),
												$formData.billedOn.getMonth(),
												$formData.billedOn.getDate()
											)}
											onValueChange={(value) => {
												calendarOpen = false;
												const date = $formData.billedOn;
												if (value) {
													date.setFullYear(value.year);
													date.setMonth(value.month);
													date.setDate(value.day);
													$formData.billedOn = date;
												}
											}}
											isDateDisabled={(date: DateValue) => {
												const today = new Date();
												return (
													date.compare(
														new CalendarDate(today.getFullYear(), today.getMonth(), today.getDate())
													) > 0
												);
											}}
											captionLayout="dropdown"
										/>
									</Popover.Content>
								</Popover.Root>
							</div>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- HACK: set in HTML markup -->
			<Form.Field {form} name="meterId">
				<Form.Control>
					{#snippet children({ props })}
						<Input {...props} type="hidden" name="meterId" value={meter.id} />
					{/snippet}
				</Form.Control>
			</Form.Field>

			<Dialog.Footer>
				<Dialog.Close>
					<Button type="button" variant="outline">Cancel</Button>
				</Dialog.Close>
				<Form.Button disabled={submitting}>Add bill</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
