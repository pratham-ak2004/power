import { eq } from 'drizzle-orm';
import { db } from '../db';
import { meter, userMeter } from '../db/schema';
import { fail } from '@sveltejs/kit';
import { message, type SuperValidated } from 'sveltekit-superforms';
import { capitalize } from '$lib/utils';
import type z from 'zod';
import type { CreateMeterSchema } from '$lib/zod';
import { cache } from '../db/cache';

export async function createMeterAction(
	userId: string,
	form: SuperValidated<z.infer<CreateMeterSchema>>
) {
	const data = form.data;
	const rrNo = data.rrNo.toUpperCase();

	const rrNoExists = await db.query.meter.findFirst({ where: eq(meter.rrNo, rrNo) });
	if (rrNoExists) {
		return fail(409, { form, message: 'Meter already exists' });
	}

	try {
		await db.transaction(async (tx) => {
			const newMeter = await tx
				.insert(meter)
				.values({
					name: capitalize(data.name),
					rrNo: rrNo.toUpperCase(),
					startReading: data.startReading
				})
				.returning();

			if (newMeter.length === 0) {
				throw new Error('Failed to create meter');
			}

			const newUserMeter = await tx
				.insert(userMeter)
				.values({ meterId: newMeter[0].id, userId: userId, creator: true })
				.returning();

			if (newUserMeter.length === 0) {
				throw new Error('Failed to link meter with user');
			}

			await cache.deleteByPrefix(`${userId}:`);

			return newMeter[0];
		});

		return message(form, 'Successfully created meter');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		return fail(500, { form, message: message });
	}
}
