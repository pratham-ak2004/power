import z from 'zod';

export const createMeterSchema = z.object({
	name: z.string().min(1, 'Meter name is required'),
	rrNo: z.string().min(1, 'RR number is required'),
	startReading: z.number().optional()
});
export type CreateMeterSchema = typeof createMeterSchema;

export const createReadingSchema = z.object({
	meterId: z.string().min(1, 'Meter ID is required'),
	reading: z.number().min(0, 'Reading value cannot be less than 0'),
	readAt: z.date().default(new Date())
});
export type CreateReadingSchema = typeof createReadingSchema;

export const createBillSchema = z
	.object({
		meterId: z.string().min(1, 'Meter ID is required'),
		previousReading: z.number().min(0, 'Previous reading cannot be less than 0'),
		currentReading: z.number().min(0, 'Current reading cannot be less than 0'),
		total: z.number().min(0, 'Total cannot be less than 0'),
		billedOn: z.date().default(new Date()),
		payable: z.number().min(0, 'Payable amount cannot be less than 0')
	})
	.superRefine(({ previousReading, currentReading, billedOn }, ctx) => {
		if (currentReading < previousReading) {
			ctx.addIssue({
				code: 'custom',
				message: `current reading can't be less than previous reading`,
				path: ['currentReading', 'previousReading']
			});
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const billedDate = new Date(billedOn);
		billedDate.setHours(0, 0, 0, 0);
		if (billedDate > today) {
			ctx.addIssue({
				code: 'custom',
				message: 'Billed on cannot be in the future',
				path: ['billedOn']
			});
		}
	});
export type CreateBillSchema = typeof createBillSchema;

export const deleteReadingsSchema = z.object({
	meterId: z.string().min(1, 'Meter ID is required'),
	ids: z.array(z.string().min(1, 'Reading ID is required')).min(1, 'At least one ID is required')
});
export type DeleteReadingsSchema = typeof deleteReadingsSchema;

export const deleteBillsSchema = z.object({
	meterId: z.string().min(1, 'Meter ID is required'),
	ids: z.array(z.string().min(1, 'Bill ID is required')).min(1, 'At least one ID is required')
});
export type DeleteBillsSchema = typeof deleteBillsSchema;
