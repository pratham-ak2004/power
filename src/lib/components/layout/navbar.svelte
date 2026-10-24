<script lang="ts" module>
	import type { User } from 'better-auth';
	import type { Component } from 'svelte';
	import { House, ReceiptIndianRupee, ScrollText, User as UserIcon } from '@lucide/svelte';

	type Props = {
		user: User | null;
		class?: string;
	};

	type Route = {
		name: string;
		href: Pathname;
		icon: Component;
	};

	const ROUTES: Route[] = [
		{
			name: 'Home',
			href: '/',
			icon: House
		},
		{
			name: 'Reading',
			href: '/reading',
			icon: ScrollText
		},
		{
			name: 'Bills',
			href: '/bills',
			icon: ReceiptIndianRupee
		},
		{
			name: 'Profile',
			href: '/profile',
			icon: UserIcon
		}
	];
</script>

<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	const { user, class: className }: Props = $props();

	let activeIndex = $derived(ROUTES.findIndex((route) => route.href === page.url.pathname));
	let imageLoadFailed = $state(false);
	let imageSrc = $derived(
		imageLoadFailed ? '/default-profile.png' : (user?.image ?? '/default-profile.png')
	);
</script>

<!-- Bottom paddding -->
<div class="h-24"></div>
<nav class={cn('fixed bottom-5 left-1/2 w-full max-w-xl -translate-x-1/2 px-2', className)}>
	<div class="relative grid grid-cols-4 rounded-full border bg-background/50 p-1 backdrop-blur-md">
		<div
			class="absolute inset-y-2 left-2 w-[calc((100%-1rem)/4)] overflow-hidden rounded-full
		border-2 border-primary bg-primary bg-linear-to-b from-white/20 via-transparent to-white/40 shadow-md
		shadow-primary/30 transition-transform duration-300
		ease-out after:absolute after:inset-x-1 after:top-1
		after:h-1/2 after:rounded-full after:bg-white/20 after:blur-[1px]"
			style={`transform: translateX(${Math.max(activeIndex, 0) * 100}%);`}
		></div>

		{#each ROUTES as route (route.name)}
			<a
				href={resolve(route.href)}
				class={cn(
					'relative z-10 flex min-w-20 cursor-pointer flex-col items-center justify-center rounded-full px-4 py-2 text-sm transition-colors',
					route.href === page.url.pathname ? 'text-background' : 'text-foreground'
				)}
			>
				{#if route.href === '/profile' && user}
					<img
						src={imageSrc}
						alt="profile"
						class="size-7 rounded-full"
						loading="lazy"
						decoding="async"
						onerror={() => {
							imageLoadFailed = true;
						}}
					/>
					<span>{route.name}</span>
				{:else}
					<route.icon />
					<span>{route.name}</span>
				{/if}
			</a>
		{/each}
	</div>
</nav>
