import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Field,
  Screen,
  ui,
} from "@/components/healthUi";
import { HealthIcon } from "@/components/healthIcon";
import { layout, palette, radius, space } from "@/constants/designTokens";
import { Enrolment, MIN_PASSWORD_LENGTH, useAuth } from "@/hooks/useAuth";

const headings = {
  disabled: {
    title: "Accounts",
    subtitle: "Not switched on in this build.",
  },
  loading: { title: "Your account", subtitle: "One moment…" },
  guest: {
    title: "Your account",
    subtitle: "Optional. Sign in to keep your conversations.",
  },
  enrol: {
    title: "Add your authenticator",
    subtitle: "One more step to protect your account.",
  },
  challenge: {
    title: "Enter your code",
    subtitle: "From your authenticator app.",
  },
  ready: { title: "Your account", subtitle: "Signed in with two factors." },
};

export default function AccountScreen() {
  const { status } = useAuth();
  const heading = headings[status];
  return (
    <Screen
      title={heading.title}
      subtitle={heading.subtitle}
      back
      backTo="/profile"
    >
      {status === "disabled" && <NotSetUp />}
      {status === "loading" && <ActivityIndicator color={palette.forest} />}
      {status === "guest" && <SignInOrCreate />}
      {status === "enrol" && <AddAuthenticator />}
      {status === "challenge" && <EnterAuthenticatorCode />}
      {status === "ready" && <SignedIn />}
    </Screen>
  );
}

function NotSetUp() {
  return (
    <Card>
      <HealthIcon name="info" />
      <AppText variant="heading" tone="forest">
        Accounts are not set up yet.
      </AppText>
      <AppText tone="body">
        You can use everything in 9ja Health without an account. Saving
        conversations will be available once sign-in is switched on.
      </AppText>
      <Button icon="chat" onPress={() => router.replace("/assistant")}>
        Open the assistant
      </Button>
    </Card>
  );
}

function Problem({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.problem}>
      <HealthIcon name="alert" size={layout.smallIcon} />
      <AppText variant="small" style={ui.flex}>
        {message}
      </AppText>
    </View>
  );
}

