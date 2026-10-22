import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  // debug (ir warn/info) visada matomi abiejose aplinkose — webhook'ų
  // (Paysera) ir produkcijos debugginimui svarbu, kad info/debug nebūtų
  // nutildyti. Perrašoma per LOG_LEVEL, jei prireiktų pritildyti.
  level: env.logLevel,
  transport: { target: "pino-pretty", options: { colorize: true } },
});
