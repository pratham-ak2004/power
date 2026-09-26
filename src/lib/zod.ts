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

export const deleteReadingsSchema = z.object({
	meterId: z.string().min(1, 'Meter ID is required'),
	ids: z.array(z.string().min(1, 'Reading ID is required')).min(1, 'At least one ID is required')
});
export type DeleteReadingsSchema = typeof deleteReadingsSchema;
