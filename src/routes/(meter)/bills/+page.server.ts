import { createBillAction, deleteBills } from '$lib/server/actions/bills.js';
import { protectedAction } from '$lib/server/actions/utils';
import { createBillSchema, deleteBillsSchema } from '$lib/zod';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const actions = {
	createBill: protectedAction(async ({ session }, event) => {
		const form = await superValidate(event, zod4(createBillSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		return await createBillAction(session.user.id, form);
	}),
	deleteBills: protectedAction(async ({ session }, event) => {
		const form = await superValidate(await event.request.formData(), zod4(deleteBillsSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		return await deleteBills(session.user.id, form);
	})
};
