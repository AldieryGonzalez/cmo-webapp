// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";

import { integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { v4 as uuid } from "uuid";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const sqliteTable = sqliteTableCreator((name) => `cmo-webapp_${name}`);

export const events = sqliteTable("event", {
  id: text("id", { length: 255 }).primaryKey().notNull(),
  title: text("title", { length: 255 }).notNull(),
  createdByEmail: text("createdByEmail", { length: 255 }).notNull(),
  location: text("location", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", {mode: 'timestamp'}).notNull(),
  updatedAt: integer("updatedAt", {mode: 'timestamp'}).notNull(),
  syncedAt: integer("syncedAt", {mode: 'timestamp'}).notNull(),
  start: integer("start", {mode: 'timestamp'}).notNull(),
  end: integer("end", {mode: 'timestamp'}).notNull(),
  cancelled: integer("cancelled", {mode: "boolean"}).notNull().default(false),
});

export const eventsRelations = relations(events, ({ many }) => ({
  shifts: many(shifts),
}));

export const shifts = sqliteTable("shift", {
  id: text("id", { length: 255 }).primaryKey().$defaultFn(uuid),
  eventId: text("eventId", { length: 255 }).notNull(),
  role: text("role", { length: 255 }).notNull(),
  start: integer("start", {mode: "timestamp"}).notNull(),
  end: integer("end", {mode: "timestamp"}).notNull(),
  userEmail: text("userEmail", { length: 255 }),
  filledBy: text("filledBy", { length: 255 }),
  confirmationNote: text("confirmationNote"),
  cancelled: integer("cancelled", {mode: "boolean"}).notNull().default(false),
});


export const shiftsRelations = relations(shifts, ({ one }) => ({
  users: one(users, { fields: [shifts.userEmail], references: [users.email] }),
  events: one(events, { fields: [shifts.eventId], references: [events.id] }),
}));

export const users = sqliteTable("user", {
  id: text("id", { length: 255 }).primaryKey().$defaultFn(uuid),
  email: text("email", { length: 255 }).notNull(),
  firstName: text("name", { length: 255 }).notNull(),
  lastName: text("lastName", { length: 255 }).notNull(),
  phoneNumber: text("phoneNumber", { length: 255 }),
  image: text("image", { length: 255 }),
  alternativeNames: text("alternativeNames", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
}));

export const syncs = sqliteTable("syncs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userEmail: text("userEmail", { length: 255 }).notNull(),
  lastSynced: integer("lastSynced", {mode: "timestamp"}).notNull().$defaultFn(() => new Date),
});

export const savedShifts = sqliteTable("savedShifts", {
  id: text("id", { length: 255 }).primaryKey().$defaultFn(uuid),
  userId: text("userId", { length: 255 }).notNull(),
  eventId: text("eventId", { length: 255 }).notNull(),
  createdAt: integer("createdAt", {mode: "timestamp"}).notNull().defaultNow(),
  role: text("role", { length: 255 }).notNull(),
  start: integer("start", {mode: "timestamp"}).notNull(),
  end: integer("end", {mode: "timestamp"}).notNull(),
});
export const savedShiftsRelations = relations(savedShifts, ({ one }) => ({
  users: one(users, { fields: [savedShifts.userId], references: [users.id] }),
  events: one(events, {
    fields: [savedShifts.eventId],
    references: [events.id],
  }),
}));
