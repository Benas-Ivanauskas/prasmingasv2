import { z } from "zod";

export const newsletterSubscribeSchema = z.object({
  email: z.string().email(),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
