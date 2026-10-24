<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Navbar } from '$lib/components/layout';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import type { LayoutServerData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { data: LayoutServerData; children: Snippet } = $props();

	onMount(() => {
		if (!('serviceWorker' in navigator)) {
			return;
		}

		const registerServiceWorker = async () => {
			const registrations = await navigator.serviceWorker.getRegistrations();
			const legacyRegistrations = registrations.filter(({ active }) => {
				const scriptUrl = active?.scriptURL ?? '';
				return scriptUrl.endsWith('/sw.js') || scriptUrl.includes('/dev-sw.js');
			});

			await Promise.all(legacyRegistrations.map((registration) => registration.unregister()));
			await navigator.serviceWorker.register('/service-worker.js');
		};

		registerServiceWorker().catch((error) => {
			console.error('[PWA] Service worker registration failed:', error);
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if data.user?.image}
		<link rel="preload" as="image" href={data.user.image} />
	{/if}
</svelte:head>

<ModeWatcher defaultMode="dark" />
<main class="mx-auto max-w-7xl px-4">
	{@render children()}
</main>
<Navbar user={data.user ?? null} />
<Toaster richColors position="top-center" expand visibleToasts={3} />
