import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { RestaurantProfile, DUTCH_CITIES, RESTAURANT_CUISINES, ServiceType, PlanType, LaunchOffer } from '../../types/onboarding';

interface NewLeadManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Omit<RestaurantProfile, 'id' | 'createdAt' | 'updatedAt' | 'leadStatus' | 'adminNotes' | 'callLogs' | 'callAttempts' | 'priority'>) => void;
}

export const NewLeadManualModal: React.FC<NewLeadManualModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState<string>('Amsterdam');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cuisines, setCuisines] = useState<string[]>(['Italian & Pasta']);
  const [serviceType, setServiceType] = useState<ServiceType>('dinein_takeout');
  const [launchOffer, setLaunchOffer] = useState<LaunchOffer>('credits_3k');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !ownerName || !phone) return;

    onSubmit({
      restaurantName,
      ownerName,
      city,
      address: address || `${city} Center`,
      email: email || `${ownerName.toLowerCase().replace(/\s+/g, '')}@restaurant.nl`,
      phone,
      cuisines,
      serviceType,
      availability: ['thu_sun', 'dinner_rush'],
      uploadedMenuFilename: 'manual_lead_menu.pdf',
      dishes: [
        {
          id: `dish-${Date.now()}-1`,
          name: `${restaurantName} Signature Dish`,
          description: 'Chef signature specialty',
          price: 16.5,
          category: 'Mains',
          isAvailable: true,
        },
      ],
      launchOffer,
      providePosMachine: true,
      setupCallRequested: true,
      plan: 'growth',
      billingPeriod: 'yearly',
      source: 'manual_crm',
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="portal-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '100%' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
              Add Restaurant Lead
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.825rem' }}>
              Add a partner restaurant manually to the Spoonfull CRM pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FAF8F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="portal-form-group" style={{ marginBottom: 0 }}>
            <label className="portal-form-label">Restaurant Name *</label>
            <input
              type="text"
              required
              className="portal-input"
              placeholder="e.g. Bella Roma Trattoria"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">Owner / Manager Name *</label>
              <input
                type="text"
                required
                className="portal-input"
                placeholder="Marco Rossi"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">City *</label>
              <select
                className="portal-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {DUTCH_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">Mobile Phone / WhatsApp *</label>
              <input
                type="tel"
                required
                className="portal-input"
                placeholder="+31 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">Email Address</label>
              <input
                type="email"
                className="portal-input"
                placeholder="owner@restaurant.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="portal-form-group" style={{ marginBottom: 0 }}>
            <label className="portal-form-label">Kitchen Street Address</label>
            <input
              type="text"
              className="portal-input"
              placeholder="e.g. Keizersgracht 124"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">Primary Cuisine</label>
              <select
                className="portal-input"
                value={cuisines[0] || 'Italian & Pasta'}
                onChange={(e) => setCuisines([e.target.value])}
              >
                {RESTAURANT_CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="portal-form-group" style={{ marginBottom: 0 }}>
              <label className="portal-form-label">Launch Offer &amp; POS</label>
              <select
                className="portal-input"
                value={launchOffer}
                onChange={(e) => setLaunchOffer(e.target.value as LaunchOffer)}
              >
                <option value="credits_3k">🎁 €3,000 Fee Credits + Free POS</option>
                <option value="free_2_months">🎁 2 Months Free (0% Fee) + Free POS</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button type="submit" className="portal-btn-brown" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Save Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
