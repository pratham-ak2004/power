import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	const pathname = url.pathname;

	if (session === undefined && pathname !== '/profile') {
		return redirect(307, '/profile');
	}

	return { user: session?.user };
};
