
import { env } from "@/config/env";

export function isBlueberryAdmin(ctx: { orgId: string; role: string }) {
  return ctx.orgId === env.BLUEBERRY_ORG_ID && ctx.role === "blueberry_admin";
}
