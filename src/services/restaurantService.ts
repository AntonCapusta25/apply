import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { RestaurantProfile, LeadStatus, CrmNote, CallLog, Dish, Merchant } from '../types/onboarding';
import { createHyperzodMerchant } from './hyperzodService';

const LOCAL_STORAGE_KEY = 'spoonfull_restaurant_leads_v2';

function getLocalLeads(): RestaurantProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: RestaurantProfile[] = JSON.parse(raw);
      // Strip any legacy mock demo leads if present
      const realLeads = parsed.filter((l) => !['rest-001', 'rest-002', 'rest-003'].includes(l.id));
      return realLeads;
    }
  } catch (e) {
    console.error('Failed reading leads from localStorage', e);
  }
  return [];
}

function saveLocalLeads(leads: RestaurantProfile[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Failed saving leads to localStorage', e);
  }
}

export async function fetchAllLeads(): Promise<{ leads: RestaurantProfile[]; fromSupabase: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('restaurant_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const dbLeads: RestaurantProfile[] = data.map((row: any) => ({
          id: row.id,
          restaurantName: row.restaurant_name,
          ownerName: row.owner_name || row.chef_name || '',
          email: row.email,
          phone: row.phone,
          city: row.city,
          address: row.address,
          postalCode: row.postal_code || undefined,
          cuisines: row.cuisines || [],
          serviceType: row.service_type || 'dinein_takeout',
          availability: row.availability || [],
          uploadedMenuFilename: row.uploaded_menu_filename || undefined,
          uploadedMenuUrl: row.uploaded_menu_url || undefined,
          dishes: Array.isArray(row.dishes) ? row.dishes : [],
          launchOffer: row.launch_offer || 'credits_3k',
          providePosMachine: row.provide_pos_machine !== false,
          setupCallRequested: row.setup_call_requested !== false,
          plan: row.plan || 'growth',
          billingPeriod: row.billing_period || 'yearly',
          leadStatus: row.lead_status || 'new',
          priority: row.priority || 'medium',
          callAttempts: row.call_attempts || 0,
          firstCalledAt: row.first_called_at || undefined,
          lastContactedAt: row.last_contacted_at || undefined,
          followUpDate: row.follow_up_date || undefined,
          merchantId: row.merchant_id || undefined,
          merchantCode: row.merchant_code || undefined,
          assignedTo: row.assigned_to || undefined,
          assignedToName: row.assigned_to_name || undefined,
          adminNotes: Array.isArray(row.admin_notes) ? row.admin_notes : [],
          callLogs: Array.isArray(row.call_logs) ? row.call_logs : [],
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          source: 'spoonfull_onboarding',
        }));

        saveLocalLeads(dbLeads);
        return { leads: dbLeads, fromSupabase: true };
      }
    } catch (err) {
      console.warn('Supabase query fallback to local storage', err);
    }
  }

  return { leads: getLocalLeads(), fromSupabase: false };
}

export async function createRestaurantLead(
  profile: Omit<RestaurantProfile, 'id' | 'createdAt' | 'updatedAt' | 'leadStatus' | 'adminNotes' | 'callLogs' | 'callAttempts' | 'priority'>
): Promise<RestaurantProfile> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newLead: RestaurantProfile = {
    ...profile,
    id: newId,
    leadStatus: 'new',
    priority: 'medium',
    callAttempts: 0,
    callLogs: [],
    adminNotes: [
      {
        id: `note-${Date.now()}`,
        author: 'System',
        text: `New restaurant "${profile.restaurantName}" submitted application with ${profile.dishes.length} menu dishes!`,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const localList = getLocalLeads();
  const updatedList = [newLead, ...localList];
  saveLocalLeads(updatedList);

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('restaurant_leads')
        .insert([
          {
            id: newId,
            restaurant_name: newLead.restaurantName,
            owner_name: newLead.ownerName,
            email: newLead.email,
            phone: newLead.phone,
            city: newLead.city,
            address: newLead.address,
            postal_code: newLead.postalCode || null,
            cuisines: newLead.cuisines,
            service_type: newLead.serviceType,
            availability: newLead.availability,
            uploaded_menu_filename: newLead.uploadedMenuFilename || null,
            launch_offer: newLead.launchOffer,
            provide_pos_machine: newLead.providePosMachine,
            setup_call_requested: newLead.setupCallRequested,
            plan: newLead.plan || 'growth',
            billing_period: newLead.billingPeriod || 'yearly',
            lead_status: 'new',
            priority: 'medium',
            call_attempts: 0,
            assigned_to: newLead.assignedTo || null,
            assigned_to_name: newLead.assignedToName || null,
          },
        ]);

      if (error) {
        console.warn('Supabase insert failed', error);
      }
    } catch (err) {
      console.warn('Supabase insert skipped or offline', err);
    }
  }

  return newLead;
}

