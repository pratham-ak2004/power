import { createId } from '@paralleldrive/cuid2';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	index,
	uniqueIndex,
	numeric,
	decimal
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		issuer: text('issuer').notNull(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [
		uniqueIndex('account_issuer_accountId_uidx').on(table.issuer, table.accountId),
		index('account_userId_idx').on(table.userId)
	]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const meter = pgTable('meter', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').notNull(),
	rrNo: text('rr_number').notNull().unique(),
	startReading: numeric('start_reading', {
		mode: 'number',
		precision: 10,
		scale: 2
	})
		.default(0)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const userMeter = pgTable('user_meter', {
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	meterId: text('meter_id')
		.notNull()
		.references(() => meter.id, { onDelete: 'cascade' }),
	creator: boolean('creator').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const bill = pgTable('bill', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	previousReading: numeric('previous_reading', {
		mode: 'number',
		precision: 10,
		scale: 2
	}).notNull(),
	currentReading: numeric('current_reading', {
		mode: 'number',
		precision: 10,
		scale: 2
	}).notNull(),
	payable: decimal('payable', { mode: 'number', precision: 8, scale: 2 }).notNull(), // total payable amount
	total: decimal('total', { mode: 'number', precision: 8, scale: 2 }).notNull(), // total amount paid
	billedOn: timestamp('billed_on').defaultNow().notNull(),
	meterId: text('meter_id')
		.notNull()
		.references(() => meter.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const reading = pgTable('reading', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	value: numeric('value', { mode: 'number', precision: 10, scale: 2 }).notNull(),
	meterId: text('meter_id')
		.notNull()
		.references(() => meter.id, { onDelete: 'cascade' }),
	readAt: timestamp('read_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
