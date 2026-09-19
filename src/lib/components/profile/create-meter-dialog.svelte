<script lang="ts" module>
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { createMeterSchema, type CreateMeterSchema } from '$lib/zod';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	type Props = {
		form: SuperValidated<Infer<CreateMeterSchema>>;
	};
</script>

<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Plus } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';

	let { form: initialForm }: Props = $props();

	const form = superForm(initialForm, {
		validators: zod4Client(createMeterSchema),
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
				toast.success(result.data['form']['message']);
				form.reset();
			}
		}
	});
	const { form: formData, enhance } = form;

	let open = $state(false);
	let submitting = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
		<Plus />
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create Meter</Dialog.Title>
			<Dialog.Description>Create a meter which you own.</Dialog.Description>

			<form method="POST" action="?/createMeter" use:enhance>
				<Form.Field {form} name="name">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Form.Label>Name <span class="text-destructive">*</span></Form.Label>
							<Input
								{...props}
								type="text"
								bind:value={$formData.name}
								placeholder="Home"
								class="capitalize"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="rrNo">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Form.Label>RR Number <span class="text-destructive">*</span></Form.Label>
							<Input {...props} type="text" class="uppercase" bind:value={$formData.rrNo} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="startReading">
					<Form.Control>
						<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
						{#snippet children({ props }: any)}
							<Form.Label>Start Reading</Form.Label>
							<Input
								{...props}
								type="number"
								bind:value={$formData.startReading}
								defaultValue={0}
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>The starting value when the meter is created</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button disabled={submitting}>Submit</Form.Button>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
