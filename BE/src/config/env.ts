import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  jwtSecret: required("JWT_SECRET"),
  // Produkcijoje FRONTEND_URL PRIVALO būti nustatytas — jokio tylaus
  // atsarginio localhost varianto (tai būtų CORS saugumo spraga).
  frontendUrl: isProduction ? required("FRONTEND_URL") : (process.env.FRONTEND_URL ?? "http://localhost:5173"),
  logLevel: process.env.LOG_LEVEL ?? "debug",
  // Sąmoningai NE per required() — tuščias .env vis tiek turi leisti
  // serveriui paleisti (kol vartotojas prideda tikrus Paysera kredencialus),
  // tiesiog createPaymentUrl() tada suformuos technišką, bet neveikiantį URL.
  paysera: {
    projectId: process.env.PAYSERA_PROJECT_ID ?? "",
    signPassword: process.env.PAYSERA_SIGN_PASSWORD ?? "",
    testMode: (process.env.PAYSERA_TEST_MODE ?? "1") === "1",
    baseUrl: process.env.PAYSERA_BASE_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
    verifyCode: process.env.PAYSERA_VERIFY_CODE ?? "",
  },
  // Sąmoningai NE per required() — tas pats principas kaip Paysera aukščiau:
  // serveris paleidžiasi be tikrų SMTP kredencialų, tiesiog sendMail() mes
  // klaidą natūraliai, kol vartotojas prideda tikras reikšmes.
  email: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_SECURE ?? "0") === "1",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "Prasmingas <noreply@prasmingas.lt>",
  },
};
