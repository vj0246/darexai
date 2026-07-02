import { createHash, randomBytes } from "crypto";

// Refresh tokens are opaque random strings; only the hash is persisted.
export const newOpaqueToken = () => randomBytes(32).toString("base64url");
export const hashToken = (raw: string) =>
  createHash("sha256").update(raw).digest("hex");
