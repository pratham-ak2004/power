import { superValidate } from 'sveltekit-superforms';
import type { LayoutServerLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createBillSchema, createReadingSchema } from '$lib/zod';
import { db } from '$lib/server/db';
import { bill, reading, userMeter } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	const session = locals.session ?? null;
	const meterId = url.searchParams.get('meter') ?? cookies.get('meter') ?? null;
	const route = url.pathname;
	const forms = {
		createReadingForm: await superValidate(zod4(createReadingSchema)),
		createBillForm: await superValidate(zod4(createBillSchema))
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
				with: { meter: true }
			})
		]);

		const meter = selectedMeter?.meter;
		if (!meter) {
			return {
				meters,
				meter: null,
				forms
			};
		}

		const [readings, bills] = await Promise.all([
			route === '/reading'
				? db.query.reading.findMany({
						where: eq(reading.meterId, meter.id),
						orderBy: (table, { desc }) => [desc(table.readAt)]
					})
				: Promise.resolve([]),
			route === '/bills'
				? db.query.bill.findMany({
						where: eq(bill.meterId, meter.id),
						orderBy: (table, { desc }) => [desc(table.createdAt)]
					})
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
