import { logger } from "@/utils/logger";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getEmailWebhookUrl(): string | null {
  return process.env.TRANSACTIONAL_EMAIL_URL || null;
}

function getEmailWebhookToken(): string | null {
  return process.env.TRANSACTIONAL_EMAIL_TOKEN || null;
}

function getEmailProvider(): string {
  return process.env.EMAIL_PROVIDER || "resend";
}

function getEmailFromAddress(): string {
  return (
    process.env.EMAIL_FROM_ADDRESS ||
    process.env.TRANSACTIONAL_EMAIL_FROM ||
    "Kind <noreply@kind.com>"
  );
}

function parseFromAddress(address: string) {
  const match = address.match(/^(.*)<(.+@.+\..+)>$/);
  if (!match) {
    return { fromName: undefined, fromEmail: address };
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

async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
}: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const emailWebhookUrl = getEmailWebhookUrl();
  const emailWebhookToken = getEmailWebhookToken();
  const emailProvider = getEmailProvider();
  const emailFromAddress = getEmailFromAddress();

  if (!emailWebhookUrl) {
    logger.warn(
      "TRANSACTIONAL_EMAIL_URL is not configured. Skipping email dispatch."
    );
    return { success: false, error: "Email service not configured" };
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
      logger.error("Failed to send email", {
        status: response.status,
        body,
        to,
        subject,
      });
      return {
        success: false,
        error: `Email service returned ${response.status}`,
      };
    }

    logger.info("Email sent successfully", { to, subject });
    return { success: true };
  } catch (error) {
    logger.error("Unexpected error while sending email", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Email templates for subscription and purchase notifications
 */
export const EmailService = {
  /**
   * Send subscription activation email
   */
  async sendSubscriptionActivatedEmail(
    userEmail: string,
    userName: string | null,
    planName: string,
    amount: number,
    currency: string
  ) {
    const name = userName || "there";
    const subject = `Welcome to ${planName}! Your subscription is active`;
    const text = `Hi ${name},\n\nGreat news! Your ${planName} subscription is now active.\n\nSubscription Details:\n- Plan: ${planName}\n- Amount: ${currency} ${amount.toLocaleString()}\n- Billing: Monthly\n\nYou now have access to all the features included in your plan. If you have any questions, feel free to reach out to our support team.\n\nThank you for choosing Kind!\n\nThe Kind Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #CB0000;">Welcome to ${planName}!</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your <strong>${planName}</strong> subscription is now active.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Subscription Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</li>
            <li style="margin: 10px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
            <li style="margin: 10px 0;"><strong>Billing:</strong> Monthly</li>
          </ul>
        </div>
        <p>You now have access to all the features included in your plan. If you have any questions, feel free to reach out to our support team.</p>
        <p>Thank you for choosing Kind!</p>
        <p style="margin-top: 30px;">The Kind Team</p>
      </div>
    `;

    return await sendTransactionalEmail({ to: userEmail, subject, text, html });
  },

  /**
   * Send credit purchase confirmation email
   */
  async sendCreditPurchaseEmail(
    userEmail: string,
    userName: string | null,
    creditType: string,
    quantity: number,
    amount: number,
    currency: string
  ) {
    const name = userName || "there";
    const creditLabel =
      creditType === "swipe_credits" ? "Swipe Credits" : "Boost Credits";
    const subject = `Your ${creditLabel} purchase is confirmed`;
    const text = `Hi ${name},\n\nThank you for your purchase! Your ${creditLabel} have been added to your account.\n\nPurchase Details:\n- Type: ${creditLabel}\n- Quantity: ${quantity === -1 ? "Unlimited" : quantity}\n- Amount: ${currency} ${amount.toLocaleString()}\n\nYou can now use your credits to enhance your experience on Kind. If you have any questions, feel free to reach out to our support team.\n\nThank you for choosing Kind!\n\nThe Kind Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #CB0000;">Purchase Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your purchase! Your <strong>${creditLabel}</strong> have been added to your account.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Purchase Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Type:</strong> ${creditLabel}</li>
            <li style="margin: 10px 0;"><strong>Quantity:</strong> ${quantity === -1 ? "Unlimited" : quantity}</li>
            <li style="margin: 10px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
          </ul>
        </div>
        <p>You can now use your credits to enhance your experience on Kind. If you have any questions, feel free to reach out to our support team.</p>
        <p>Thank you for choosing Kind!</p>
        <p style="margin-top: 30px;">The Kind Team</p>
      </div>
    `;

    return await sendTransactionalEmail({ to: userEmail, subject, text, html });
  },

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(
    userEmail: string,
    userName: string | null,
    planName: string,
    amount: number,
    currency: string,
    retryDate?: string
  ) {
    const name = userName || "there";
    const subject = `Payment failed for your ${planName} subscription`;
    const text = `Hi ${name},\n\nWe were unable to process your payment for your ${planName} subscription.\n\nSubscription Details:\n- Plan: ${planName}\n- Amount: ${currency} ${amount.toLocaleString()}\n${retryDate ? `- Next retry: ${retryDate}\n` : ""}\nPlease update your payment method to avoid service interruption. You can update your payment information in your account settings.\n\nIf you continue to experience issues, please contact our support team for assistance.\n\nThank you,\nThe Kind Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #CB0000;">Payment Failed</h2>
        <p>Hi ${name},</p>
        <p>We were unable to process your payment for your <strong>${planName}</strong> subscription.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">Subscription Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</li>
            <li style="margin: 10px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
            ${retryDate ? `<li style="margin: 10px 0;"><strong>Next retry:</strong> ${retryDate}</li>` : ""}
          </ul>
        </div>
        <p>Please update your payment method to avoid service interruption. You can update your payment information in your account settings.</p>
        <p style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kind.com"}/settings?tab=subscriptions" style="background-color: #CB0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Update Payment Method</a>
        </p>
        <p>If you continue to experience issues, please contact our support team for assistance.</p>
        <p>Thank you,<br>The Kind Team</p>
      </div>
    `;

    return await sendTransactionalEmail({ to: userEmail, subject, text, html });
  },

  /**
   * Send upcoming invoice email
   */
  async sendUpcomingInvoiceEmail(
    userEmail: string,
    userName: string | null,
    planName: string,
    amount: number,
    currency: string,
    dueDate: string
  ) {
    const name = userName || "there";
    const subject = `Upcoming invoice for your ${planName} subscription`;
    const text = `Hi ${name},\n\nThis is a reminder that your ${planName} subscription will be renewed soon.\n\nInvoice Details:\n- Plan: ${planName}\n- Amount: ${currency} ${amount.toLocaleString()}\n- Due Date: ${dueDate}\n\nYour payment method on file will be charged automatically. If you need to update your payment information, please do so before the due date.\n\nThank you for being a valued member of Kind!\n\nThe Kind Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #CB0000;">Upcoming Invoice</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder that your <strong>${planName}</strong> subscription will be renewed soon.</p>
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <h3 style="margin-top: 0;">Invoice Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</li>
            <li style="margin: 10px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
            <li style="margin: 10px 0;"><strong>Due Date:</strong> ${dueDate}</li>
          </ul>
        </div>
        <p>Your payment method on file will be charged automatically. If you need to update your payment information, please do so before the due date.</p>
        <p style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kind.com"}/settings?tab=subscriptions" style="background-color: #CB0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Manage Subscription</a>
        </p>
        <p>Thank you for being a valued member of Kind!</p>
        <p style="margin-top: 30px;">The Kind Team</p>
      </div>
    `;

    return await sendTransactionalEmail({ to: userEmail, subject, text, html });
  },

  /**
   * Send subscription cancelled email
   */
  async sendSubscriptionCancelledEmail(
    userEmail: string,
    userName: string | null,
    planName: string,
    endDate: string
  ) {
    const name = userName || "there";
    const subject = `Your ${planName} subscription has been cancelled`;
    const text = `Hi ${name},\n\nYour ${planName} subscription has been cancelled and will remain active until ${endDate}.\n\nAfter this date, you'll be moved to the Free plan and will lose access to premium features. If you change your mind, you can reactivate your subscription anytime before ${endDate}.\n\nWe're sorry to see you go! If you have any feedback about how we can improve, please let us know.\n\nThank you for being part of the Kind community!\n\nThe Kind Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #CB0000;">Subscription Cancelled</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${planName}</strong> subscription has been cancelled and will remain active until <strong>${endDate}</strong>.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">After this date, you'll be moved to the Free plan and will lose access to premium features. If you change your mind, you can reactivate your subscription anytime before ${endDate}.</p>
        </div>
        <p style="margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://kind.com"}/settings?tab=subscriptions" style="background-color: #CB0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reactivate Subscription</a>
        </p>
        <p>We're sorry to see you go! If you have any feedback about how we can improve, please let us know.</p>
        <p>Thank you for being part of the Kind community!</p>
        <p style="margin-top: 30px;">The Kind Team</p>
      </div>
    `;

    return await sendTransactionalEmail({ to: userEmail, subject, text, html });
  },
};