function SignInOrCreate() {
  const auth = useAuth();
  const [mode, setMode] = useState<"signin" | "create" | "code">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");

  const emailLooksRight = /^\S+@\S+\.\S+$/.test(email.trim());

  function change(next: "signin" | "create" | "code") {
    setMode(next);
    setProblem("");
    setNotice("");
    setCode("");
  }

  async function submit() {
    setProblem("");
    if (!emailLooksRight) {
      setProblem("Enter your email address.");
      return;
    }
    if (mode === "create") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setProblem(
          `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
        );
        return;
      }
      if (password !== repeat) {
        setProblem("The two passwords do not match.");
        return;
      }
    } else if (!password) {
      setProblem("Enter your password.");
      return;
    }

    setBusy(true);
    const result =
      mode === "create"
        ? await auth.signUp(email, password)
        : await auth.signIn(email, password);
    setBusy(false);

    if (!result.ok) {
      setProblem(result.message);
      return;
    }
    // Otherwise the screen moves on by itself once the session arrives.
    if (result.needsEmailCode) {
      setPassword("");
      setRepeat("");
      change("code");
    }
  }

  async function confirm() {
    setProblem("");
    setNotice("");
    setBusy(true);
    const result = await auth.confirmEmail(email, code);
    setBusy(false);
    if (!result.ok) setProblem(result.message);
  }

  async function resend() {
    setProblem("");
    setNotice("");
    setBusy(true);
    const result = await auth.resendEmailCode(email);
    setBusy(false);
    if (result.ok) setNotice("A new code is on its way.");
    else setProblem(result.message);
  }

  if (mode === "code") {
    return (
      <>
        <Card>
          <AppText variant="heading" tone="forest">
            Check your email
          </AppText>
          <AppText tone="body">
            If {email.trim()} is new to 9ja Health, we have sent it a code.
            Enter the code to confirm the address. It can take a minute to
            arrive; check your spam folder too.
          </AppText>
          <Field
            label="Code from the email"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            onSubmitEditing={confirm}
          />
          <Problem message={problem} />
          {!!notice && (
            <AppText variant="small" tone="forest">
              {notice}
            </AppText>
          )}
          <Button onPress={confirm} loading={busy} disabled={code.length < 6}>
            Confirm email
          </Button>
          <Button secondary onPress={resend} disabled={busy}>
            Send a new code
          </Button>
        </Card>
        <AppText variant="caption" tone="body">
          Already have an account with this email? No code is sent in that
          case. Go back and sign in instead.
        </AppText>
        <Button secondary onPress={() => change("signin")}>
          Back to sign in
        </Button>
      </>
    );
  }

  const creating = mode === "create";
  return (
    <>
      <Card>
        <AppText variant="heading" tone="forest">
          {creating ? "Create an account" : "Sign in"}
        </AppText>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={creating ? "new-password" : "current-password"}
          textContentType={creating ? "newPassword" : "password"}
          hint={
            creating ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined
          }
          onSubmitEditing={creating ? undefined : submit}
        />
        {creating && (
          <Field
            label="Repeat password"
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={submit}
          />
        )}
        <Problem message={problem} />
        <Button onPress={submit} loading={busy}>
          {creating ? "Create account" : "Sign in"}
        </Button>
        <Button
          secondary
          disabled={busy}
          onPress={() => change(creating ? "signin" : "create")}
        >
          {creating ? "I already have an account" : "Create an account"}
        </Button>
      </Card>
      <View style={ui.disclaimer}>
        <HealthIcon name="lock" size={layout.smallIcon} />
        <AppText variant="caption" tone="body" style={ui.flex}>
          Every account uses two steps to sign in: your password, then a code
          from an authenticator app such as Google Authenticator. You will set
          that up next. You can keep using 9ja Health without an account;
          conversations are only saved when you are signed in.
        </AppText>
      </View>
    </>
  );
}

/** "ABCDEFGH" → "ABCD EFGH", easier to type by hand. */
function grouped(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

function AddAuthenticator() {
  const auth = useAuth();
  const [setup, setSetup] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [noApp, setNoApp] = useState(false);
  const started = useRef(false);

  async function begin() {
    setSetup(null);
    setProblem("");
    setSetup(await auth.startEnrolment());
  }

  useEffect(() => {
    // Each call replaces the previous set-up key, so it must run only once.
    if (started.current) return;
    started.current = true;
    void auth.startEnrolment().then(setSetup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish() {
    if (!setup?.ok) return;
    setProblem("");
    setBusy(true);
    const result = await auth.finishEnrolment(setup.factorId, code);
    setBusy(false);
    if (!result.ok) setProblem(result.message);
  }

  if (!setup) {
    return (
      <Card>
        <ActivityIndicator color={palette.forest} />
        <AppText tone="body" style={styles.center}>
          Preparing your set-up key…
        </AppText>
      </Card>
    );
  }

  if (!setup.ok) {
    return (
      <Card>
        <Problem message={setup.message} />
        <Button onPress={begin}>Try again</Button>
        <Button secondary onPress={() => void auth.signOut()}>
          Sign out
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Badge>STEP 1</Badge>
        <AppText variant="heading" tone="forest">
          Add 9ja Health to your authenticator app
        </AppText>
        <AppText tone="body">
          Use an app such as Google Authenticator, Microsoft Authenticator or
          Authy. If it is on this phone, open it with the button below. If it is
          on another device, scan the code.
        </AppText>
        <Button
          icon="external"
          onPress={() => Linking.openURL(setup.uri).catch(() => setNoApp(true))}
        >
          Open my authenticator app
        </Button>
        {noApp && (
          <AppText variant="caption">
            No authenticator app opened. Install one, or type the set-up key
            below into it by hand.
          </AppText>
        )}
        <View style={styles.qr}>
          <Image
            accessibilityLabel="QR code to scan with an authenticator app"
            source={{ uri: setup.qr }}
            style={styles.qrImage}
            contentFit="contain"
          />
        </View>
        <AppText variant="label">Set-up key, to type in by hand</AppText>
        <AppText selectable style={styles.secret}>
          {grouped(setup.secret)}
        </AppText>
        <AppText variant="caption" tone="body">
          Keep this key private. Anyone who has it can produce your codes.
        </AppText>
      </Card>
      <Card>
        <Badge>STEP 2</Badge>
        <AppText variant="heading" tone="forest">
          Enter the 6-digit code it shows
        </AppText>
        <Field
          label="Code from your authenticator app"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          onSubmitEditing={finish}
        />
        <Problem message={problem} />
        <Button onPress={finish} loading={busy} disabled={code.length !== 6}>
          Turn on two-factor sign-in
        </Button>
      </Card>
      <View style={ui.disclaimer}>
        <HealthIcon name="alert" size={layout.smallIcon} />
        <AppText variant="caption" tone="body" style={ui.flex}>
          You will need this authenticator every time you sign in. If you lose
          it, there is currently no way to get back into the account or its
          saved conversations. You can still use 9ja Health without signing in.
        </AppText>
      </View>
      <Button secondary onPress={() => void auth.signOut()}>
        Not now, sign out
      </Button>
    </>
  );
}

function EnterAuthenticatorCode() {
  const auth = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  async function verify() {
    setProblem("");
    setBusy(true);
    const result = await auth.verifyCode(code);
    setBusy(false);
    if (!result.ok) {
      setProblem(result.message);
      setCode("");
    }
  }

  return (
    <>
      <Card>
        <AppText variant="heading" tone="forest">
          Two-factor sign-in
        </AppText>
        <AppText tone="body">
          Open your authenticator app and enter the 6-digit code for 9ja Health
          {auth.email ? ` (${auth.email})` : ""}.
        </AppText>
        <Field
          label="Code from your authenticator app"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          autoFocus
          onSubmitEditing={verify}
        />
        <Problem message={problem} />
        <Button onPress={verify} loading={busy} disabled={code.length !== 6}>
          Verify and sign in
        </Button>
        <Button secondary disabled={busy} onPress={() => void auth.signOut()}>
          Sign out
        </Button>
      </Card>
      <AppText variant="caption" tone="body">
        Lost your authenticator? There is currently no way to recover the
        account without it. You can sign out and keep using 9ja Health as a
        guest.
      </AppText>
    </>
  );
}

function SignedIn() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Card style={styles.accountCard}>
        <View style={styles.avatar}>
          <AppText variant="title" tone="forest">
            {(auth.email ?? "?").charAt(0).toUpperCase()}
          </AppText>
        </View>
        <AppText variant="subheading" tone="forest" style={styles.center}>
          {auth.email}
        </AppText>
        {/* Badge pins itself to the left; the wrapper centres it in this card. */}
        <View style={styles.centered}>
          <Badge>TWO-FACTOR SIGN-IN ON</Badge>
        </View>
      </Card>
      <AppText tone="body">
        New conversations with the assistant are saved to this account. You can
        open or delete them from the Assistant tab.
      </AppText>
      <Button icon="chat" onPress={() => router.replace("/assistant")}>
        Open the assistant
      </Button>
      <Button
        secondary
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await auth.signOut();
          setBusy(false);
        }}
      >
        Sign out on this device
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  centered: { alignSelf: "center" },
  problem: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-start",
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: palette.cream,
  },
  qr: {
    alignSelf: "center",
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: layout.line,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  qrImage: { width: 200, height: 200 },
  secret: { letterSpacing: 1.5 },
  accountCard: {
    alignItems: "center",
    backgroundColor: palette.cream,
    borderColor: palette.cream,
    paddingVertical: space.xl,
  },
  avatar: {
    width: layout.heroIcon,
    height: layout.heroIcon,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
