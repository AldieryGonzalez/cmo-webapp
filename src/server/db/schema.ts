// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import {
  boolean,
  mysqlTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuid } from "uuid";

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
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  syncedAt: timestamp("syncedAt").onUpdateNow().notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  cancelled: boolean("cancelled").notNull().default(false),
});

export const eventsRelations = relations(events, ({ many }) => ({
  shifts: many(shifts),
}));

export const shifts = mysqlTable("shift", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(uuid),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  userEmail: varchar("userEmail", { length: 255 }),
  filledBy: varchar("filledBy", { length: 255 }),
  confirmationNote: text("confirmationNote"),
  cancelled: boolean("cancelled").notNull().default(false),
});

export const shiftsRelations = relations(shifts, ({ one }) => ({
  users: one(users, { fields: [shifts.userEmail], references: [users.email] }),
  events: one(events, { fields: [shifts.eventId], references: [events.id] }),
}));

export const users = mysqlTable("user", {
  email: varchar("email", { length: 255 }).notNull().primaryKey(),
  firstName: varchar("name", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 255 }),
  image: varchar("image", { length: 255 }),
  alternativeNames: varchar("alternativeNames", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  shifts: many(shifts),
}));

export const syncs = mysqlTable("syncs", {
  id: serial("id"),
  userEmail: varchar("userEmail", { length: 255 }).notNull(),
  lastSynced: timestamp("lastSynced").notNull().defaultNow(),
});
