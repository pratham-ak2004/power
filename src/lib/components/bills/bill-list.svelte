<script lang="ts" module>
	import {
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		ReceiptText,
		Search,
		Trash
	} from '@lucide/svelte';
	import type { LayoutServerData } from '../../../routes/(meter)/$types';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { CreateBillDialog } from '.';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { deleteBillsSchema, type CreateBillSchema } from '$lib/zod';
	import {
		columnFilteringFeature,
		columnVisibilityFeature,
		createColumnHelper,
		createFilteredRowModel,
		createPaginatedRowModel,
		createSortedRowModel,
		filterFn_includesString,
		rowPaginationFeature,
		rowSelectionFeature,
		rowSortingFeature,
		sortFn_alphanumeric,
		sortFn_text,
		tableFeatures
	} from '@tanstack/svelte-table';
	import { createTable, FlexRender } from '@tanstack/svelte-table';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		bills: NonNullable<LayoutServerData['meter']>['bills'];
		meter: LayoutServerData['meter'];
		form: SuperValidated<Infer<CreateBillSchema>>;
	};

	type Bill = Props['bills'][number];

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
	const { bills, meter, form }: Props = $props();

	const columnHelper = createColumnHelper<DataTableFeatures, Bill>();
	const columns = columnHelper.columns([
		columnHelper.display({
			id: 'select',
			enableSorting: false,
			enableHiding: false
		}),
		columnHelper.accessor('previousReading', {
			header: 'Previous reading',
			cell: ({ getValue }) => getValue().toFixed(2)
		}),
		columnHelper.accessor('currentReading', {
			header: 'Current reading',
			cell: ({ getValue }) => getValue().toFixed(2)
		}),
		columnHelper.accessor((bill) => Math.max(0, bill.currentReading - bill.previousReading), {
			id: 'usage',
			header: 'Usage',
			cell: ({ getValue }) => getValue().toFixed(2)
		}),
		columnHelper.accessor('total', {
			header: 'Total paid',
			cell: ({ getValue }) => getValue().toFixed(2)
		}),
		columnHelper.accessor('payable', {
			header: 'Payable',
			cell: ({ getValue }) => getValue().toFixed(2)
		}),
		columnHelper.accessor((bill) => bill.billedOn.toLocaleDateString(), {
			id: 'billedOn',
			header: 'Billed on',
			filterFn: 'includesString'
		}),
		columnHelper.accessor((bill) => bill.createdAt.toLocaleDateString(), {
			id: 'createdAt',
			header: 'Created on'
		})
	]);
	const table = createTable({
		features,
		get data() {
			return bills;
		},
		columns,
		getRowId: (row) => row.id
	});

	const pagination = $derived(table.atoms.pagination.get());
	const billedOnColumn = $derived(table.getColumn('billedOn'));
	let alertDialogOpen = $state(false);
	let alertDialogConfirmDisabled = $state(false);

	async function handleDeleteBills() {
		if (!meter?.id) {
			toast.warning('Select a meter');
			return;
		}

		const parsed = deleteBillsSchema.safeParse({
			meterId: meter.id,
			ids: table.getSelectedRowIds()
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0].message ?? 'Failed to parse data');
			return;
		}

		const formData = new FormData();
		formData.set('meterId', meter.id);
		parsed.data.ids.forEach((id) => formData.append('ids', id));

		const response = await fetch('/bills?/deleteBills', {
			method: 'POST',
			body: formData
		});
		const result = (await response.json()) as { type: 'success' | 'failure' };

		if (result.type === 'success') {
			toast.success('Successfully deleted bill(s)');
			await invalidateAll();
		} else {
			toast.error('Failed to delete bill(s)');
		}
	}
</script>

<Card.Root size="sm" class="mt-4">
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2 text-base">
			<ReceiptText class="size-4 text-primary" />
			Bill history
		</Card.Title>
		<Card.Description>
			{bills.length} recorded {bills.length === 1 ? 'bill' : 'bills'} for {meter?.name}.
		</Card.Description>
	</Card.Header>
	<Card.Content class="p-0">
		{#if bills.length > 0}
			<div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
				<div class="relative min-w-56 flex-1 sm:max-w-sm">
					<Search
						class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
					/>
					<Input
						class="pl-8"
						placeholder="Filter by billed date..."
						value={(billedOnColumn?.getFilterValue() as string) ?? ''}
						oninput={(event) => billedOnColumn?.setFilterValue(event.currentTarget.value)}
					/>
				</div>
				<details class="relative">
					<summary
						class="inline-flex h-9 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
					>
						Columns
					</summary>
					<div
						class="absolute right-0 z-10 mt-2 w-44 rounded-md border bg-popover p-2 text-sm shadow-md"
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
								<span class="capitalize">{column.id}</span>
							</label>
						{/each}
					</div>
				</details>
				<AlertDialog.Root bind:open={alertDialogOpen}>
					<AlertDialog.Trigger
						class={buttonVariants({ variant: 'destructive', size: 'icon' })}
						disabled={table.getSelectedRowIds().length === 0}
						aria-label="Delete selected bills"
					>
						<Trash />
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description>
								This action cannot be undone. This will permanently delete the selected bills.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action
								disabled={alertDialogConfirmDisabled}
								onclick={async () => {
									alertDialogConfirmDisabled = true;
									await handleDeleteBills();
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
													aria-label="Select all bills"
													checked={table.getIsAllPageRowsSelected()}
													onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
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
									<Table.Cell class="tabular-nums">
										{#if cell.column.id === 'select'}
											<Checkbox
												aria-label="Select bill"
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
									No matching bills.
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
				<p class="text-sm text-muted-foreground">
					{table.getFilteredRowModel().rows.length} matching {table.getFilteredRowModel().rows
						.length === 1
						? 'bill'
						: 'bills'}
				</p>
				<div class="flex items-center gap-3">
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
			<div class="flex flex-col items-center justify-center px-6 py-12 text-center">
				<ReceiptText class="size-8 text-muted-foreground" />
				<h2 class="mt-3 font-semibold">No bills recorded</h2>
				<p class="mt-1 max-w-sm text-sm text-muted-foreground">
					Use Add bill in the meter details above to record the first bill for this meter.
				</p>
				{#if meter}
					<CreateBillDialog
						{meter}
						{form}
						variant="secondary"
						formId="create-bill-when-empty-form"
						className="mt-2">Add Bill</CreateBillDialog
					>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
