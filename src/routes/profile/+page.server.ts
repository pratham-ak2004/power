import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createMeterSchema } from '$lib/zod.js';
import { createMeterAction } from '$lib/server/actions/meter.js';
import { protectedAction } from '$lib/server/actions/utils.js';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { userMeter } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session ?? null;
	const forms = {
		createMeterForm: await superValidate(zod4(createMeterSchema))
	};

	if (session) {
		const meters = await db.query.userMeter.findMany({
			where: eq(userMeter.userId, session.user.id),
			with: {
				meter: {
					with: {
						users: {
							with: {
								user: true
							}
						}
					}
				},
				user: true
			}
		});

		return {
			meters: meters.map((meter) => {
				return {
					...meter,
					meter: {
						...meter.meter,
						// TODO: uncomment this value
						// users: meter.meter.users.filter((m) => m.userId !== session.user.id)
						users: meter.meter.users
					}
				};
			}),
			form: forms
		};
	}

	return {
		meters: [],
		form: forms
	};
};

export const actions = {
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/');
	},
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const callbackURL = formData.get('callbackURL')?.toString() ?? '/';

		const result = await auth.api.signInSocial({
			body: {
				provider: 'google',
				callbackURL
			}
		});

		if (result.url) {
			return redirect(302, result.url);
		}
		return fail(400, { message: 'Social sign-in failed' });
	},
	createMeter: protectedAction(async ({ session }, event) => {
		const form = await superValidate(event, zod4(createMeterSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		return await createMeterAction(session.user.id, form);
	})
};
