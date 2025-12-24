import type { Express, Request, Response } from "express";

// OAuth routes are no longer needed - using phone-based authentication
export function registerOAuthRoutes(app: Express) {
  // Redirect any OAuth attempts to home page
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    res.redirect(302, "/");
  });
}
