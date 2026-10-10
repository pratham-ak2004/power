<script lang="ts" module>
	import type { LayoutServerData } from '../../../routes/(meter)/$types';
	import * as Card from '$lib/components/ui/card';
	import { CreateReadingDialog } from '.';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { deleteReadingsSchema, type CreateReadingSchema } from '$lib/zod';
	import {
		columnFilteringFeature,
		columnVisibilityFeature,
		createFilteredRowModel,
		createPaginatedRowModel,
		createSortedRowModel,
		filterFn_includesString,
		rowPaginationFeature,
		rowSelectionFeature,
		rowSortingFeature,
		sortFn_alphanumeric,
		sortFn_text,
		tableFeatures,
		createColumnHelper
	} from '@tanstack/svelte-table';
	import { createTable, FlexRender } from '@tanstack/svelte-table';
	import * as Table from '$lib/components/ui/table';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		Search,
		Trash
	} from '@lucide/svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		readings: NonNullable<LayoutServerData['meter']>['readings'];
		meter: LayoutServerData['meter'];
		form: SuperValidated<Infer<CreateReadingSchema>>;
	};

	type Reading = Props['readings'][number];

	const features = tableFeatures({
		columnFilteringFeature,
		columnVisibilityFeature,
		rowPaginationFeature,
		rowSelectionFeature,
		rowSortingFeature,
		filteredRowModel: createFilteredRowModel(),
		paginatedRowModel: createPaginatedRowModel(),
		sortedRowModel: createSortedRowModel(),
		filterFns: { includesString: filterFn_includesString },
		sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text }
	});

	type DataTableFeatures = typeof features;
</script>

<script lang="ts">
	const { readings, meter, form }: Props = $props();

	const columnHelper = createColumnHelper<DataTableFeatures, Reading>();
	const columns = columnHelper.columns([
		columnHelper.display({
			id: 'select',
			enableSorting: false,
			enableHiding: false
		}),
		columnHelper.accessor('value', {
			header: 'Reading',
			filterFn: 'includesString'
		}),
		columnHelper.accessor('readAt', {
			header: 'Read On',
			cell: ({ getValue }) => {
				return getValue().toDateString();
			}
		}),
		columnHelper.accessor('createdAt', {
			header: 'Created On',
			cell: ({ getValue }) => {
				return getValue().toDateString();
			}
		})
	]);
	const table = createTable({
		features,
		get data() {
			return readings;
		},
		columns,
		getRowId: (row) => row.id
	});

	const pagination = $derived(table.atoms.pagination.get());
	let alertDialogOpen = $state(false);
	let alertDialogConfirmDisabled = $state(false);

	async function handleDeleteReadings() {
		if (!meter?.id) {
			toast.warning('Select a meter');
			return;
		}

		const selectedReadings = table.getSelectedRowIds();
		if (selectedReadings.length === 0) {
			toast.warning('No rows selected');
		}

		const ids = deleteReadingsSchema.safeParse({
			meterId: meter.id,
			ids: selectedReadings
		});
		if (!ids.success) {
			toast.error(ids.error.issues[0].message ?? 'Failed to parse data');
		}

		const formData = new FormData();

		formData.set('meterId', meter.id);
		ids.data?.ids.forEach((id) => {
			formData.append('ids', id);
		});

		const response = await fetch('/reading?/deleteReadings', {
			method: 'POST',
			body: formData
		});
		const data = (await response.json()) as { type: 'success' | 'failure' };

		if (data.type == 'success') {
			toast.success('Successfully deleted reading(s)');
			await invalidateAll();
		} else {
			toast.error('Failed to delete reading(s)');
		}
	}
</script>

