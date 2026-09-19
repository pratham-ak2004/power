import { relations } from 'drizzle-orm';
import { account, bill, meter, reading, session, user, userMeter } from './schema';

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	meters: many(userMeter)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const meterRelations = relations(meter, ({ many }) => ({
	users: many(userMeter),
	bills: many(bill),
	readings: many(reading)
}));

export const userMeterRelations = relations(userMeter, ({ one }) => ({
	user: one(user, {
		fields: [userMeter.userId],
		references: [user.id]
	}),
	meter: one(meter, {
		fields: [userMeter.meterId],
		references: [meter.id]
	})
}));

export const billRealations = relations(bill, ({ one }) => ({
	meter: one(meter, {
		fields: [bill.meterId],
		references: [meter.id]
	})
}));

export const readingRelations = relations(reading, ({ one }) => ({
	meter: one(meter, {
		fields: [reading.meterId],
		references: [meter.id]
	})
}));
