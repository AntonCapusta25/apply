// Meta (Facebook) Pixel Integration for Customer Facing Flow
// Pixel ID: 1620303026465570

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = '1620303026465570';

/**
 * Tracks a custom or standard Meta Pixel event safely if fbq is initialized.
 */
export function trackMetaPixel(eventName: string, params?: Record<string, any>): void {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      if (params) {
        window.fbq('track', eventName, params);
      } else {
        window.fbq('track', eventName);
      }
    } catch (err) {
      console.warn('Meta Pixel tracking error:', err);
    }
  }
}

/**
 * Track PageView explicitly for customer facing flow
 */
export function trackCustomerPageView(): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname.toLowerCase();
  if (path === '/admin' || path.startsWith('/admin/')) return;

  trackMetaPixel('PageView');
}

/**
 * Track Lead conversion when restaurant application is submitted
 */
export function trackRestaurantLeadSubmitted(details?: {
  restaurantName?: string;
  city?: string;
  plan?: string;
}): void {
  trackMetaPixel('Lead', {
    content_name: details?.restaurantName || 'Restaurant Application',
    content_category: details?.city || 'Netherlands',
    value: 0,
    currency: 'EUR',
    plan: details?.plan || 'growth',
  });
}
