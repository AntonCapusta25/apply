import { RestaurantProfile } from '../types/onboarding';

const HYPERZOD_API_KEY =
  (import.meta as any).env?.VITE_HYPERZOD_API_KEY ||
  'Wo7HGxgU9Lu4pfLBvwUZKqS-kkQZqcylGPQ6JwCjeuaJRjGvle-5VjnpSHn7apfJMYczLIlrCQ==';
const HYPERZOD_TENANT_ID = (import.meta as any).env?.VITE_HYPERZOD_TENANT_ID || '8218';
const HYPERZOD_BASE_URL = (import.meta as any).env?.VITE_HYPERZOD_BASE_URL || 'https://api.hyperzod.app';

export interface HyperzodCreateResult {
  success: boolean;
  merchantId?: string;
  error?: string;
  details?: any;
}

/**
 * Creates a merchant entity in Hyperzod for a given restaurant profile.
 * Attempts serverless route first (/api/create-hyperzod-merchant), falling back
 * to direct API call if running in local standalone development.
 */
export async function createHyperzodMerchant(lead: RestaurantProfile): Promise<HyperzodCreateResult> {
  // 1. Try serverless backend route
  try {
    const res = await fetch('/api/create-hyperzod-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant: lead }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.merchantId) {
        return {
          success: true,
          merchantId: data.merchantId,
          details: data.data,
        };
      }
    }
  } catch (err) {
    console.warn('Serverless route /api/create-hyperzod-merchant unreachable, attempting direct call:', err);
  }

  // 2. Direct fallback using verified Hyperzod Admin API
  try {
    const extractPostalCode = (addr: string): string => {
      if (!addr) return '';
      const match = addr.match(/\d{4}\s*[A-Z]{2}/i);
      return match ? match[0].replace(/\s/g, '') : '';
    };

    const postalCode = lead.postalCode || extractPostalCode(lead.address || '') || '1012AB';
    const commissionPercent = lead.plan === 'starter' ? 10 : lead.plan === 'growth' ? 12 : 14;

    const payload = {
      name: lead.restaurantName || 'Spoonfull Kitchen',
      address: lead.address || 'Amsterdam Center',
      post_code: postalCode,
      country_code: 'NL',
      country: 'Netherlands',
      state: lead.city || 'North Holland',
      city: lead.city || 'Amsterdam',
      phone: lead.phone || '+31687196711',
      email: lead.email || 'info@spoonfull.nl',
      type: 'ecommerce',
      accepted_order_types: lead.serviceType === 'delivery_only' ? ['delivery'] : ['delivery', 'pickup'],
      status: 1,
      delivery_by: 'tenant',
      commission: {
        delivery: {
          order_type: 'delivery',
          type: 'percentage',
          percent_value: commissionPercent,
          calculate_on_status: 1,
        },
        pickup: {
          order_type: 'pickup',
          type: 'percentage',
          percent_value: commissionPercent,
          calculate_on_status: 1,
        },
      },
      tax_method: 'inclusive',
      merchant_category_ids: [],
      language_translation: [
        {
          locale: 'en',
          key: 'name',
          value: lead.restaurantName || 'Spoonfull Kitchen',
        },
      ],
    };

    const directRes = await fetch(`${HYPERZOD_BASE_URL}/admin/v1/merchant/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-TENANT': HYPERZOD_TENANT_ID,
        'X-API-KEY': HYPERZOD_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await directRes.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!directRes.ok) {
      return {
        success: false,
        error: data?.message || `Hyperzod HTTP ${directRes.status}`,
        details: data,
      };
    }

    const merchantId = data?.data?.merchant_id || data?.data?._id || data?.data?.id || `hz-${Date.now()}`;
    return {
      success: true,
      merchantId,
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Hyperzod API communication failed',
    };
  }
}

/**
 * List merchants registered under tenant 8218
 */
export async function listHyperzodMerchants(): Promise<any[]> {
  try {
    const res = await fetch(`${HYPERZOD_BASE_URL}/admin/v1/merchant/list`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-TENANT': HYPERZOD_TENANT_ID,
        'X-API-KEY': HYPERZOD_API_KEY,
      },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.data || [];
  } catch (e) {
    console.error('Failed fetching Hyperzod merchants:', e);
    return [];
  }
}
