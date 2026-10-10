import type { CreateBillSchema, DeleteBillsSchema } from '$lib/zod';
import { message, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { db } from '../db';
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { bill, userMeter } from '../db/schema';
import { fail } from '@sveltejs/kit';

export async function createBillAction(
	userId: string,
	form: SuperValidated<Infer<CreateBillSchema>>
) {
	const hasUserMeter = await db.query.userMeter.findFirst({
		where: and(eq(userMeter.userId, userId), eq(userMeter.meterId, form.data.meterId))
	});
	if (!hasUserMeter) {
		return fail(404, { form, message: 'Meter not found' });
	}

	try {
		const billedOn = new Date(form.data.billedOn);
		const startOfDay = new Date(billedOn);
		startOfDay.setHours(0, 0, 0, 0);
		const startOfNextDay = new Date(startOfDay);
		startOfNextDay.setDate(startOfNextDay.getDate() + 1);

		console.log(billedOn);

		const billExists = await db.query.bill.findFirst({
			where: and(
				eq(bill.meterId, form.data.meterId),
				and(gte(bill.billedOn, startOfDay), lt(bill.billedOn, startOfNextDay))
			)
		});
		if (billExists) {
			return fail(409, { form, message: 'Bill alreaddy exists on this day' });
		}

		const newBill = await db
			.insert(bill)
			.values({
				meterId: form.data.meterId,
				currentReading: form.data.currentReading,
				previousReading: form.data.previousReading,
				total: form.data.total,
				payable: form.data.payable,
				billedOn: form.data.billedOn
			})
			.returning();

		if (newBill.length === 0) {
			throw new Error('Failed to create bill');
		}

		return message(form, 'Successfully created meter');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		return fail(500, { form, message: message });
	}
}

export async function deleteBills(userId: string, form: SuperValidated<Infer<DeleteBillsSchema>>) {
	const hasUserMeter = await db.query.userMeter.findFirst({
		where: and(eq(userMeter.userId, userId), eq(userMeter.meterId, form.data.meterId))
	});
	if (!hasUserMeter) {
		return fail(404, { form, message: 'Meter for user does not exist' });
	}

	try {
		const deletedBills = await db
			.delete(bill)
			.where(and(eq(bill.meterId, hasUserMeter.meterId), inArray(bill.id, form.data.ids)))
			.returning();

		if (deletedBills.length === 0) {
			return fail(404, { form, message: 'No matching bills found' });
		}

		return message(form, 'Successfully deleted bill(s)');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'An unknown error occurred';
		return fail(500, { form, message });
	}
}
