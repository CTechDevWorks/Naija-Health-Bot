/**
 * Accounts: email + password, then a code from an authenticator app.
 *
 * Signing in is optional. Two-factor is not: an account only counts as signed
 * in ("ready") once the session has passed the authenticator step. Until then
 * the rest of the app treats the person as a guest.
 */
import type { AuthError, Session } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { getSupabase, isAccountsConfigured } from "@/services/supabase";

export type AuthStatus =
  /** Supabase is not configured; the app runs without accounts. */
  | "disabled"
  /** Checking for a stored session. */
  | "loading"
  | "guest"
  /** Password accepted; the account has no authenticator yet and must add one. */
  | "enrol"
  /** Password accepted; waiting for the authenticator code. */
  | "challenge"
  /** Signed in with both factors. */
  | "ready";

export type Outcome =
  | { ok: true; needsEmailCode?: boolean }
  | { ok: false; message: string };

export type Enrolment =
  | { ok: true; factorId: string; qr: string; secret: string; uri: string }
  | { ok: false; message: string };

type AuthContext = {
  status: AuthStatus;
  email: string | null;
  userId: string | null;
  signIn: (email: string, password: string) => Promise<Outcome>;
  signUp: (email: string, password: string) => Promise<Outcome>;
  confirmEmail: (email: string, code: string) => Promise<Outcome>;
  resendEmailCode: (email: string) => Promise<Outcome>;
  startEnrolment: () => Promise<Enrolment>;
  finishEnrolment: (factorId: string, code: string) => Promise<Outcome>;
  verifyCode: (code: string) => Promise<Outcome>;
  signOut: () => Promise<void>;
  /** The token to send to the 9ja Health API, or null unless fully signed in. */
  getAccessToken: () => Promise<string | null>;
};

export const MIN_PASSWORD_LENGTH = 8;

const NOT_SET_UP = "Accounts are not set up in this build yet.";
const UNREACHABLE =
  "Could not reach the sign-in service. Check your connection and try again.";

const Context = createContext<AuthContext | null>(null);

function assuranceLevel(session: Session): string | null {
  try {
    const payload = session.access_token.split(".")[1] ?? "";
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const aal = JSON.parse(json).aal;
    return typeof aal === "string" ? aal : null;
  } catch {
    return null;
  }
}

function statusFor(session: Session | null): AuthStatus {
  if (!session) return "guest";
  if (assuranceLevel(session) === "aal2") return "ready";
  const hasAuthenticator = (session.user.factors ?? []).some(
    (factor) => factor.factor_type === "totp" && factor.status === "verified",
  );
  return hasAuthenticator ? "challenge" : "enrol";
}

function explain(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email or password is not right.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Sign in instead.";
    case "weak_password":
      return `Choose a stronger password of at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "email_address_invalid":
    case "validation_failed":
      return "Check the email address and try again.";
    case "otp_expired":
      return "That code is wrong or has expired. Ask for a new one.";
    case "mfa_verification_failed":
    case "mfa_challenge_expired":
      return "That code is not right. Check your authenticator app and try again.";
    case "over_email_send_rate_limit":
      return "Too many emails were requested. Please wait a few minutes and try again.";
    case "over_request_rate_limit":
    case "mfa_verification_rejected":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Creating accounts is switched off for this app at the moment.";
    case "mfa_totp_enroll_not_enabled":
    case "mfa_totp_verify_not_enabled":
      return "Authenticator sign-in is switched off for this app at the moment.";
    case "session_expired":
    case "session_not_found":
    case "refresh_token_not_found":
      return "Your session has ended. Please sign in again.";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return UNREACHABLE;
  }
  // The raw text can be technical; it is only useful while setting the app up.
  return __DEV__ && error.code
    ? `Something went wrong (${error.code}). Please try again.`
    : "Something went wrong. Please try again.";
}

async function attempt(
  run: () => Promise<{ error: AuthError | null }>,
): Promise<Outcome> {
  try {
    const { error } = await run();
    return error ? { ok: false, message: explain(error) } : { ok: true };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // The listener must not call Supabase itself (that can deadlock), so the
    // sign-in level is read straight from the session it hands over.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setChecked(true);
    });

    // Refresh the session while the app is open, and stop when it is not.
    const appState =
      Platform.OS === "web"
        ? null
        : AppState.addEventListener("change", (state) => {
            if (state === "active") void supabase.auth.startAutoRefresh();
            else void supabase.auth.stopAutoRefresh();
          });

    return () => {
      data.subscription.unsubscribe();
      appState?.remove();
    };
  }, []);

  const status: AuthStatus = !isAccountsConfigured()
    ? "disabled"
    : checked
      ? statusFor(session)
      : "loading";

  async function signIn(email: string, password: string): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error) return { ok: true };
      if (error.code === "email_not_confirmed") {
        await supabase.auth.resend({ type: "signup", email: email.trim() });
        return { ok: true, needsEmailCode: true };
      }
      return { ok: false, message: explain(error) };
    } catch {
      return { ok: false, message: UNREACHABLE };
    }
  }

  async function signUp(email: string, password: string): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, message: explain(error) };
      // No session yet means Supabase is waiting for the emailed code.
      return { ok: true, needsEmailCode: !data.session };
    } catch {
      return { ok: false, message: UNREACHABLE };
    }
  }

  async function confirmEmail(email: string, code: string): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    return attempt(() =>
      supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      }),
    );
  }

  async function resendEmailCode(email: string): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    return attempt(() =>
      supabase.auth.resend({ type: "signup", email: email.trim() }),
    );
  }

  async function startEnrolment(): Promise<Enrolment> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    try {
      // A set-up that was started and abandoned leaves a half-made entry
      // behind; clear those so the new one is the only one.
      const existing = await supabase.auth.mfa.listFactors();
      for (const factor of existing.data?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "9ja Health",
        // Names must be unique per account; the suffix only avoids a clash.
        friendlyName: `Authenticator app ${Date.now().toString(36)}`,
      });
      if (error) return { ok: false, message: explain(error) };
      return {
        ok: true,
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };
    } catch {
      return { ok: false, message: UNREACHABLE };
    }
  }

  async function finishEnrolment(
    factorId: string,
    code: string,
  ): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    return attempt(() =>
      supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() }),
    );
  }

  async function verifyCode(code: string): Promise<Outcome> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, message: NOT_SET_UP };
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) return { ok: false, message: explain(factors.error) };
      const factor = factors.data.totp[0];
      if (!factor) {
        return {
          ok: false,
          message: "No authenticator is set up for this account.",
        };
      }
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: code.trim(),
      });
      return error ? { ok: false, message: explain(error) } : { ok: true };
    } catch {
      return { ok: false, message: UNREACHABLE };
    }
  }

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      // This device only; other devices stay signed in.
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Signing out locally still clears the stored session.
    }
    setSession(null);
  }

  async function getAccessToken(): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      // getSession refreshes the token first when it is about to expire.
      const { data } = await supabase.auth.getSession();
      if (!data.session || assuranceLevel(data.session) !== "aal2") return null;
      return data.session.access_token;
    } catch {
      return null;
    }
  }

  return (
    <Context.Provider
      value={{
        status,
        email: session?.user.email ?? null,
        userId: session?.user.id ?? null,
        signIn,
        signUp,
        confirmEmail,
        resendEmailCode,
        startEnrolment,
        finishEnrolment,
        verifyCode,
        signOut,
        getAccessToken,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
