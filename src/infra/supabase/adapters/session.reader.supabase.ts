import "server-only";
import { supabaseServerRSC, supabaseServerAction } from "../client";
import type { SessionReader } from "@/core/ports/SeesionReader";

/** Version pour RSC/layouts si jamais tu en as besoin dans un usecase */
export function makeSessionReaderRSC(): SessionReader {
  return {
    async currentUserId() {
      const sb = await supabaseServerRSC();
      const { data: { user } } = await sb.auth.getUser();
      return user?.id ?? null;
    },
  };
}

/** Version pour Server Actions / Route Handlers */
export function makeSessionReaderAction(): SessionReader {
  return {
    async currentUserId() {
      const sb = await supabaseServerAction();
      const { data: { user } } = await sb.auth.getUser();
      return user?.id ?? null;
    },
  };
}

