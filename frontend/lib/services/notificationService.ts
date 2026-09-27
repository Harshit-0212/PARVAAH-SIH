import { env } from '../config/env';
import { ServiceResult } from './weatherService';

export interface EmergencyNotificationPayload {
  recipientPhones: string[];
  message: string;
  hazardSeverity: 'advisory' | 'warning' | 'danger';
  districtName?: string;
}

/**
 * Dispatches emergency warnings via official CDAC (Govt of India Mobile Seva)
 * or Twilio when live credentials are set in process.env.
 * Returns typed errors when credentials are not configured.
 */
export async function dispatchEmergencySMS(
  payload: EmergencyNotificationPayload
): Promise<ServiceResult<{ count: number; provider: string }>> {
  if (env.SMS_PROVIDER === 'cdac') {
    if (!env.CDAC_SMS_USERNAME || !env.CDAC_SMS_PASSWORD) {
      return {
        success: false,
        errorCode: 'CONFIG_MISSING',
        message: 'CDAC SMS Gateway username/password not configured in server environment.',
      };
    }

    try {
      const endpoint = env.CDAC_SMS_GATEWAY_URL || 'https://mgov.gov.in/api/sms';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: env.CDAC_SMS_USERNAME,
          password: env.CDAC_SMS_PASSWORD,
          sender: env.CDAC_SMS_SENDER_ID,
          numbers: payload.recipientPhones.join(','),
          message: `[PARVAAH ALERT] ${payload.message}`,
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          errorCode: 'PROVIDER_ERROR',
          message: `CDAC Gateway returned status ${res.status}`,
        };
      }

      return {
        success: true,
        data: { count: payload.recipientPhones.length, provider: 'CDAC Mobile Seva' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_FAILURE',
        message: err.message || 'Network failure dispatching SMS via CDAC.',
      };
    }
  }

  if (env.SMS_PROVIDER === 'twilio') {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        errorCode: 'CONFIG_MISSING',
        message: 'Twilio SID, Token, or Phone Number not configured in server environment.',
      };
    }

    try {
      const basicAuth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const results = await Promise.all(
        payload.recipientPhones.map(async (phone) => {
          const params = new URLSearchParams();
          params.append('To', phone);
          params.append('From', env.TWILIO_PHONE_NUMBER as string);
          params.append('Body', `[PARVAAH] ${payload.message}`);

          const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            }
          );
          return res.ok;
        })
      );

      const successful = results.filter(Boolean).length;
      return {
        success: true,
        data: { count: successful, provider: 'Twilio' },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'NETWORK_FAILURE',
        message: err.message || 'Twilio SMS dispatch network failure.',
      };
    }
  }

  // Graceful state when running locally without SMS provider
  return {
    success: false,
    errorCode: 'CONFIG_MISSING',
    message: `SMS provider '${env.SMS_PROVIDER}' does not have live production credentials configured.`,
  };
}