export async function updateLeadStatus(id: string, newStatus: LeadStatus): Promise<void> {
  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === id);
  if (target) {
    target.leadStatus = newStatus;
    target.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);

    try {
      await supabase
        .from('restaurant_leads')
        .update({ lead_status: newStatus, updated_at: target.updatedAt })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase update status failed', e);
    }
  }
}

export async function updateLeadPriority(id: string, priority: 'low' | 'medium' | 'high'): Promise<void> {
  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === id);
  if (target) {
    target.priority = priority;
    target.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);

    try {
      await supabase
        .from('restaurant_leads')
        .update({ priority, updated_at: target.updatedAt })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase update priority failed', e);
    }
  }
}

export async function assignLeadToUser(id: string, userId: string, userName: string): Promise<void> {
  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === id);
  if (target) {
    target.assignedTo = userId;
    target.assignedToName = userName;
    target.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);

    try {
      await supabase
        .from('restaurant_leads')
        .update({
          assigned_to: userId,
          assigned_to_name: userName,
          updated_at: target.updatedAt,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase assign lead failed', e);
    }
  }
}

export async function logCall(
  restaurantId: string,
  author: string,
  outcome: string,
  callNotes: string
): Promise<CallLog> {
  const now = new Date().toISOString();
  const newCallLog: CallLog = {
    id: `call-${Date.now()}`,
    restaurantId,
    author,
    outcome,
    notes: callNotes,
    createdAt: now,
  };

  const callNoteText = `Call Log [${outcome}]: ${callNotes.trim()}`;
  const newNote: CrmNote = {
    id: `note-${Date.now()}`,
    author,
    text: callNoteText,
    createdAt: now,
  };

  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === restaurantId);
  if (target) {
    target.callAttempts = (target.callAttempts || 0) + 1;
    target.lastContactedAt = now;
    if (!target.firstCalledAt) {
      target.firstCalledAt = now;
    }
    target.callLogs = [newCallLog, ...(target.callLogs || [])];
    target.adminNotes = [newNote, ...(target.adminNotes || [])];
    target.updatedAt = now;
    saveLocalLeads(localList);

    try {
      await supabase
        .from('restaurant_leads')
        .update({
          call_attempts: target.callAttempts,
          last_contacted_at: now,
          updated_at: now,
        })
        .eq('id', restaurantId);

      await supabase.from('call_logs').insert([
        {
          restaurant_id: restaurantId,
          author,
          outcome,
          notes: callNotes,
        },
      ]);
    } catch (e) {
      console.warn('Supabase call log insert skipped', e);
    }
  }

  return newCallLog;
}

export async function addLeadNote(id: string, author: string, text: string): Promise<CrmNote> {
  const newNote: CrmNote = {
    id: `note-${Date.now()}`,
    author,
    text,
    createdAt: new Date().toISOString(),
  };

  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === id);
  if (target) {
    target.adminNotes = [newNote, ...(target.adminNotes || [])];
    target.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);

    try {
      await supabase.from('admin_notes').insert([
        {
          restaurant_id: id,
          author,
          text,
        },
      ]);
    } catch (e) {
      console.warn('Supabase admin note insert skipped', e);
    }
  }

  return newNote;
}

