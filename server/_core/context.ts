import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'barber-secret-key');

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function authenticateRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    // Get cookie from request
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    
    if (!userId) return null;
    
    // Get user from database
    const user = await db.getUserById(userId);
    return user || null;
  } catch (error) {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
