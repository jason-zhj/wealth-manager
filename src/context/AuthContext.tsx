import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as guestApi from '../lib/guestApi';
import * as supabaseApi from '../lib/api';

const GUEST_MODE_KEY = 'wm_guest_mode';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  enterGuestMode: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Track whether the user was in guest mode before signing in so we can migrate.
  const wasGuestRef = useRef(false);

  useEffect(() => {
    // Restore guest flag from previous session before Supabase resolves.
    if (localStorage.getItem(GUEST_MODE_KEY) === 'true') {
      setIsGuest(true);
      wasGuestRef.current = true;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && wasGuestRef.current) {
        // User just signed in while in guest mode — migrate guest data to Supabase.
        migrateGuestData().finally(() => {
          wasGuestRef.current = false;
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem(GUEST_MODE_KEY);
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    wasGuestRef.current = true;
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signInWithGoogle, signOut, enterGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Migration helper ─────────────────────────────────────────────────────────

async function migrateGuestData(): Promise<void> {
  try {
    const [records, options] = await Promise.all([
      guestApi.fetchRecords(),
      guestApi.fetchCustomOptions(),
    ]);

    // Migrate custom options first so asset categories/places are available.
    for (const opt of options) {
      try {
        await supabaseApi.upsertCustomOption(opt.field_name, opt.value);
      } catch {
        // Non-fatal: ignore duplicate/conflict errors.
      }
    }

    // Migrate records oldest-first to preserve chronological order.
    for (const record of [...records].reverse()) {
      try {
        await supabaseApi.createRecord(record.date, record.record_items ?? []);
      } catch {
        // Non-fatal: skip records that fail to migrate.
      }
    }

    guestApi.clearGuestData();
  } catch {
    // Best-effort — don't block sign-in if migration fails.
  }
}
