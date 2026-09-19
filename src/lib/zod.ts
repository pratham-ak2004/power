import z from 'zod';

export const createMeterSchema = z.object({
	name: z.string().min(1, 'Meter name is required'),
	rrNo: z.string().min(1, 'RR number is required'),
	startReading: z.number().optional()
});
export type CreateMeterSchema = typeof createMeterSchema;
