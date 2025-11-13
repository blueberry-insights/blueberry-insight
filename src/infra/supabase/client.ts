import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function supabaseServerRSC() {
  const jar = await cookies(); 
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (_cookiesToSet) => {},
    },
  });
}


export async function supabaseServerAction() {
  const jar = await cookies(); 
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          jar.set(name, value, options);
        }
      },
    },
  });
}
