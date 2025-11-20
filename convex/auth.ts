import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { logger } from "../src/utils/logger";

// Read environment variables at runtime to ensure they're available in all contexts
const getSiteUrl = () => process.env.SITE_URL!;
const getEmailWebhookUrl = () => process.env.TRANSACTIONAL_EMAIL_URL;
const getEmailWebhookToken = () => process.env.TRANSACTIONAL_EMAIL_TOKEN;
const getEmailProvider = () =>
  process.env.TRANSACTIONAL_EMAIL_PROVIDER?.toLowerCase() ?? "webhook";
const getEmailFromAddress = () =>
  process.env.TRANSACTIONAL_EMAIL_FROM ?? "Kind Platform <no-reply@kind.com>";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
}: EmailPayload) {
  const emailWebhookUrl = getEmailWebhookUrl();
  const emailWebhookToken = getEmailWebhookToken();
  const emailProvider = getEmailProvider();
  const emailFromAddress = getEmailFromAddress();

  if (!emailWebhookUrl) {
    logger.warn(
      "TRANSACTIONAL_EMAIL_URL is not configured. Skipping verification email dispatch."
    );
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(emailWebhookToken
      ? { Authorization: `Bearer ${emailWebhookToken}` }
      : {}),
  };

  const { fromEmail, fromName } = parseFromAddress(emailFromAddress);
  const body =
    emailProvider === "sendgrid"
      ? buildSendgridPayload({
          to,
          subject,
          text,
          html,
          fromEmail,
          fromName,
        })
      : {
          from: emailFromAddress,
          to,
          subject,
          text,
          html,
        };

  try {
    const response = await fetch(emailWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error("Failed to send verification email", {
        status: response.status,
        body,
      });
    }
  } catch (error) {
    logger.error("Unexpected error while sending verification email", error);
  }
}

function parseFromAddress(address: string) {
  const match = address.match(/^(.*)<(.+@.+\..+)>$/);
  if (!match) {
    return { fromName: undefined, fromEmail: address.trim() };
  }
  return { fromName: match[1].trim(), fromEmail: match[2].trim() };
}

function buildSendgridPayload({
  to,
  subject,
  text,
  html,
  fromEmail,
  fromName,
}: EmailPayload & { fromEmail: string; fromName?: string }) {
  return {
    personalizations: [{ to: [{ email: to }] }],
    from: fromName
      ? { email: fromEmail, name: fromName }
      : { email: fromEmail },
    subject,
    content: [
      { type: "text/plain", value: text },
      { type: "text/html", value: html },
    ],
  };
}

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
// Note: components.betterAuth will be available after running `npx convex dev`
export const authComponent = createClient<DataModel>(
  (components as any).betterAuth
);

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  // Read environment variables at runtime
  const siteUrl = getSiteUrl();

  // Validate required environment variables
  if (!siteUrl) {
    logger.error("SITE_URL is not set in environment variables");
    throw new Error("SITE_URL is required for Better Auth");
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Only validate Google OAuth credentials if not in optionsOnly mode
  // (optionsOnly is used during static analysis, where env vars might not be available)
  if (!optionsOnly && (!googleClientId || !googleClientSecret)) {
    logger.error(
      "Google OAuth credentials not available in createAuth context",
      {
        hasGoogleClientId: !!googleClientId,
        hasGoogleClientSecret: !!googleClientSecret,
      }
    );
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be available"
    );
  }

  // For optionsOnly mode, use placeholder values to allow static analysis
  // These will be validated at runtime when actually used
  const finalClientId = googleClientId || (optionsOnly ? "placeholder" : "");
  const finalClientSecret =
    googleClientSecret || (optionsOnly ? "placeholder" : "");

  return betterAuth({
    // Disable Better Auth's internal logging to reduce noise
    // Enable only when debugging OAuth issues
    logger: {
      disabled: true,
    },
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure email/password with verification
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const currentSiteUrl = getSiteUrl();
        const verificationUrl =
          url || `${currentSiteUrl}/email-confirmation-callback`;
        const recipient = user.email;

        if (!recipient) {
          logger.warn(
            "Attempted to send verification email without a recipient"
          );
          return;
        }

        const subject = "Verify your Kind account";
        const text = `Hi ${
          user.name ?? "there"
        },\n\nWelcome to Kind! Please confirm your email by visiting this link: ${verificationUrl}\n\nIf you did not create an account, please ignore this message.`;
        const html = `<p>Hi ${user.name ?? "there"},</p>
<p>Welcome to Kind! Please confirm your email address to unlock the rest of your onboarding.</p>
<p><a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="color:#CB0000;font-weight:bold;">Verify my email</a></p>
<p>If you did not request this, you can safely ignore this email.</p>`;

        await sendTransactionalEmail({
          to: recipient,
          subject,
          text,
          html,
        });
      },
    },
    // Configure Google OAuth
    socialProviders: {
      google: {
        clientId: finalClientId,
        clientSecret: finalClientSecret,
        // Map Google profile to user data
        mapProfileToUser: (profile: any) => {
          // Extract first and last name from Google profile
          const nameParts = (profile.name || "").split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          return {
            name: profile.name || "",
            email: profile.email || "",
            image: profile.picture || profile.image || null,
            emailVerified:
              profile.email_verified || profile.verified_email || false,
            // Additional fields that will be stored in Convex users table
            // Note: Better Auth only stores basic fields, extended data goes to Convex
          };
        },
        // Override user info on sign-in to keep profile updated
        overrideUserInfoOnSignIn: true,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex(),
    ],
  });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
