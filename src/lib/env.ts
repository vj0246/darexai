import { z } from "zod";

// Fail-fast env validation. Throws at boot if misconfigured.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be >=32 chars"),
  ACCESS_TTL: z.coerce.number().default(900),
  REFRESH_TTL: z.coerce.number().default(1209600),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  DEV_LOGIN: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
});

export const env = schema.parse(process.env);
export const liveWhatsApp = () => !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID);
export const liveGemini = () => !!env.GEMINI_API_KEY;
