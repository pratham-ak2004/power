<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Navbar } from '$lib/components/layout';
	import { Toaster } from '$lib/components/ui/sonner';
	import type { LayoutServerData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { data: LayoutServerData; children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if data.user?.image}
		<link rel="preload" as="image" href={data.user.image} />
	{/if}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<main class="mx-auto min-h-screen max-w-7xl px-2">
	{@render children()}
</main>
<Navbar user={data.user ?? null} />
<Toaster richColors position="top-center" expand visibleToasts={3} />
