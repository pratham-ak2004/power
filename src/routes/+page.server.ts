import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { userMeter } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { cache } from '$lib/server/db/cache';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const session = locals.session ?? null;
	const selectedMeter = url.searchParams.get('meter') ?? cookies.get('meter') ?? null;

	if (session) {
		const meters = await cache.fetch(
			`${session.userId}:${selectedMeter}:home`,
			async () => {
				return await db.query.userMeter.findMany({
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
			},
			{
				m: 5
			}
		);

		return {
			meters: meters,
			selectedMeter: selectedMeter
		};
	} else {
		// HACK: This block is unreachable as this is handled by layout.servver.ts
		redirect(307, '/profile');
	}
};
