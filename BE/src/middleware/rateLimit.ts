import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Per daug bandymų prisijungti. Bandykite vėliau." } },
});

// Viešam /api/discounts/validate — be auth, trumpi kodai, tad apsauga nuo
// brute-force perrinkimo.
export const codeValidateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Per daug bandymų. Bandykite vėliau." } },
});

// Viešam POST /api/departures/:id/hold — be auth; apsauga nuo
// piktnaudžiavimo (kažkas spamina vietas, kad "užimtų" jas kitiems).
// Dosnesnis už codeValidateRateLimit, nes teisėtas vartotojas gali kelis
// kartus pakeisti vietų pasirinkimą rinkdamasis.
export const holdRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Per daug bandymų. Bandykite vėliau." } },
});

// Viešam POST /api/orders/checkout — be auth, kuria realius DB įrašus ir
// kviečia išorinį Paysera API, tad griežtesnis už holdRateLimit.
export const checkoutRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Per daug bandymų apmokėti. Bandykite vėliau." } },
});
