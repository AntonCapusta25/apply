import { RestaurantProfile } from '../types/onboarding';

const ADMIN_EMAIL = 'bangalexf@gmail.com';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const result = await res.json();
      return result.success;
    }
  } catch (err) {
    console.error('Failed to send email via SendGrid proxy:', err);
  }
  return false;
}

export async function sendOnboardingNotifications(restaurant: RestaurantProfile): Promise<{
  adminNotified: boolean;
  restaurantNotified: boolean;
}> {
  const offerName =
    restaurant.launchOffer === 'credits_3k'
      ? '€3,000 in Fee Credits'
      : '2 Months Free of Charge Usage (0% Commission)';

  // 1. Send Email to Admin (bangalexf@gmail.com)
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FAF8F5;">
      <div style="background-color: #4A2E1B; color: #FFFFFF; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">🍽️ New Restaurant Onboarded on Spoonfull!</h2>
      </div>

      <p style="font-size: 15px; color: #334155;">
        A new restaurant has completed the Spoonfull onboarding flow and is ready for POS delivery &amp; setup:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0;">
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; width: 40%; border-bottom: 1px solid #F1F5F9;">Restaurant:</td>
          <td style="padding: 10px 14px; font-weight: bold; color: #0F172A; border-bottom: 1px solid #F1F5F9;">${restaurant.restaurantName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Owner / Manager:</td>
          <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9;">${restaurant.ownerName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Phone / WhatsApp:</td>
          <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9;"><a href="tel:${restaurant.phone}" style="color: #4A2E1B; font-weight: bold;">${restaurant.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Email:</td>
          <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9;"><a href="mailto:${restaurant.email}" style="color: #4A2E1B;">${restaurant.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Location:</td>
          <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9;">${restaurant.city} (${restaurant.address})</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Selected Offer:</td>
          <td style="padding: 10px 14px; font-weight: bold; color: #059669; border-bottom: 1px solid #F1F5F9;">🎁 ${offerName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B; border-bottom: 1px solid #F1F5F9;">Free POS Machine:</td>
          <td style="padding: 10px 14px; color: #0F172A; border-bottom: 1px solid #F1F5F9;">✅ Provide POS Terminal &amp; Kitchen Printer</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #64748B;">Menu Dishes:</td>
          <td style="padding: 10px 14px; color: #0F172A;">${restaurant.dishes?.length || 0} dishes submitted</td>
        </tr>
      </table>

      <div style="background-color: #FDF3EE; border: 1px solid #FCD8C9; padding: 14px; border-radius: 8px; margin-top: 15px;">
        <strong style="color: #4A2E1B;">Action Item:</strong> Call ${restaurant.ownerName} at ${restaurant.phone} to confirm POS delivery address and schedule merchant provisioning.
      </div>

      <p style="font-size: 12px; color: #94A3B8; margin-top: 25px; text-align: center;">
        Spoonfull Partner CRM Automated Notification • Sent to ${ADMIN_EMAIL}
      </p>
    </div>
  `;

  const adminNotified = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🍽️ New Spoonfull Restaurant: ${restaurant.restaurantName} (${restaurant.city})`,
    htmlContent: adminHtml,
  });

  // 2. Send Welcome Confirmation Email to the Restaurant Owner
  let restaurantNotified = false;
  if (restaurant.email && restaurant.email.includes('@')) {
    const restaurantHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FAF8F5;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4A2E1B; margin: 0; font-size: 26px;">spoonfull</h1>
          <p style="color: #64748B; margin-top: 4px; font-size: 14px;">The Partner Platform for Netherlands Restaurants</p>
        </div>

        <div style="background: #FFFFFF; border-radius: 10px; padding: 24px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <h2 style="color: #0F172A; margin-top: 0; font-size: 18px;">Welcome to Spoonfull, ${restaurant.ownerName}!</h2>
          <p style="color: #334155; line-height: 1.5; font-size: 15px;">
            Thank you for onboarding <strong>${restaurant.restaurantName}</strong>. We received your menu and application details.
          </p>

          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin: 18px 0;">
            <div style="font-weight: bold; color: #065F46; font-size: 15px;">Your Selected Launch Package:</div>
            <div style="font-size: 17px; font-weight: bold; color: #047857; margin-top: 4px;">🎉 ${offerName}</div>
            <div style="font-size: 13px; color: #065F46; margin-top: 4px;">+ Free Touchscreen POS Machine &amp; Kitchen Receipt Printer</div>
          </div>

          <h3 style="color: #0F172A; font-size: 16px; margin-top: 20px;">What happens next?</h3>
          <ol style="color: #475569; padding-left: 20px; line-height: 1.6; font-size: 14px;">
            <li><strong>Hardware Dispatch:</strong> We are packing your complimentary Spoonfull POS terminal.</li>
            <li><strong>Personal Setup Call:</strong> Our onboarding team will call you at <strong>${restaurant.phone}</strong> to confirm your operating shifts, delivery zones, and POS installation.</li>
            <li><strong>Go Live:</strong> Once plugged in, your kitchen goes live to food lovers in ${restaurant.city}!</li>
          </ol>

          <p style="color: #64748B; font-size: 14px; margin-top: 20px;">
            Questions? Simply reply directly to this email or contact us at <a href="mailto:info@spoonfull.nl" style="color: #4A2E1B; font-weight: bold;">info@spoonfull.nl</a>.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94A3B8;">
          © 2026 Spoonfull Netherlands • Prinsengracht, Amsterdam
        </div>
      </div>
    `;

    restaurantNotified = await sendEmail({
      to: restaurant.email,
      subject: `Welcome to Spoonfull — Your Restaurant Onboarding & POS Setup`,
      htmlContent: restaurantHtml,
    });
  }

  return { adminNotified, restaurantNotified };
}