export async function createMerchantFromLead(
  restaurantId: string,
  options?: { hasRecraftImages?: boolean; commissionRate?: number }
): Promise<Merchant> {
  const localList = getLocalLeads();
  const lead = localList.find((l) => l.id === restaurantId);
  if (!lead) throw new Error('Restaurant lead not found');

  const cityCode = (lead.city || 'AMS').slice(0, 3).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const merchantCode = `SPF-${cityCode}-${randomSuffix}`;
  const now = new Date().toISOString();

  const merchant: Merchant = {
    id: `merch-${Date.now()}`,
    restaurantId: lead.id,
    merchantCode,
    name: lead.restaurantName,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    address: lead.address,
    commissionRate: options?.commissionRate || (lead.plan === 'starter' ? 10 : lead.plan === 'growth' ? 12 : 14),
    status: 'active',
    isAcceptingOrders: true,
    hasRecraftImages: options?.hasRecraftImages ?? true,
    createdAt: now,
    updatedAt: now,
  };

  // Provision live merchant on Hyperzod platform (Tenant 8218)
  let hyperzodMerchantId: string | undefined;
  try {
    const hzResult = await createHyperzodMerchant(lead);
    if (hzResult.success && hzResult.merchantId) {
      hyperzodMerchantId = hzResult.merchantId;
      merchant.id = hzResult.merchantId;
    }
  } catch (err) {
    console.warn('Hyperzod merchant provisioning skipped:', err);
  }

  // Update lead
  lead.merchantId = merchant.id;
  lead.merchantCode = merchant.merchantCode;
  lead.leadStatus = 'merchant_created';
  lead.updatedAt = now;
  lead.adminNotes = [
    {
      id: `note-${Date.now()}`,
      author: 'Admin (Merchant Provisioning)',
      text: hyperzodMerchantId
        ? `Created live Spoonfull merchant entity ${merchantCode} on Hyperzod (Tenant 8218, ID: ${hyperzodMerchantId}). Store status: Active, Accepting Orders.`
        : `Created live Spoonfull merchant entity ${merchantCode}. Store status: Active, Accepting Orders.`,
      createdAt: now,
    },
    ...(lead.adminNotes || []),
  ];
  saveLocalLeads(localList);

  // Try saving to Supabase
  try {
    const { data } = await supabase.from('merchants').insert([
      {
        restaurant_id: lead.id.startsWith('rest-') ? null : lead.id,
        merchant_code: merchantCode,
        name: lead.restaurantName,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        address: lead.address,
        commission_rate: merchant.commissionRate,
        status: 'active',
        is_accepting_orders: true,
        has_recraft_images: merchant.hasRecraftImages,
      },
    ]).select();

    if (data && data[0]) {
      merchant.id = data[0].id;
    }
  } catch (e) {
    console.warn('Supabase merchant insert skipped', e);
  }

  return merchant;
}

export async function updateLeadDishes(restaurantId: string, dishes: Dish[]): Promise<void> {
  const localList = getLocalLeads();
  const lead = localList.find((l) => l.id === restaurantId);
  if (lead) {
    lead.dishes = dishes;
    lead.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);
  }
}

export async function updateFollowUpDate(id: string, followUpDate: string): Promise<void> {
  const localList = getLocalLeads();
  const target = localList.find((l) => l.id === id);
  if (target) {
    target.followUpDate = followUpDate;
    target.updatedAt = new Date().toISOString();
    saveLocalLeads(localList);
  }
}

export function resetToDemoData(): void {
  saveLocalLeads([]);
}

export function clearLocalLeads(): void {
  saveLocalLeads([]);
}

export function exportLeadsToCsv(leads: RestaurantProfile[]): void {
  const headers = [
    'Restaurant Name',
    'Owner Name',
    'Stage',
    'Priority',
    'City',
    'Address',
    'Phone',
    'Email',
    'Cuisines',
    'Service Type',
    'Launch Offer',
    'POS Machine Provided',
    'Setup Call Requested',
    'Call Attempts',
    'Merchant Code',
    'Menu Dishes Count',
    'Created At',
  ];

  const rows = leads.map((l) => [
    `"${l.restaurantName.replace(/"/g, '""')}"`,
    `"${l.ownerName.replace(/"/g, '""')}"`,
    l.leadStatus,
    l.priority,
    `"${l.city}"`,
    `"${l.address.replace(/"/g, '""')}"`,
    `"${l.phone}"`,
    `"${l.email}"`,
    `"${l.cuisines.join(', ')}"`,
    l.serviceType,
    l.launchOffer === 'credits_3k' ? '€3,000 Fee Credit' : '2 Months Free of Charge (0%)',
    l.providePosMachine ? 'Yes (Included)' : 'No',
    l.setupCallRequested ? 'Yes (Scheduled)' : 'No',
    l.callAttempts || 0,
    l.merchantCode || '',
    l.dishes?.length || 0,
    l.createdAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `spoonfull_restaurant_leads_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
