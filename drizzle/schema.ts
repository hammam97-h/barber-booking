import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Users table - supports phone-based authentication
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services offered by the barbershop
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  durationMinutes: int("durationMinutes").notNull().default(30),
  price: int("price").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Appointments booked by customers
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  customerName: varchar("customerName", { length: 100 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Work hours configuration for each day of the week
 */
export const workHours = mysqlTable("workHours", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 6 = Saturday
  startTime: varchar("startTime", { length: 5 }).notNull(), // "09:00"
  endTime: varchar("endTime", { length: 5 }).notNull(), // "18:00"
  isWorkingDay: boolean("isWorkingDay").notNull().default(true),
  slotDurationMinutes: int("slotDurationMinutes").notNull().default(30),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkHour = typeof workHours.$inferSelect;
export type InsertWorkHour = typeof workHours.$inferInsert;
