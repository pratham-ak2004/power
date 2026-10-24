import { superValidate } from 'sveltekit-superforms';
import type { LayoutServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createBillSchema, createReadingSchema } from '$lib/zod';
import { db } from '$lib/server/db';
import { bill, reading, userMeter } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { cache } from '$lib/server/db/cache';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const session = locals.session ?? null;
	const meterId = url.searchParams.get('meter') ?? cookies.get('meter') ?? null;
	const route = url.pathname;
	const forms = {
		createReadingForm: await superValidate(zod4(createReadingSchema)),
		createBillForm: await superValidate(zod4(createBillSchema))
	};

	if (session) {
		const [meters, selectedMeter] = await cache.fetch(
			`${session.userId}:${meterId}:(meter)`,
			async () => {
				return await Promise.all([
					db.query.userMeter.findMany({
						where: eq(userMeter.userId, session.userId),
						with: {
							meter: true
						},
						orderBy: (table, { asc }) => [asc(table.createdAt)]
					}),
					db.query.userMeter.findFirst({
						where: and(eq(userMeter.meterId, meterId ?? ''), eq(userMeter.userId, session.userId)),
						with: { meter: true }
					})
				]);
			},
			{
				m: 5
			}
		);

		const meter = selectedMeter?.meter;
		if (!meter) {
			return {
				meters,
				meter: null,
				forms
			};
		}

		await cache.fetch(
			`${session.userId}:${meterId}:bills`,
			async () => {
				db.query.bill.findMany({
					where: eq(bill.meterId, meter.id),
					orderBy: (table, { desc }) => [desc(table.createdAt)]
				});
			},
			{ m: 5 }
		);

		const [readings, bills] = await Promise.all([
			route === '/reading'
				? await cache.fetch(
						`${session.userId}:${meterId}:reading`,
						async () => {
							db.query.reading.findMany({
								where: eq(reading.meterId, meter.id),
								orderBy: (table, { desc }) => [desc(table.readAt)]
							});
						},
						{ m: 5 }
					)
				: Promise.resolve([]),
			route === '/bills'
				? await cache.fetch(
						`${session.userId}:${meterId}:bills`,
						async () => {
							db.query.bill.findMany({
								where: eq(bill.meterId, meter.id),
								orderBy: (table, { desc }) => [desc(table.createdAt)]
							});
						},
						{ m: 5 }
					)
				: Promise.resolve([])
		]);

		return {
			meters,
			meter: { ...meter, readings, bills },
			forms
		};
	}

	return {
		meters: [],
		meter: null,
		forms: forms
	};
};
