import { eq, and, gte, lte, or, ne, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  services, InsertService, Service,
  workHours, InsertWorkHour, WorkHour,
  appointments, InsertAppointment, Appointment
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ SERVICES FUNCTIONS ============

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(services).where(eq(services.isActive, true));
}

export async function getAllServicesAdmin() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(services);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createService(service: InsertService) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(services).values(service);
  return { id: result[0].insertId };
}

export async function updateService(id: number, service: Partial<InsertService>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(services).set(service).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(services).set({ isActive: false }).where(eq(services.id, id));
}

// ============ WORK HOURS FUNCTIONS ============

export async function getAllWorkHours() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(workHours).orderBy(asc(workHours.dayOfWeek));
}

export async function getWorkHoursByDay(dayOfWeek: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(workHours).where(eq(workHours.dayOfWeek, dayOfWeek)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertWorkHours(workHour: InsertWorkHour) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getWorkHoursByDay(workHour.dayOfWeek);
  
  if (existing) {
    await db.update(workHours).set(workHour).where(eq(workHours.dayOfWeek, workHour.dayOfWeek));
    return { id: existing.id };
  } else {
    const result = await db.insert(workHours).values(workHour);
    return { id: result[0].insertId };
  }
}

export async function initializeDefaultWorkHours() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAllWorkHours();
  if (existing.length > 0) return;

  // Initialize default work hours (Sunday-Thursday 9AM-6PM, Friday-Saturday off)
  const defaultHours: InsertWorkHour[] = [
    { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorkingDay: false, slotDurationMinutes: 30 },
    { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorkingDay: false, slotDurationMinutes: 30 },
  ];

  for (const hour of defaultHours) {
    await db.insert(workHours).values(hour);
  }
}

// ============ APPOINTMENTS FUNCTIONS ============

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appointments).values(appointment);
  return { id: result[0].insertId };
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppointmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select()
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.appointmentDate, now),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(appointments)
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointments() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, now),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function getPendingAppointments() {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(appointments)
    .where(eq(appointments.status, "pending"))
    .orderBy(asc(appointments.appointmentDate));
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(asc(appointments.appointmentDate));
}

export async function updateAppointmentStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
}

export async function checkTimeSlotAvailability(date: Date, endTime: Date, excludeId?: number) {
  const db = await getDb();
  if (!db) return false;

  const conflicting = await db.select()
    .from(appointments)
    .where(
      and(
        ne(appointments.status, "cancelled"),
        excludeId ? ne(appointments.id, excludeId) : undefined,
        or(
          and(
            lte(appointments.appointmentDate, date),
            gte(appointments.endTime, date)
          ),
          and(
            lte(appointments.appointmentDate, endTime),
            gte(appointments.endTime, endTime)
          ),
          and(
            gte(appointments.appointmentDate, date),
            lte(appointments.endTime, endTime)
          )
        )
      )
    );

  return conflicting.length === 0;
}

// ============ SEED DEFAULT SERVICES ============

export async function seedDefaultServices() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAllServices();
  if (existing.length > 0) return;

  const defaultServices: InsertService[] = [
    { name: "Haircut", nameAr: "قص شعر", description: "Professional haircut", durationMinutes: 30, price: 50, isActive: true },
    { name: "Beard Trim", nameAr: "تشذيب اللحية", description: "Beard trimming and styling", durationMinutes: 20, price: 30, isActive: true },
    { name: "Haircut & Beard", nameAr: "قص شعر ولحية", description: "Complete haircut and beard trim", durationMinutes: 45, price: 70, isActive: true },
    { name: "Hair Styling", nameAr: "تصفيف الشعر", description: "Professional hair styling", durationMinutes: 25, price: 40, isActive: true },
    { name: "Kids Haircut", nameAr: "قص شعر أطفال", description: "Haircut for children under 12", durationMinutes: 25, price: 35, isActive: true },
  ];

  for (const service of defaultServices) {
    await db.insert(services).values(service);
  }
}
