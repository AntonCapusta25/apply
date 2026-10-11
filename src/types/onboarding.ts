export type ServiceType =
  | 'dinein_takeout'
  | 'delivery_only'
  | 'fine_dining_delivery'
  | 'catering';

export type PlanType = 'starter' | 'growth' | 'enterprise';

export type LaunchOffer = 'credits_3k' | 'free_2_months';

export type UserRole = 'admin' | 'salesperson';

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export const CRM_TEAM_USERS: CrmUser[] = [
  {
    id: 'user-admin-1',
    name: 'Alexandre Filippov',
    email: 'bangalexf@gmail.com',
    role: 'admin',
  },
  {
    id: 'user-sales-1',
    name: 'Lucas van Dijk',
    email: 'lucas@spoonfull.nl',
    role: 'salesperson',
  },
  {
    id: 'user-sales-2',
    name: 'Sophie de Boer',
    email: 'sophie@spoonfull.nl',
    role: 'salesperson',
  },
];

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'menu_ready'
  | 'contract_pending'
  | 'merchant_created'
  | 'live'
  | 'paused';

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CallLog {
  id: string;
  restaurantId: string;
  author: string;
  outcome: string;
  notes: string;
  createdAt: string;
}

export interface CrmNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  restaurantId: string;
  merchantCode: string;
  name: string;
  email?: string;
  phone?: string;
  city: string;
  address: string;
  commissionRate: number;
  status: 'active' | 'pending_setup' | 'paused';
  isAcceptingOrders: boolean;
  hasRecraftImages: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantProfile {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postalCode?: string;
  cuisines: string[];
  serviceType: ServiceType;
  availability: string[];
  uploadedMenuFilename?: string;
  uploadedMenuUrl?: string;
  dishes: Dish[];
  launchOffer: LaunchOffer;
  providePosMachine: boolean;
  setupCallRequested: boolean;
  plan?: PlanType;
  billingPeriod?: 'yearly' | 'monthly';
  leadStatus: LeadStatus;
  priority: 'low' | 'medium' | 'high';
  callAttempts: number;
  firstCalledAt?: string;
  lastContactedAt?: string;
  followUpDate?: string;
  merchantId?: string;
  merchantCode?: string;
  assignedTo?: string;
  assignedToName?: string;
  adminNotes: CrmNote[];
  callLogs: CallLog[];
  createdAt: string;
  updatedAt: string;
  source: 'spoonfull_onboarding' | 'manual_crm';
}

export const DUTCH_CITIES = [
  'Amsterdam',
  'Rotterdam',
  'Den Haag',
  'Utrecht',
  'Eindhoven',
  'Haarlem',
  'Enschede',
  'Groningen',
  'Other city',
] as const;

export const RESTAURANT_CUISINES = [
  'Italian & Pasta',
  'Artisan Burgers',
  'Surinamese & Javanese',
  'Asian Street Food & Wok',
  'Indian & Pakistani',
  'Middle Eastern & Mezze',
  'Mexican & Tacos',
  'Japanese & Ramen',
  'Healthy & Bowls',
  'Artisanal Bakery & Cafe',
  'Mediterranean & Seafood',
  'Steakhouse & Grill',
] as const;

export const RESTAURANT_SERVICE_OPTIONS: { id: ServiceType; label: string; desc: string; icon: string }[] = [
  {
    id: 'dinein_takeout',
    label: 'Restaurant with Takeaway & Delivery',
    desc: 'Existing brick-and-mortar restaurant adding Spoonfull delivery volume.',
    icon: '🏪',
  },
  {
    id: 'delivery_only',
    label: 'Dark Kitchen / Cloud Kitchen',
    desc: 'Facility dedicated exclusively to online courier fulfillment.',
    icon: '🛵',
  },
  {
    id: 'fine_dining_delivery',
    label: 'Boutique & Premium Casual',
    desc: 'High-end culinary concept offering elevated delivery presentation.',
    icon: '🍷',
  },
  {
    id: 'catering',
    label: 'Restaurant Catering & Group Orders',
    desc: 'Specialized in bulk orders, business events, and corporate lunches.',
    icon: '🍱',
  },
];

export const PLANS = [
  {
    id: 'starter' as PlanType,
    name: 'Spoonfull Starter',
    commission: '10%',
    baseFee: '€0 upfront',
    tagline: 'Ideal to launch delivery on Spoonfull with zero risk',
    perks: [
      'Listing on Spoonfull discovery marketplace',
      'Integrated courier dispatch & tracking',
      'Interactive digital menu manager',
      'Weekly automated sales payouts',
    ],
  },
  {
    id: 'growth' as PlanType,
    name: 'Growth Restaurant',
    commission: '12%',
    baseFee: '€0 upfront',
    tagline: 'Most selected by active restaurants scaling orders',
    perks: [
      'Priority placement in city search algorithm',
      'AI dish photo enhancement & styling',
      'Dedicated WhatsApp merchant support line',
      'Next-day payout schedule',
      'Sponsored delivery radius expansion',
    ],
    popular: true,
  },
  {
    id: 'enterprise' as PlanType,
    name: 'Enterprise Kitchen',
    commission: '14%',
    baseFee: '€0 upfront',
    tagline: 'Multi-branch restaurants and high-volume kitchens',
    perks: [
      'Top search banner hero spotlight',
      'Corporate catering business pipeline',
      'Dedicated key account manager',
      'Direct POS & kitchen printer integration',
      'Professional food photography photoshoot',
    ],
  },
];

export const LAUNCH_OFFERS: {
  id: LaunchOffer;
  name: string;
  headline: string;
  subheadline: string;
  tagline: string;
  badge: string;
  perks: string[];
  popular?: boolean;
}[] = [
  {
    id: 'credits_3k',
    name: '€3,000 Fee Credit',
    headline: '€3,000 Credits',
    subheadline: 'Offset platform & order fees',
    tagline: 'Ideal for restaurants wanting cash-flow flexibility from day one',
    badge: 'Highest Flexibility',
    perks: [
      '€3,000 credit buffer applied directly to your restaurant account',
      'Free Touchscreen POS terminal with thermal printer provided',
      'Dedicated personal setup call to configure hardware & menu',
      'Keep 100% of order earnings until credits are exhausted',
      'Weekly automated payouts & zero setup fees',
    ],
  },
  {
    id: 'free_2_months',
    name: '2 Months Free of Charge Usage',
    headline: '2 Months 100% Free',
    subheadline: '0% commission for 60 days',
    tagline: 'Ideal for restaurants scaling delivery with zero risk or commission',
    badge: 'Most Popular',
    perks: [
      '0% platform commission & free usage for your first 60 days',
      'Free Touchscreen POS terminal with thermal printer provided',
      'Dedicated personal setup call to configure hardware & menu',
      'Unlimited delivery orders processed during promotional window',
      'No lock-in contract — pause or cancel anytime without penalties',
    ],
    popular: true,
  },
];

