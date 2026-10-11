import { RestaurantProfile, Dish } from '../types/onboarding';

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

export interface HyperzodImportMenuResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  categoriesCreated: number;
  results: { dishName: string; success: boolean; productId?: string; error?: string }[];
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

/**
 * Finds or creates a product category for a specific merchant in Hyperzod.
 * E.g., "Main Dishes", "Starters", "Desserts", "Drinks"
 */
export async function getOrCreateCategory(
  merchantId: string,
  categoryName: string
): Promise<string | null> {
  const trimmedName = categoryName.trim() || 'Main Dishes';

  try {
    // 1. Check existing categories for this merchant
    const listRes = await fetch(
      `${HYPERZOD_BASE_URL}/merchant/v1/catalog/product-category/list?merchant_id=${merchantId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-TENANT': HYPERZOD_TENANT_ID,
          'X-API-KEY': HYPERZOD_API_KEY,
        },
      }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const categories: any[] = listData?.data?.data || listData?.data || [];
      const match = categories.find(
        (c: any) =>
          c.name?.toLowerCase() === trimmedName.toLowerCase() ||
          c.language_translation?.some(
            (t: any) => t.value?.toLowerCase() === trimmedName.toLowerCase()
          )
      );
      if (match) {
        return match._id || match.category_id || match.id;
      }
    }

    // 2. Create new category
    const createRes = await fetch(
      `${HYPERZOD_BASE_URL}/merchant/v1/catalog/product-category/create`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-TENANT': HYPERZOD_TENANT_ID,
          'X-API-KEY': HYPERZOD_API_KEY,
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          description: '',
          view_type: 'card',
          image: '',
          sort_order: 0,
          status: 1,
          language_translation: [{ key: 'name', locale: 'en', value: trimmedName }],
        }),
      }
    );

    const createData = await createRes.json();
    if (createRes.ok && createData?.data) {
      return createData.data._id || createData.data.category_id || createData.data.id;
    }
  } catch (e) {
    console.error(`Error in getOrCreateCategory for "${trimmedName}":`, e);
  }

  return null;
}

/**
 * Creates a single product/dish under a merchant & category in Hyperzod
 */
export async function createHyperzodProduct(
  merchantId: string,
  dish: Dish,
  categoryId: string
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    const dishName = dish.name.trim();
    if (!dishName) return { success: false, error: 'Empty dish name' };

    const productImages = dish.imageUrl
      ? [{ file_url: dish.imageUrl, is_cover: true }]
      : [];

    const productPayload = {
      merchant_id: merchantId,
      sku: dishName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 40) || 'SKU',
      language_translation: [
        { key: 'name', locale: 'en', value: dishName },
        { key: 'description', locale: 'en', value: dish.description || '' },
      ],
      product_pricing: {
        type: 'flat',
        price_buy: 0,
        price_sell: Number(dish.price) || 12.0,
        price_sell_compare: null,
        profit: 0,
        margin: 0,
        is_tax_chargaeble: false,
        tax: 0,
      },
      has_product_options: false,
      product_options: [],
      product_category: [categoryId],
      product_tags: ['spoonfull', (dish.category || 'mains').toLowerCase()],
      product_labels: [],
      status: dish.isAvailable !== false,
      is_quantity_enabled: false,
      is_inventory_enabled: false,
      product_inventory: 0,
      is_featured: false,
      sort_order: 0,
      product_quantity: { min_quantity: 0, max_quantity: 0 },
      product_images: productImages,
    };

    const res = await fetch(`${HYPERZOD_BASE_URL}/merchant/v1/catalog/product/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-TENANT': HYPERZOD_TENANT_ID,
        'X-API-KEY': HYPERZOD_API_KEY,
      },
      body: JSON.stringify(productPayload),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (res.ok) {
      return {
        success: true,
        productId: data?.data?.product_id || data?.data?._id || data?.data?.id,
      };
    } else {
      return {
        success: false,
        error: data?.message || `HTTP ${res.status}: ${text}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Product creation request failed',
    };
  }
}

/**
 * High-level function: Uploads complete menu to Hyperzod:
 * 1. Groups dishes by category.
 * 2. Creates each category first.
 * 3. Creates each dish/meal with pricing and images under its corresponding category.
 */
export async function importMenuToHyperzod(
  merchantId: string,
  dishes: Dish[]
): Promise<HyperzodImportMenuResult> {
  if (!dishes || dishes.length === 0) {
    return {
      success: true,
      importedCount: 0,
      failedCount: 0,
      categoriesCreated: 0,
      results: [],
    };
  }

  // 1. Group unique categories
  const categoryMap: Record<string, string> = {};
  const uniqueCategoryNames = Array.from(
    new Set(dishes.map((d) => d.category?.trim() || 'Main Dishes'))
  );

  let categoriesCreated = 0;
  for (const catName of uniqueCategoryNames) {
    const catId = await getOrCreateCategory(merchantId, catName);
    if (catId) {
      categoryMap[catName] = catId;
      categoriesCreated++;
    }
  }

  // Fallback category if any category creation fails
  const defaultCategoryId =
    categoryMap['Main Dishes'] ||
    Object.values(categoryMap)[0] ||
    (await getOrCreateCategory(merchantId, 'Main Dishes')) ||
    '';

  // 2. Create products sequentially
  const results: { dishName: string; success: boolean; productId?: string; error?: string }[] = [];

  for (const dish of dishes) {
    const targetCatId = categoryMap[dish.category?.trim() || 'Main Dishes'] || defaultCategoryId;
    if (!targetCatId) {
      results.push({
        dishName: dish.name,
        success: false,
        error: 'No category available',
      });
      continue;
    }

    const prodResult = await createHyperzodProduct(merchantId, dish, targetCatId);
    results.push({
      dishName: dish.name,
      success: prodResult.success,
      productId: prodResult.productId,
      error: prodResult.error,
    });
  }

  const importedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return {
    success: failedCount === 0,
    importedCount,
    failedCount,
    categoriesCreated,
    results,
  };
}
