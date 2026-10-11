export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey =
    process.env.HYPERZOD_API_KEY ||
    'Wo7HGxgU9Lu4pfLBvwUZKqS-kkQZqcylGPQ6JwCjeuaJRjGvle-5VjnpSHn7apfJMYczLIlrCQ==';
  const tenantId = process.env.HYPERZOD_TENANT_ID || '8218';
  const baseUrl = process.env.HYPERZOD_BASE_URL || 'https://api.hyperzod.app';

  const { restaurant } = req.body || {};
  if (!restaurant) {
    return res.status(400).json({ success: false, error: 'Restaurant payload is required' });
  }

  try {
    const extractPostalCode = (addr: string): string => {
      if (!addr) return '';
      const match = addr.match(/\d{4}\s*[A-Z]{2}/i);
      return match ? match[0].replace(/\s/g, '') : '';
    };

    const mapServiceType = (serviceType: string): string[] => {
      if (serviceType === 'delivery_only') return ['delivery'];
      return ['delivery', 'pickup'];
    };

    const postalCode = restaurant.postalCode || extractPostalCode(restaurant.address || '') || '1012AB';

    const merchantPayload = {
      name: restaurant.restaurantName || restaurant.name || 'Spoonfull Kitchen',
      address: restaurant.address || 'Amsterdam Center',
      post_code: postalCode,
      country_code: 'NL',
      country: 'Netherlands',
      state: restaurant.city || 'North Holland',
      city: restaurant.city || 'Amsterdam',
      phone: restaurant.phone || '+31687196711',
      email: restaurant.email || 'info@spoonfull.nl',
      type: 'ecommerce',
      accepted_order_types: mapServiceType(restaurant.serviceType),
      status: 1,
      delivery_by: 'tenant',
      commission: {
        delivery: {
          order_type: 'delivery',
          type: 'percentage',
          percent_value: restaurant.commissionRate || 12,
          calculate_on_status: 1,
        },
        pickup: {
          order_type: 'pickup',
          type: 'percentage',
          percent_value: restaurant.commissionRate || 12,
          calculate_on_status: 1,
        },
        custom_1: {
          order_type: 'custom_1',
          type: 'percentage',
          percent_value: restaurant.commissionRate || 12,
          calculate_on_status: 1,
        },
      },
      tax_method: 'inclusive',
      merchant_category_ids: [],
      language_translation: [
        {
          locale: 'en',
          key: 'name',
          value: restaurant.restaurantName || restaurant.name || 'Spoonfull Kitchen',
        },
      ],
    };

    const response = await fetch(`${baseUrl}/admin/v1/merchant/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-TENANT': tenantId,
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(merchantPayload),
    });

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: responseData.message || `Hyperzod error ${response.status}`,
        details: responseData,
      });
    }

    const merchantId =
      responseData?.data?.merchant_id ||
      responseData?.data?._id ||
      responseData?.data?.id ||
      null;

    return res.status(200).json({
      success: true,
      merchantId,
      data: responseData,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal Server Error',
    });
  }
}
