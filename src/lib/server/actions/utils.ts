import { dev } from '$app/env';
import { authClient } from '$lib/client';
import type { RequestEvent, ActionFailure } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

type ProtectedContext = {
	session: NonNullable<Awaited<ReturnType<typeof authClient.getSession>>['data']>;
};

export function protectedAction<R>(
	next: (context: ProtectedContext, event: RequestEvent) => R | Promise<R>
) {
	return timingMiddleware(
		async (event: RequestEvent): Promise<R | ActionFailure<{ message: string }>> => {
			const { data } = await authClient.getSession({
				fetchOptions: {
					customFetchImpl: event.fetch
				}
			});

			if (!data) {
				return fail(401, {
					message: 'Unauthenticated'
				});
			}

			return next({ session: data }, event);
		}
	);
}

export function timingMiddleware<R>(next: (event: RequestEvent) => R | Promise<R>) {
	return async (event: RequestEvent): Promise<R> => {
		const start = performance.now();

		try {
			if (dev) {
				const waitMs = Math.floor(Math.random() * 1000) + 100;
				await new Promise((resolve) => setTimeout(resolve, waitMs));
			}

			return await next(event);
		} finally {
			const duration = performance.now() - start;

			console.log(`${event.request.method} ${event.url.pathname} - ${duration.toFixed(2)}ms`);
		}
	};
}
