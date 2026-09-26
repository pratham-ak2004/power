import { message, type SuperValidated } from 'sveltekit-superforms';
import { fail } from '@sveltejs/kit';
import type { CreateReadingSchema, DeleteReadingsSchema } from '$lib/zod';
import type z from 'zod';
import { db } from '../db';
import { and, eq, inArray } from 'drizzle-orm';
import { reading, userMeter } from '../db/schema';

export async function createReadingAction(
	userId: string,
	form: SuperValidated<z.infer<CreateReadingSchema>>
) {
	const hasUserMeter = await db.query.userMeter.findFirst({
		where: and(eq(userMeter.userId, userId), eq(userMeter.meterId, form.data.meterId))
	});
	if (!hasUserMeter) {
		return fail(404, { form, message: 'Meter not found' });
	}

	try {
		const newReading = await db
			.insert(reading)
			.values({
				meterId: hasUserMeter.meterId,
				value: form.data.reading,
				readAt: form.data.readAt
			})
			.returning();

		if (newReading.length === 0) {
			throw new Error('Failed to create reading');
		}

		return message(form, 'Successfully created reading');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'An unknown error occured';
		return fail(500, { form, message: message });
	}
}

export async function deleteReadings(
	userId: string,
	form: SuperValidated<z.infer<DeleteReadingsSchema>>
) {
	const meter = await db.query.userMeter.findFirst({
		where: and(eq(userMeter.userId, userId), eq(userMeter.meterId, form.data.meterId))
	});
	if (!meter) {
		return fail(404, {
			form,
			message: 'Meter for user does not exist'
		});
	}

	try {
		const readings = await db
			.delete(reading)
			.where(and(eq(reading.meterId, meter.meterId), inArray(reading.id, form.data.ids)))
			.returning();

		if (readings.length === 0) {
			return fail(404, {
				form,
				message: 'No matching readings found'
			});
		}

		return message(form, 'Success');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'An unknown error occured';
		return fail(500, { form, message: message });
	}
}
