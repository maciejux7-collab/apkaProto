import { pgTable, text, timestamp, boolean, uuid, jsonb, serial } from 'drizzle-orm/pg-core';

export const technicians = pgTable('technicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  company: text('company').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const branches = pgTable('branches', {
  id: uuid('id').defaultRandom().primaryKey(),
  branchNumber: text('branch_number').notNull().unique(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  branchType: text('branch_type').notNull().default('detal'),
  lastMaintenanceDate: timestamp('last_maintenance_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accessTokens = pgTable('access_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  used: boolean('used').notNull().default(false),
  expiresAt: timestamp('expires_at').notNull(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  technicianId: uuid('technician_id').references(() => technicians.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const protocols = pgTable('protocols', {
  id: uuid('id').defaultRandom().primaryKey(),
  data: jsonb('data').notNull(),
  branchNumber: text('branch_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const additionalTasks = pgTable('additional_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  branchFilter: text('branch_filter').notNull().default('Wszystkie'),
  createdAt: timestamp('created_at').defaultNow(),
});
