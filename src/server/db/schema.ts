// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import {
  mysqlTableCreator,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `cmo-webapp_${name}`);

export const events = mysqlTable("event", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  createdByEmail: varchar("createdByEmail", { length: 255 }).notNull(),
  location: varchar("location", { length: 256 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdByEmail],
    references: [users.email],
  }),
  shifts: many(shifts),
}));

export const shifts = mysqlTable("shift", {
  id: varchar("id", { length: 255 }).primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  userEmail: varchar("userEmail", { length: 255 }),
  role: varchar("role", { length: 255 }).notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  confirmationNote: text("confirmationNote"),
});

export const shiftsRelations = relations(shifts, ({ one }) => ({
  users: one(users, { fields: [shifts.userEmail], references: [users.email] }),
  events: one(events, { fields: [shifts.eventId], references: [events.id] }),
}));

export const users = mysqlTable("user", {
  email: varchar("email", { length: 255 }).notNull().primaryKey(),
  firstName: varchar("name", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 255 }),
  image: varchar("image", { length: 255 }),
  alternativeNames: text("alternativeNames"),
});

export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
}));
