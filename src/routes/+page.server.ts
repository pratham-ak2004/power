import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { userMeter } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const session = locals.session ?? null;
	const selectedMeter = url.searchParams.get('meter') ?? cookies.get('meter') ?? null;

	if (session) {
		const meters = await db.query.userMeter.findMany({
			where: and(eq(userMeter.userId, session.userId)),
			with: {
				meter: {
					columns: {
						name: true,
						rrNo: true,
						startReading: true
					},
					with: {
						readings: {
							columns: {
								readAt: true,
								value: true
							},
							orderBy: (table, { asc }) => [asc(table.readAt)]
						},
						bills: {
							columns: {
								payable: true,
								total: true,
								billedOn: true
							},
							orderBy: (table, { desc }) => [desc(table.billedOn)]
						}
					}
				}
			}
		});

		return {
			meters: meters,
			selectedMeter: selectedMeter
		};
	} else {
		// HACK: This block is unreachable as this is handled by layout.servver.ts
		redirect(307, '/profile');
	}
};
