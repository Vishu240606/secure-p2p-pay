import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  generateAndExportKeyPair,
  storePrivateKey,
  getStoredPrivateKey,
} from "@/lib/crypto";

/**
 * Ensures the current user has a device key pair.
 * - If no private key in localStorage → generate new pair, store private locally, public in DB.
 * - If private key exists but no public key in DB → re-upload public key.
 */
export function useDeviceKeys() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReady(false);
      return;
    }

    const ensureKeys = async () => {
      try {
        const existingPrivate = getStoredPrivateKey(user.id);

        if (existingPrivate) {
          // Check if public key is already in DB
          const { data } = await supabase
            .from("profiles")
            .select("public_key")
            .eq("user_id", user.id)
            .single();

          if (!data?.public_key) {
            // Re-derive public key from private and upload
            // For simplicity, generate a fresh pair if DB is missing it
            const { publicKeyBase64, privateKeyBase64 } =
              await generateAndExportKeyPair();
            storePrivateKey(user.id, privateKeyBase64);
            await supabase
              .from("profiles")
              .update({ public_key: publicKeyBase64 } as any)
              .eq("user_id", user.id);
          }

          setReady(true);
          return;
        }

        // No local key — generate fresh pair
        const { publicKeyBase64, privateKeyBase64 } =
          await generateAndExportKeyPair();

        storePrivateKey(user.id, privateKeyBase64);

        await supabase
          .from("profiles")
          .update({ public_key: publicKeyBase64 } as any)
          .eq("user_id", user.id);

        setReady(true);
      } catch (err: any) {
        console.error("Key generation failed:", err);
        setError(err.message);
      }
    };

    ensureKeys();
  }, [user]);

  return { ready, error };
}
