import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createReadingSchema, deleteReadingsSchema } from '$lib/zod';
import { protectedAction } from '$lib/server/actions/utils.js';
import { fail } from '@sveltejs/kit';
import { createReadingAction, deleteReadings } from '$lib/server/actions/reading.js';

export const actions = {
	createReading: protectedAction(async ({ session }, event) => {
		const form = await superValidate(event, zod4(createReadingSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		return await createReadingAction(session.user.id, form);
	}),
	deleteReadings: protectedAction(async ({ session }, event) => {
		const form = await superValidate(await event.request.formData(), zod4(deleteReadingsSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		return await deleteReadings(session.user.id, form);
	})
};
