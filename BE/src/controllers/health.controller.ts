import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

async function checkDb(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const reply = await redis.ping();
    return reply === "PONG";
  } catch {
    return false;
  }
}

export async function getHealth(req: Request, res: Response) {
  const [dbOk, redisOk] = await Promise.all([checkDb(), checkRedis()]);

  const status = dbOk && redisOk ? 200 : 503;

  res.status(status).json({
    db: dbOk ? "ok" : "error",
    redis: redisOk ? "ok" : "error",
  });
}
