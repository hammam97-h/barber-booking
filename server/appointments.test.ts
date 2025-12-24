import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getAllServices: vi.fn(),
  getServiceById: vi.fn(),
  getAllWorkHours: vi.fn(),
  getWorkHoursByDay: vi.fn(),
  getAppointmentsByDateRange: vi.fn(),
  createAppointment: vi.fn(),
  checkTimeSlotAvailability: vi.fn(),
  getAppointmentsByUser: vi.fn(),
  getUpcomingAppointmentsByUser: vi.fn(),
  getAllAppointments: vi.fn(),
  getUpcomingAppointments: vi.fn(),
  getPendingAppointments: vi.fn(),
  updateAppointmentStatus: vi.fn(),
  getAppointmentById: vi.fn(),
  getUserById: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("services router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists active services for public users", async () => {
    const mockServices = [
      { id: 1, name: "Haircut", durationMinutes: 30, price: 50, isActive: true },
      { id: 2, name: "Beard Trim", durationMinutes: 20, price: 30, isActive: true },
    ];
    vi.mocked(db.getAllServices).mockResolvedValue(mockServices as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.list();

    expect(result).toEqual(mockServices);
    expect(db.getAllServices).toHaveBeenCalled();
  });

  it("gets service by id", async () => {
    const mockService = { id: 1, name: "Haircut", durationMinutes: 30, price: 50, isActive: true };
    vi.mocked(db.getServiceById).mockResolvedValue(mockService as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.getById({ id: 1 });

    expect(result).toEqual(mockService);
    expect(db.getServiceById).toHaveBeenCalledWith(1);
  });
});

describe("workHours router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists work hours", async () => {
    const mockWorkHours = [
      { id: 1, dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
      { id: 2, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 },
    ];
    vi.mocked(db.getAllWorkHours).mockResolvedValue(mockWorkHours as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.workHours.list();

    expect(result).toEqual(mockWorkHours);
  });

  it("gets work hours by day", async () => {
    const mockWorkHour = { id: 1, dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorkingDay: true, slotDurationMinutes: 30 };
    vi.mocked(db.getWorkHoursByDay).mockResolvedValue(mockWorkHour as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.workHours.getByDay({ dayOfWeek: 0 });

    expect(result).toEqual(mockWorkHour);
    expect(db.getWorkHoursByDay).toHaveBeenCalledWith(0);
  });
});

describe("appointments router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available slots for a working day", async () => {
    const mockWorkHour = { 
      id: 1, 
      dayOfWeek: 1, 
      startTime: "09:00", 
      endTime: "12:00", 
      isWorkingDay: true, 
      slotDurationMinutes: 30 
    };
    const mockService = { id: 1, name: "Haircut", durationMinutes: 30, price: 50, isActive: true };
    
    vi.mocked(db.getWorkHoursByDay).mockResolvedValue(mockWorkHour as any);
    vi.mocked(db.getServiceById).mockResolvedValue(mockService as any);
    vi.mocked(db.getAppointmentsByDateRange).mockResolvedValue([]);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Use a future date that is a Monday (dayOfWeek = 1)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days in future
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = await caller.appointments.getAvailableSlots({ 
      date: dateStr, 
      serviceId: 1 
    });

    expect(result.isWorkingDay).toBe(true);
    expect(result.slots.length).toBeGreaterThan(0);
  });

  it("returns no slots for non-working day", async () => {
    const mockWorkHour = { 
      id: 1, 
      dayOfWeek: 6, 
      startTime: "09:00", 
      endTime: "18:00", 
      isWorkingDay: false, 
      slotDurationMinutes: 30 
    };
    
    vi.mocked(db.getWorkHoursByDay).mockResolvedValue(mockWorkHour as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Use a future Saturday
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    while (futureDate.getDay() !== 6) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = await caller.appointments.getAvailableSlots({ 
      date: dateStr, 
      serviceId: 1 
    });

    expect(result.isWorkingDay).toBe(false);
    expect(result.slots).toEqual([]);
  });

  it("creates appointment for authenticated user", async () => {
    const mockService = { id: 1, name: "Haircut", durationMinutes: 30, price: 50, isActive: true };
    vi.mocked(db.getServiceById).mockResolvedValue(mockService as any);
    vi.mocked(db.checkTimeSlotAvailability).mockResolvedValue(true);
    vi.mocked(db.createAppointment).mockResolvedValue({ id: 1 });

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(10, 0, 0, 0);

    const result = await caller.appointments.create({
      serviceId: 1,
      appointmentDate: futureDate.toISOString(),
      customerName: "John Doe",
      customerPhone: "1234567890",
    });

    expect(result).toEqual({ id: 1 });
    expect(db.createAppointment).toHaveBeenCalled();
  });

  it("returns user appointments", async () => {
    const mockAppointments = [
      { 
        id: 1, 
        userId: 1, 
        serviceId: 1, 
        appointmentDate: new Date(), 
        endTime: new Date(),
        status: "confirmed" as const,
        customerName: "Test",
        customerPhone: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ];
    const mockService = { id: 1, name: "Haircut", durationMinutes: 30, price: 50, isActive: true };
    
    vi.mocked(db.getAppointmentsByUser).mockResolvedValue(mockAppointments as any);
    vi.mocked(db.getServiceById).mockResolvedValue(mockService as any);

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.myAppointments();

    expect(result.length).toBe(1);
    expect(result[0].service).toEqual(mockService);
  });

  it("admin can update appointment status", async () => {
    vi.mocked(db.updateAppointmentStatus).mockResolvedValue(undefined);

    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.updateStatus({ 
      id: 1, 
      status: "confirmed" 
    });

    expect(result).toEqual({ success: true });
    expect(db.updateAppointmentStatus).toHaveBeenCalledWith(1, "confirmed");
  });

  it("non-admin cannot access admin endpoints", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.appointments.updateStatus({ id: 1, status: "confirmed" })
    ).rejects.toThrow("Admin access required");
  });

  it("user can cancel their own appointment", async () => {
    const mockAppointment = { 
      id: 1, 
      userId: 1, 
      serviceId: 1, 
      status: "pending" as const 
    };
    vi.mocked(db.getAppointmentById).mockResolvedValue(mockAppointment as any);
    vi.mocked(db.updateAppointmentStatus).mockResolvedValue(undefined);

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.cancel({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(db.updateAppointmentStatus).toHaveBeenCalledWith(1, "cancelled");
  });

  it("user cannot cancel another user's appointment", async () => {
    const mockAppointment = { 
      id: 1, 
      userId: 999, // Different user
      serviceId: 1, 
      status: "pending" as const 
    };
    vi.mocked(db.getAppointmentById).mockResolvedValue(mockAppointment as any);

    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.appointments.cancel({ id: 1 })
    ).rejects.toThrow("Not authorized");
  });
});
