import { superValidate } from 'sveltekit-superforms';
import type { LayoutServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createReadingSchema } from '$lib/zod';
import { db } from '$lib/server/db';
import { userMeter } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const session = locals.session ?? null;
	const meterId = url.searchParams.get('meter') ?? cookies.get('meter') ?? null;
	const forms = {
		createReadingForm: await superValidate(zod4(createReadingSchema))
	};

	if (session) {
		const [meters, selectedMeter] = await Promise.all([
			db.query.userMeter.findMany({
				where: eq(userMeter.userId, session.userId),
				with: {
					meter: true
				},
				orderBy: (table, { asc }) => [asc(table.createdAt)]
			}),
			db.query.userMeter.findFirst({
				where: and(eq(userMeter.meterId, meterId ?? ''), eq(userMeter.userId, session.userId)),
				with: {
					meter: {
						with: {
							readings: {
								orderBy: (table, { desc }) => [desc(table.readAt)]
							}
						}
					}
				}
			})
		]);

		return {
			meters: meters,
			meter: selectedMeter?.meter ?? null,
			forms: forms
		};
	}

	return {
		meters: [],
		meter: null,
		forms: forms
	};
};
