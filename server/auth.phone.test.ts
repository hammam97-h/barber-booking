import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

type ClearedCookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createGuestContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: ClearedCookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: ClearedCookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

function createAuthContext(): { ctx: TrpcContext; clearedCookies: ClearedCookieCall[] } {
  const clearedCookies: ClearedCookieCall[] = [];

  const user = {
    id: 1,
    phone: "0501234567",
    name: "عميل تجريبي",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.phone", () => {
  describe("auth.me", () => {
    it("returns null for unauthenticated users", async () => {
      const { ctx } = createGuestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it("returns user data for authenticated users", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).not.toBeNull();
      expect(result?.phone).toBe("0501234567");
      expect(result?.name).toBe("عميل تجريبي");
    });
  });

  describe("auth.logout", () => {
    it("clears the session cookie and reports success", async () => {
      const { ctx, clearedCookies } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
      expect(clearedCookies[0]?.options).toMatchObject({
        maxAge: -1,
        secure: true,
        sameSite: "none",
        httpOnly: true,
        path: "/",
      });
    });
  });
});

describe("phone validation", () => {
  it("validates Saudi phone numbers correctly", () => {
    // Valid formats
    const validPhones = [
      "0501234567",
      "0551234567",
      "0591234567",
      "+966501234567",
    ];

    // Basic phone regex for Saudi numbers
    const phoneRegex = /^(\+966|0)5\d{8}$/;

    validPhones.forEach(phone => {
      expect(phoneRegex.test(phone)).toBe(true);
    });
  });

  it("rejects invalid phone numbers", () => {
    const invalidPhones = [
      "123456",
      "abcdefghij",
      "050123456", // too short
      "05012345678", // too long
    ];

    const phoneRegex = /^(\+966|0)5\d{8}$/;

    invalidPhones.forEach(phone => {
      expect(phoneRegex.test(phone)).toBe(false);
    });
  });
});
