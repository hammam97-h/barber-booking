import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Services router
  services: router({
    list: publicProcedure.query(async () => {
      return await db.getAllServices();
    }),
    
    listAll: adminProcedure.query(async () => {
      return await db.getAllServicesAdmin();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getServiceById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        durationMinutes: z.number().min(5).default(30),
        price: z.number().min(0).default(0),
      }))
      .mutation(async ({ input }) => {
        return await db.createService(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        durationMinutes: z.number().min(5).optional(),
        price: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateService(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteService(input.id);
        return { success: true };
      }),
    
    seed: adminProcedure.mutation(async () => {
      await db.seedDefaultServices();
      return { success: true };
    }),
  }),

  // Work hours router
  workHours: router({
    list: publicProcedure.query(async () => {
      const hours = await db.getAllWorkHours();
      if (hours.length === 0) {
        await db.initializeDefaultWorkHours();
        return await db.getAllWorkHours();
      }
      return hours;
    }),
    
    getByDay: publicProcedure
      .input(z.object({ dayOfWeek: z.number().min(0).max(6) }))
      .query(async ({ input }) => {
        return await db.getWorkHoursByDay(input.dayOfWeek);
      }),
    
    update: adminProcedure
      .input(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        isWorkingDay: z.boolean(),
        slotDurationMinutes: z.number().min(5).default(30),
      }))
      .mutation(async ({ input }) => {
        await db.upsertWorkHours(input);
        return { success: true };
      }),
    
    initialize: adminProcedure.mutation(async () => {
      await db.initializeDefaultWorkHours();
      return { success: true };
    }),
  }),

  // Appointments router
  appointments: router({
    // Get available time slots for a specific date
    getAvailableSlots: publicProcedure
      .input(z.object({
        date: z.string(), // YYYY-MM-DD format
        serviceId: z.number(),
      }))
      .query(async ({ input }) => {
        const date = new Date(input.date);
        const dayOfWeek = date.getDay();
        
        // Get work hours for this day
        const workHour = await db.getWorkHoursByDay(dayOfWeek);
        if (!workHour || !workHour.isWorkingDay) {
          return { slots: [], isWorkingDay: false };
        }
        
        // Get service duration
        const service = await db.getServiceById(input.serviceId);
        if (!service) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
        }
        
        // Get existing appointments for this day
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const existingAppointments = await db.getAppointmentsByDateRange(startOfDay, endOfDay);
        
        // Generate available slots
        const slots: { time: string; available: boolean }[] = [];
        const [startHour, startMin] = workHour.startTime.split(':').map(Number);
        const [endHour, endMin] = workHour.endTime.split(':').map(Number);
        
        const slotDuration = workHour.slotDurationMinutes;
        const serviceDuration = service.durationMinutes;
        
        let currentTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        while (currentTime + serviceDuration <= endTime) {
          const hour = Math.floor(currentTime / 60);
          const minute = currentTime % 60;
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Check if this slot is available
          const slotStart = new Date(input.date);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);
          
          // Check for conflicts
          const hasConflict = existingAppointments.some(apt => {
            const aptStart = new Date(apt.appointmentDate);
            const aptEnd = new Date(apt.endTime);
            return (slotStart < aptEnd && slotEnd > aptStart);
          });
          
          // Check if slot is in the past
          const now = new Date();
          const isPast = slotStart < now;
          
          slots.push({
            time: timeStr,
            available: !hasConflict && !isPast,
          });
          
          currentTime += slotDuration;
        }
        
        return { slots, isWorkingDay: true };
      }),
    
    // Create a new appointment
    create: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        appointmentDate: z.string(), // ISO date string
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const service = await db.getServiceById(input.serviceId);
        if (!service) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
        }
        
        const appointmentDate = new Date(input.appointmentDate);
        const endTime = new Date(appointmentDate.getTime() + service.durationMinutes * 60 * 1000);
        
        // Check availability
        const isAvailable = await db.checkTimeSlotAvailability(appointmentDate, endTime);
        if (!isAvailable) {
          throw new TRPCError({ code: 'CONFLICT', message: 'This time slot is no longer available' });
        }
        
        const result = await db.createAppointment({
          userId: ctx.user.id,
          serviceId: input.serviceId,
          appointmentDate,
          endTime,
          customerName: input.customerName || ctx.user.name || undefined,
          customerPhone: input.customerPhone,
          notes: input.notes,
          status: 'pending',
        });
        
        // Notify barber about new appointment
        await notifyOwner({
          title: '📅 New Appointment Booking',
          content: `New appointment booked!\n\nCustomer: ${input.customerName || ctx.user.name || 'Unknown'}\nService: ${service.name}\nDate: ${appointmentDate.toLocaleDateString()}\nTime: ${appointmentDate.toLocaleTimeString()}\n\nPlease review and confirm the appointment.`,
        });
        
        return result;
      }),
    
    // Get user's appointments
    myAppointments: protectedProcedure.query(async ({ ctx }) => {
      const appointments = await db.getAppointmentsByUser(ctx.user.id);
      
      // Enrich with service details
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const service = await db.getServiceById(apt.serviceId);
        return { ...apt, service };
      }));
      
      return enriched;
    }),
    
    // Get user's upcoming appointments
    myUpcoming: protectedProcedure.query(async ({ ctx }) => {
      const appointments = await db.getUpcomingAppointmentsByUser(ctx.user.id);
      
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const service = await db.getServiceById(apt.serviceId);
        return { ...apt, service };
      }));
      
      return enriched;
    }),
    
    // Cancel appointment (by user)
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
        }
        
        if (appointment.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        
        await db.updateAppointmentStatus(input.id, 'cancelled');
        return { success: true };
      }),
    
    // Admin: Get all appointments
    listAll: adminProcedure.query(async () => {
      const appointments = await db.getAllAppointments();
      
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const service = await db.getServiceById(apt.serviceId);
        const user = await db.getUserById(apt.userId);
        return { ...apt, service, user };
      }));
      
      return enriched;
    }),
    
    // Admin: Get upcoming appointments
    upcoming: adminProcedure.query(async () => {
      const appointments = await db.getUpcomingAppointments();
      
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const service = await db.getServiceById(apt.serviceId);
        const user = await db.getUserById(apt.userId);
        return { ...apt, service, user };
      }));
      
      return enriched;
    }),
    
    // Admin: Get pending appointments
    pending: adminProcedure.query(async () => {
      const appointments = await db.getPendingAppointments();
      
      const enriched = await Promise.all(appointments.map(async (apt) => {
        const service = await db.getServiceById(apt.serviceId);
        const user = await db.getUserById(apt.userId);
        return { ...apt, service, user };
      }));
      
      return enriched;
    }),
    
    // Admin: Update appointment status
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
      }))
      .mutation(async ({ input }) => {
        await db.updateAppointmentStatus(input.id, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
