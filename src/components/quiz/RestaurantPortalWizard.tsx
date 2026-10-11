import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Store,
  ShieldCheck,
  Loader2,
  Building,
  Utensils,
  LayoutDashboard,
  UploadCloud,
  Sparkles,
  Gift,
  PhoneCall,
  Printer,
  Check,
  Shield,
} from 'lucide-react';
import {
  RestaurantProfile,
  DUTCH_CITIES,
  RESTAURANT_CUISINES,
  RESTAURANT_SERVICE_OPTIONS,
  PLANS,
  LAUNCH_OFFERS,
  LaunchOffer,
  ServiceType,
  PlanType,
  Dish,
} from '../../types/onboarding';
import { createRestaurantLead } from '../../services/restaurantService';
import { sendOnboardingNotifications } from '../../services/emailService';
import { trackRestaurantLeadSubmitted } from '../../lib/metaPixel';
import { MenuUploadAndEditorStep } from './steps/MenuUploadAndEditorStep';

interface RestaurantPortalWizardProps {
  onGoToCrm?: () => void;
  onLeadCreated: (lead: RestaurantProfile) => void;
  leadCount?: number;
}

const TOTAL_STEPS = 9;

export const RestaurantPortalWizard: React.FC<RestaurantPortalWizardProps> = ({
  onGoToCrm,
  onLeadCreated,
  leadCount,
}) => {
  // Directly begins on step 1 (NO landing page)
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly');
  const [submittedLead, setSubmittedLead] = useState<RestaurantProfile | null>(null);
  const [showAllCuisinesMobile, setShowAllCuisinesMobile] = useState(false);

  // Form State
  const [form, setForm] = useState({
    city: 'Amsterdam',
    cuisines: [] as string[],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    restaurantName: '',
    address: '',
    postalCode: '',
    serviceType: 'dinein_takeout' as ServiceType,
    availability: [] as string[],
    uploadedMenuFilename: '',
    dishes: [] as Dish[],
    launchOffer: 'credits_3k' as LaunchOffer,
    plan: 'growth' as PlanType,
  });

  // 4 Chapters calculation
  const getCurrentChapter = () => {
    if (step <= 3) return { num: 1, name: 'The Basics', pct: Math.round((step / TOTAL_STEPS) * 100) };
    if (step <= 5) return { num: 2, name: 'Restaurant & Location', pct: Math.round((step / TOTAL_STEPS) * 100) };
    if (step <= 8) return { num: 3, name: 'Operations & Menu', pct: Math.round((step / TOTAL_STEPS) * 100) };
    return { num: 4, name: 'Launch Offer & Setup', pct: 100 };
  };

  const chapter = getCurrentChapter();

  // Cuisine toggling
  const handleToggleCuisine = (c: string) => {
    setForm((prev) => {
      const exists = prev.cuisines.includes(c);
      if (exists) {
        return { ...prev, cuisines: prev.cuisines.filter((item) => item !== c) };
      }
      if (prev.cuisines.length < 3) {
        return { ...prev, cuisines: [...prev.cuisines, c] };
      }
      return prev;
    });
  };

  // Availability toggling
  const handleToggleAvailability = (slotId: string) => {
    setForm((prev) => {
      const exists = prev.availability.includes(slotId);
      if (exists) {
        return { ...prev, availability: prev.availability.filter((s) => s !== slotId) };
      }
      return { ...prev, availability: [...prev.availability, slotId] };
    });
  };

  // Navigation
  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === TOTAL_STEPS) {
      // Submit application
      setIsSubmitting(true);
      try {
        const ownerFull = `${form.firstName} ${form.lastName}`.trim() || 'Restaurant Owner';
        const newLead = await createRestaurantLead({
          restaurantName: form.restaurantName || 'Artisanal Kitchen',
          ownerName: ownerFull,
          email: form.email || `${form.firstName.toLowerCase() || 'owner'}@restaurant.nl`,
          phone: form.phone || '+31 6 12 34 56 78',
          city: form.city,
          address: form.address || `${form.city} Center`,
          postalCode: form.postalCode,
          cuisines: form.cuisines,
          serviceType: form.serviceType,
          availability: form.availability,
          uploadedMenuFilename: form.uploadedMenuFilename,
          dishes: form.dishes,
          launchOffer: form.launchOffer,
          providePosMachine: true,
          setupCallRequested: true,
          plan: form.plan,
          billingPeriod,
          source: 'spoonfull_onboarding',
        });

        // Trigger SendGrid automated email notifications to admin and restaurant
        sendOnboardingNotifications(newLead)
          .then((res) => {
            console.log('SendGrid notification results:', res);
          })
          .catch((err) => {
            console.error('SendGrid notification error:', err);
          });

        setSubmittedLead(newLead);
        onLeadCreated(newLead);

        // Track Meta Pixel Lead event for customer-facing onboarding
        trackRestaurantLeadSubmitted({
          restaurantName: newLead.restaurantName,
          city: newLead.city,
          plan: newLead.plan,
        });

        setStep(10); // Complete screen

        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#4A2E1B', '#059669', '#EEDFD5', '#0284C7'],
        });
      } catch (e) {
        console.error('Submission failed', e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="wizard-shell">
      {/* Top Section: Language Switch & Progress Bar */}
      <div className="wizard-top-area">
        <div className="wizard-header">
          <div className="wizard-lang-pill">
            <span>🌐</span> 🇬🇧 EN ˅
          </div>
        </div>

        {/* Segmented Progress Header (Steps 1 to 9) */}
        {step <= TOTAL_STEPS && (
          <div className="wizard-progress-section">
            <div className="wizard-chapter-info">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="wizard-chapter-badge">{chapter.num}/4</span>
                <span className="wizard-chapter-title font-display">{chapter.name}</span>
              </div>
              <span className="wizard-chapter-pct">{chapter.pct}%</span>
            </div>

            <div className="wizard-segmented-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[1, 2, 3, 4].map((chNum) => (
                <div
                  key={chNum}
                  className={`wizard-segment-pill ${
                    chNum < chapter.num ? 'active' : chNum === chapter.num ? 'current' : 'inactive'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Form Step Area */}
      <div className="wizard-main-content">
        {/* STEP 1: City Selection */}
        {step === 1 && (
          <div>
            <h1 className="wizard-step-title font-display">Where is your restaurant located?</h1>
            <p className="wizard-step-subtitle">Select your operating city to verify delivery courier dispatch</p>

            <div className="wizard-grid-cities">
              {DUTCH_CITIES.map((c) => {
                const isSelected = form.city === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, city: c }));
                      setTimeout(() => setStep(2), 220);
                    }}
                    className={`portal-card-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <MapPin size={18} style={{ color: 'var(--portal-brown)' }} />
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Cuisines */}
        {step === 2 && (
          <div>
            <h1 className="wizard-step-title font-display">What cuisine does your kitchen serve?</h1>
            <p className="wizard-step-subtitle">Select up to 3 culinary styles ({form.cuisines.length}/3)</p>

            <div className={`wizard-cuisines-container ${showAllCuisinesMobile ? 'expanded-mobile' : ''}`}>
              {RESTAURANT_CUISINES.map((c, index) => {
                const isSelected = form.cuisines.includes(c);
                const isExtraMobile = index >= 6 && !isSelected;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCuisine(c)}
                    className={`portal-pill-btn ${isSelected ? 'selected' : ''} ${isExtraMobile ? 'extra-cuisine-mobile' : ''}`}
                  >
                    {c}
                  </button>
                );
              })}

              <button
                type="button"
                className="cuisine-mobile-toggle-btn"
                onClick={() => setShowAllCuisinesMobile((prev) => !prev)}
              >
                {showAllCuisinesMobile ? 'Show fewer styles ↑' : `+ More cuisines (${RESTAURANT_CUISINES.length - 6}) ↓`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Owner & Contact Info */}
        {step === 3 && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">Restaurant Manager / Owner Details</h1>
            <p className="wizard-step-subtitle">How can the Spoonfull partnership team contact you?</p>

            <div className="wizard-grid-2col">
              <div className="portal-form-group">
                <label className="portal-form-label">First Name *</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Marco"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Last Name *</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="Rossi"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">Business Email *</label>
              <input
                type="email"
                className="portal-input"
                placeholder="marco@trattoriamilano.nl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">Mobile Phone / WhatsApp *</label>
              <input
                type="tel"
                className="portal-input"
                placeholder="+31 6 12 34 56 78"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Restaurant Name */}
        {step === 4 && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">What is your restaurant name?</h1>
            <p className="wizard-step-subtitle">This will be your storefront on the Spoonfull discovery app</p>

            <div className="portal-form-group">
              <label className="portal-form-label">Official Restaurant Brand Name *</label>
              <input
                type="text"
                className="portal-input"
                style={{ fontSize: '1.15rem', fontWeight: 800, height: '52px' }}
                placeholder="e.g. Trattoria Da Luigi or Tokyo Buns Bar"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Kitchen Address */}
        {step === 5 && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">Where is your kitchen located?</h1>
            <p className="wizard-step-subtitle">Couriers and customer pickups will arrive at this address</p>

            <div className="portal-form-group">
              <label className="portal-form-label">Street Address & House Number *</label>
              <input
                type="text"
                className="portal-input"
                placeholder="e.g. Herengracht 142"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="wizard-grid-2col">
              <div className="portal-form-group">
                <label className="portal-form-label">Postal Code</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder="1015 BN"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">City</label>
                <input type="text" className="portal-input" value={form.city} readOnly />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Fulfillment Model */}
        {step === 6 && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">What is your restaurant concept?</h1>
            <p className="wizard-step-subtitle">Select your primary operation and kitchen fulfillment setup</p>

            <div className="wizard-grid-services">
              {RESTAURANT_SERVICE_OPTIONS.map((item) => {
                const isSelected = form.serviceType === item.id;
                return (
                  <div
                    key={item.id}
                    className="wizard-service-card"
                    onClick={() => {
                      setForm({ ...form, serviceType: item.id });
                      setTimeout(() => setStep(7), 220);
                    }}
                    style={{
                      background: '#FFFFFF',
                      border: `2px solid ${isSelected ? 'var(--portal-brown)' : '#FFFFFF'}`,
                      borderRadius: 'var(--portal-radius-md)',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(74, 46, 27, 0.12)' : 'var(--portal-shadow-xs)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="service-icon" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{item.icon}</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--portal-text-primary)', marginBottom: '0.25rem' }}>
                      {item.label}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)', lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: Operating Schedule */}
        {step === 7 && (
          <div>
            <h1 className="wizard-step-title font-display">When will you be open on Spoonfull?</h1>
            <p className="wizard-step-subtitle">Select your active kitchen order shifts</p>

            <div className="wizard-grid-availability">
              {[
                { id: 'mon_wed', label: 'Mon – Wed (Midweek Lunch & Dinner)' },
                { id: 'thu_sun', label: 'Thu – Sun (Peak Weekend Shifts)' },
                { id: 'full_week', label: '7 Days a Week Full Service' },
                { id: 'weekends_only', label: 'Friday & Weekends Only' },
                { id: 'lunch_rush', label: 'Lunch Only (11:30 - 15:00)' },
                { id: 'dinner_rush', label: 'Dinner Only (17:00 - 22:30)' },
              ].map((item) => {
                const isSelected = form.availability.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`portal-card-btn ${isSelected ? 'selected' : ''}`}
                    style={{ padding: '0.95rem 1rem', fontSize: '0.9rem' }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: MENU UPLOAD & INTERACTIVE MENU EDITOR */}
        {step === 8 && (
          <MenuUploadAndEditorStep
            dishes={form.dishes}
            uploadedFilename={form.uploadedMenuFilename}
            onUpdateDishes={(newDishes, filename) =>
              setForm({ ...form, dishes: newDishes, uploadedMenuFilename: filename || form.uploadedMenuFilename })
            }
            restaurantName={form.restaurantName}
          />
        )}

        {/* STEP 9: Commission Plan */}
        {/* STEP 9: Launch Offer & POS Setup (Replacing Commission Plans) */}
        {step === 9 && (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={16} /> Exclusive Restaurant Partner Launch Offer
            </div>

            <h1 className="wizard-step-title font-display">Choose Your Restaurant Launch Offer</h1>
            <p className="wizard-step-subtitle">
              Instead of upfront commission plans, we kickstart your kitchen with fee credits or 2 months of free usage. Both options include a free POS machine and personal setup call.
            </p>

            {/* Launch Offer Choice Cards */}
            <div className="wizard-grid-offers">
              {LAUNCH_OFFERS.map((offer) => {
                const isSelected = form.launchOffer === offer.id;
                return (
                  <div
                    key={offer.id}
                    className="wizard-offer-card"
                    onClick={() => setForm({ ...form, launchOffer: offer.id })}
                    style={{
                      background: '#FFFFFF',
                      border: `2.5px solid ${isSelected ? 'var(--portal-brown)' : '#E2E8F0'}`,
                      borderRadius: 'var(--portal-radius-lg)',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: isSelected ? '0 10px 24px rgba(74, 46, 27, 0.16)' : 'var(--portal-shadow-xs)',
                      transform: isSelected ? 'translateY(-3px)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {offer.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-13px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--portal-brown)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 14px',
                          borderRadius: '9999px',
                          boxShadow: '0 2px 6px rgba(74, 46, 27, 0.3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ★ Recommended Option
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span
                          className="wizard-offer-badge"
                          style={{
                            background: isSelected ? '#FAF8F5' : '#F8FAFC',
                            color: isSelected ? 'var(--portal-brown)' : '#64748B',
                            border: `1px solid ${isSelected ? '#EEDFD5' : '#E2E8F0'}`,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {offer.badge}
                        </span>

                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--portal-brown)' : '#CBD5E1'}`,
                            background: isSelected ? 'var(--portal-brown)' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </div>
                      </div>

                      <h3 className="wizard-offer-name" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--portal-text-primary)', marginTop: '0.4rem', marginBottom: '0.2rem' }}>
                        {offer.name}
                      </h3>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <span className="wizard-offer-headline" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--portal-brown)', lineHeight: 1 }}>
                            {offer.headline}
                          </span>
                        </div>
                        <div className="wizard-offer-subheadline" style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                          {offer.subheadline}
                        </div>
                        <p className="wizard-offer-tagline" style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem', lineHeight: 1.35 }}>
                          {offer.tagline}
                        </p>
                      </div>

                      <div className="wizard-offer-perks-list" style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {offer.perks.map((feat, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--portal-text-secondary)', lineHeight: 1.3 }}>
                              <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Included for Everyone: POS Machine + Dedicated Setup Call */}
            <div
              className="wizard-included-banner"
              style={{
                background: '#FAF8F5',
                border: '1.5px solid #EEDFD5',
                borderRadius: 'var(--portal-radius-lg)',
                padding: '1.25rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Gift size={20} style={{ color: 'var(--portal-brown)' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--portal-text-primary)', margin: 0 }}>
                  Included with Every Spoonfull Restaurant Partnership
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 'var(--portal-radius-md)',
                    padding: '1.15rem',
                    display: 'flex',
                    gap: '0.9rem',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#FAF8F5',
                      border: '1px solid #EEDFD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--portal-brown)',
                      flexShrink: 0,
                    }}
                  >
                    <Printer size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.925rem', color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>
                      Free Touchscreen POS Terminal Provided
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      We deliver a dedicated Spoonfull touchscreen terminal with integrated thermal kitchen receipt printer directly to your venue at zero cost.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 'var(--portal-radius-md)',
                    padding: '1.15rem',
                    display: 'flex',
                    gap: '0.9rem',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#FAF8F5',
                      border: '1px solid #EEDFD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--portal-brown)',
                      flexShrink: 0,
                    }}
                  >
                    <PhoneCall size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.925rem', color: '#0F172A', display: 'block', marginBottom: '0.2rem' }}>
                      Personal Setup Call to Connect Everything
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      We will personally call you at <strong>{form.phone || 'your phone number'}</strong> to review your menu, connect printer hardware, and launch your kitchen live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Complete Screen */}
        {step === 10 && (
          <div style={{ maxWidth: '660px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '2px solid #10B981',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 className="wizard-step-title font-display">Restaurant Application Received!</h1>
            <p className="wizard-step-subtitle">
              Your restaurant menu with {form.dishes.length} dishes is submitted to Spoonfull. We are preparing your free POS hardware and will call you to complete setup.
            </p>

            {submittedLead && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--portal-border)',
                  borderRadius: 'var(--portal-radius-md)',
                  padding: '1.5rem',
                  textAlign: 'left',
                  boxShadow: 'var(--portal-shadow-sm)',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--portal-brown)', textTransform: 'uppercase' }}>
                    Spoonfull Onboarding Snapshot
                  </span>
                  <span style={{ background: '#ECFDF5', color: '#065F46', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    ● Application Queued &amp; Notified
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.75rem' }}>RESTAURANT</div>
                    <div style={{ fontWeight: 800, color: 'var(--portal-text-primary)' }}>{submittedLead.restaurantName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.75rem' }}>OWNER / MANAGER</div>
                    <div style={{ fontWeight: 700 }}>{submittedLead.ownerName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.75rem' }}>CITY / ADDRESS</div>
                    <div>{submittedLead.city} • {submittedLead.address}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.75rem' }}>MENU ITEMS</div>
                    <div style={{ fontWeight: 700, color: 'var(--portal-brown)' }}>{submittedLead.dishes?.length || 0} Dishes Attached</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', background: '#FAF8F5', border: '1px solid #EEDFD5', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.725rem', fontWeight: 700 }}>SELECTED LAUNCH PACKAGE &amp; HARDWARE</div>
                    <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem', marginTop: '2px' }}>
                      🎁 {submittedLead.launchOffer === 'credits_3k' ? '€3,000 Fee Credit Pool' : '2 Months Free of Charge Usage (0% Commission)'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>
                      ✅ Complimentary Spoonfull POS machine &amp; receipt printer included • We will call {submittedLead.phone} to configure hardware
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>✓ SendGrid Notifications Wired:</span>
                  <span>Confirmation emailed to {submittedLead.email} &amp; admin team alerted at bangalexf@gmail.com</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep(1)}
                className="portal-btn-brown"
                style={{ padding: '0.85rem 2rem' }}
              >
                Submit Another Location or Restaurant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      {step <= TOTAL_STEPS && (
        <div className="wizard-footer-bar">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className="wizard-back-btn"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="portal-btn-brown"
          >
            {isSubmitting ? (
              <>
                Submitting... <Loader2 size={16} className="animate-spin" />
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                Submit application <ArrowRight size={16} />
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