<Card.Root size="sm" class="mt-4">
	<Card.Header class="pb-3">
		<Card.Title class="text-base">Reading history</Card.Title>
		<Card.Description
			>{readings.length} recorded {readings.length === 1 ? 'reading' : 'readings'}</Card.Description
		>
	</Card.Header>
	<Card.Content class="p-0">
		{#if readings.length > 0}
			<div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
				<div class="relative min-w-56 flex-1 sm:max-w-sm">
					<Search
						class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
					/>
					<Input
						class="pl-8"
						placeholder="Filter readings..."
						value={(table.getColumn('value')?.getFilterValue() as string) ?? ''}
						oninput={(event) => table.getColumn('value')?.setFilterValue(event.currentTarget.value)}
					/>
				</div>
				<details class="relative">
					<summary
						class="inline-flex h-9 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
					>
						Columns
					</summary>
					<div
						class="absolute right-0 z-10 mt-2 w-40 rounded-md border bg-popover p-2 text-sm shadow-md"
					>
						{#each table
							.getAllColumns()
							.filter((column) => column.getCanHide()) as column (column.id)}
							<label class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted">
								<input
									type="checkbox"
									checked={column.getIsVisible()}
									onchange={(event) => column.toggleVisibility(event.currentTarget.checked)}
								/>
								<span class="capitalize">{column.id === 'readAt' ? 'Read on' : 'Created on'}</span>
							</label>
						{/each}
					</div>
				</details>
				<AlertDialog.Root bind:open={alertDialogOpen}>
					<AlertDialog.Trigger
						class={buttonVariants({
							variant: 'destructive',
							size: 'icon'
						})}
						disabled={table.getSelectedRowIds().length === 0}><Trash /></AlertDialog.Trigger
					>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description>
								This action cannot be undone. This will permanently delete the selected readings
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action
								disabled={alertDialogConfirmDisabled}
								onclick={async () => {
									alertDialogConfirmDisabled = true;
									await handleDeleteReadings();
									alertDialogConfirmDisabled = false;
									alertDialogOpen = false;
								}}>Continue</AlertDialog.Action
							>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head
										colspan={header.colSpan}
										class={header.column.getCanSort()
											? 'cursor-pointer select-none hover:bg-muted/50'
											: ''}
										onclick={() => header.column.getCanSort() && header.column.toggleSorting()}
										aria-sort={header.column.getIsSorted() === 'asc'
											? 'ascending'
											: header.column.getIsSorted() === 'desc'
												? 'descending'
												: 'none'}
									>
										{#if !header.isPlaceholder}
											{#if header.column.id === 'select'}
												<Checkbox
													aria-label="select all readings"
													checked={table.getIsAllPageRowsSelected()}
													onCheckedChange={(value) => {
														table.toggleAllPageRowsSelected(value);
													}}
												/>
											{:else}
												<div class="flex items-center gap-2">
													<FlexRender {header} />
													{#if header.column.getIsSorted() === 'asc'}
														<ArrowUp class="size-3.5" aria-hidden="true" />
													{:else if header.column.getIsSorted() === 'desc'}
														<ArrowDown class="size-3.5" aria-hidden="true" />
													{:else if header.column.getCanSort()}
														<ArrowUpDown
															class="size-3.5 text-muted-foreground"
															aria-hidden="true"
														/>
													{/if}
												</div>
											{/if}
										{/if}
									</Table.Head>
								{/each}
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body>
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-state={row.getIsSelected() && 'selected'}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell>
										{#if cell.column.id === 'select'}
											<Checkbox
												aria-label="Select reading"
												checked={row.getIsSelected()}
												onCheckedChange={(value) => row.toggleSelected(value)}
											/>
										{:else}
											<FlexRender {cell} />
										{/if}
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center">
									No results.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
				<p class="text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows
						.length}
					selected
				</p>
				<div class="flex items-center gap-3">
					<!-- <label class="flex items-center gap-2 text-sm text-muted-foreground">
						<span class="sr-only">Rows per page</span>
						<select
							class="h-8 rounded-md border bg-background px-2 text-sm"
							value={pagination.pageSize}
							onchange={(event) => table.setPageSize(Number(event.currentTarget.value))}
						>
							<option value="5">5 / page</option>
							<option value="10">10 / page</option>
							<option value="20">20 / page</option>
						</select>
					</label> -->
					<span class="min-w-16 text-center text-sm text-muted-foreground">
						Page {pagination.pageIndex + 1} of {table.getPageCount()}
					</span>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Previous page"
						disabled={!table.getCanPreviousPage()}
						onclick={() => table.previousPage()}><ChevronLeft /></Button
					>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Next page"
						disabled={!table.getCanNextPage()}
						onclick={() => table.nextPage()}><ChevronRight /></Button
					>
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
				<div>
					<p class="font-medium">No readings yet</p>
					<p class="mt-1 text-sm text-muted-foreground">
						There are no recorded readings for this meter.
					</p>
				</div>
				{#if meter}
					<CreateReadingDialog
						{meter}
						{form}
						variant="secondary"
						formId="create-reading-when-empty-form">Add reading</CreateReadingDialog
					>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
