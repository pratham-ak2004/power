<svelte:head>
	<title>Offline | power</title>
	<meta
		name="description"
		content="power is unavailable right now because this device is offline."
	/>
</svelte:head>

<div class="offline-page">
	<div class="offline-content">
		<img src="/web-app-manifest-192x192.png" alt="power" width="96" height="96" />
		<p class="eyebrow">power</p>
		<h1>You are offline</h1>
		<p class="message">Reconnect to the internet to load your meters, readings, and bills.</p>
		<button type="button" onclick={() => location.reload()}>Try again</button>
	</div>
</div>

<style>
	.offline-page {
		display: grid;
		min-height: 100svh;
		place-items: center;
		padding: 2rem 1.25rem;
		background: var(--background);
		color: var(--foreground);
	}

	.offline-content {
		display: grid;
		width: min(100%, 28rem);
		justify-items: center;
		gap: 1rem;
		text-align: center;
	}

	img {
		border-radius: 1rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 8vw, 3.5rem);
		line-height: 1;
	}

	.message {
		max-width: 24rem;
		margin: 0;
		color: var(--muted-foreground);
	}

	button {
		min-height: 2.75rem;
		padding: 0.625rem 1rem;
		border: 0;
		border-radius: var(--radius);
		background: var(--primary);
		color: var(--primary-foreground);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	button:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}
</style>
