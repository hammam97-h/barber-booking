import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  services, InsertService, Service,
  appointments, InsertAppointment, Appointment,
  workHours, InsertWorkHour, WorkHour
} from "../drizzle/schema";

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

// ============ User Functions ============

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(phone: string, name?: string): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values({
    phone,
    name: name || null,
    lastSignedIn: new Date(),
  });
  
  return { id: Number(result[0].insertId) };
}

export async function updateUserLastSignIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserName(id: number, name: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ name }).where(eq(users.id, id));
}

export async function setUserAsAdmin(phone: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ role: 'admin' }).where(eq(users.phone, phone));
}

// ============ Service Functions ============

export async function getAllServices(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(services).where(eq(services.isActive, true));
  }
  return db.select().from(services);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createService(data: Omit<InsertService, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(services).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(services).where(eq(services.id, id));
}

// ============ Appointment Functions ============

export async function createAppointment(data: Omit<InsertAppointment, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appointments).values(data);
  return { id: Number(result[0].insertId) };
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
  
  return db.select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointmentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return db.select()
    .from(appointments)
    .where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.appointmentDate, now)
      )
    )
    .orderBy(appointments.appointmentDate);
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(appointments)
    .orderBy(desc(appointments.appointmentDate));
}

export async function getUpcomingAppointments() {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  return db.select()
    .from(appointments)
    .where(gte(appointments.appointmentDate, now))
    .orderBy(appointments.appointmentDate);
}

export async function getPendingAppointments() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(appointments)
    .where(eq(appointments.status, 'pending'))
    .orderBy(appointments.appointmentDate);
}

export async function updateAppointmentStatus(id: number, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  const db = await getDb();
  if (!db) return;
  
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lte(appointments.appointmentDate, endDate)
      )
    );
}

export async function checkTimeSlotAvailability(date: Date, endTime: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Check if there's any overlapping appointment
  const overlapping = await db.select()
    .from(appointments)
    .where(
      and(
        lte(appointments.appointmentDate, endTime),
        gte(appointments.endTime, date),
        eq(appointments.status, 'confirmed')
      )
    )
    .limit(1);
  
  return overlapping.length === 0;
}

// ============ Work Hours Functions ============

export async function getAllWorkHours() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(workHours).orderBy(workHours.dayOfWeek);
}

export async function getWorkHoursByDay(dayOfWeek: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(workHours)
    .where(eq(workHours.dayOfWeek, dayOfWeek))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertWorkHours(data: Omit<InsertWorkHour, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getWorkHoursByDay(data.dayOfWeek);
  
  if (existing) {
    await db.update(workHours)
      .set({
        startTime: data.startTime,
        endTime: data.endTime,
        isWorkingDay: data.isWorkingDay,
        slotDurationMinutes: data.slotDurationMinutes,
      })
      .where(eq(workHours.dayOfWeek, data.dayOfWeek));
  } else {
    await db.insert(workHours).values(data);
  }
}

export async function initializeDefaultWorkHours() {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getAllWorkHours();
  if (existing.length > 0) return;
  
  // Default: Sunday-Thursday working, Friday-Saturday off
  const defaults = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true, slotDurationMinutes: 30 },
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', isWorkingDay: false, slotDurationMinutes: 30 },
    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isWorkingDay: false, slotDurationMinutes: 30 },
  ];
  
  for (const day of defaults) {
    await db.insert(workHours).values(day);
  }
}
