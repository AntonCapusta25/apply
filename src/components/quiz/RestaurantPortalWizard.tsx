import React, { useState, useRef, useEffect } from 'react';
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
import { Language, translations } from '../../translations/wizardTranslations';

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
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>({});

  // Language State with persistence & Dutch auto-detection
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('spoonfull_lang');
    if (saved === 'nl' || saved === 'en') return saved;
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('nl')) {
      return 'nl';
    }
    return 'en';
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('spoonfull_lang', newLang);
    setLangMenuOpen(false);
  };

  const t = translations[lang];

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
    if (step <= 3) return { num: 1, name: t.chapters[1], pct: Math.round((step / TOTAL_STEPS) * 100) };
    if (step <= 5) return { num: 2, name: t.chapters[2], pct: Math.round((step / TOTAL_STEPS) * 100) };
    if (step <= 8) return { num: 3, name: t.chapters[3], pct: Math.round((step / TOTAL_STEPS) * 100) };
    return { num: 4, name: t.chapters[4], pct: 100 };
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

  // Navigation & Validation
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 3) {
      const newErrors: { firstName?: string; lastName?: string; email?: string; phone?: string } = {};

      if (!form.firstName.trim()) {
        newErrors.firstName = t.errors.firstNameReq;
      }
      if (!form.lastName.trim()) {
        newErrors.lastName = t.errors.lastNameReq;
      }
      if (!form.email.trim()) {
        newErrors.email = t.errors.emailReq;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        newErrors.email = t.errors.emailInvalid;
      }
      if (!form.phone.trim()) {
        newErrors.phone = t.errors.phoneReq;
      } else if (form.phone.trim().replace(/\D/g, '').length < 6) {
        newErrors.phone = t.errors.phoneInvalid;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    return true;
  };

  const handlePrev = () => {
    if (step > 1) {
      setErrors({});
      setStep(step - 1);
    }
  };

  const handleNext = async () => {
    if (!validateStep(step)) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setErrors({});
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === TOTAL_STEPS) {
      // Guard against missing contact info if jumped directly
      if (!validateStep(3)) {
        setStep(3);
        return;
      }
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
          <div className="wizard-lang-dropdown-container" ref={langDropdownRef}>
            <button
              type="button"
              className="wizard-lang-pill"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-label="Select language"
            >
              <span>🌐</span> {t.langPillLabel} <span style={{ fontSize: '0.65rem', marginLeft: '2px' }}>▼</span>
            </button>

            {langMenuOpen && (
              <div className="wizard-lang-dropdown-menu">
                <button
                  type="button"
                  className={`wizard-lang-menu-item ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => handleSelectLanguage('en')}
                >
                  <span>{t.langEn}</span>
                  {lang === 'en' && <Check size={14} color="var(--portal-brown)" />}
                </button>
                <button
                  type="button"
                  className={`wizard-lang-menu-item ${lang === 'nl' ? 'active' : ''}`}
                  onClick={() => handleSelectLanguage('nl')}
                >
                  <span>{t.langNl}</span>
                  {lang === 'nl' && <Check size={14} color="var(--portal-brown)" />}
                </button>
              </div>
            )}
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
            <h1 className="wizard-step-title font-display">{t.step1Title}</h1>
            <p className="wizard-step-subtitle">{t.step1Subtitle}</p>

            <div className="wizard-grid-cities">
              {DUTCH_CITIES.map((c) => {
                const isSelected = form.city === c;
                const label = c === 'Other city' ? t.step1OtherCity : c;
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
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Cuisines */}
        {step === 2 && (
          <div>
            <h1 className="wizard-step-title font-display">{t.step2Title}</h1>
            <p className="wizard-step-subtitle">{t.step2Subtitle(form.cuisines.length)}</p>

            <div className={`wizard-cuisines-container ${showAllCuisinesMobile ? 'expanded-mobile' : ''}`}>
              {RESTAURANT_CUISINES.map((c, index) => {
                const isSelected = form.cuisines.includes(c);
                const isExtraMobile = index >= 6 && !isSelected;
                const label = t.cuisines[c] || c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleToggleCuisine(c)}
                    className={`portal-pill-btn ${isSelected ? 'selected' : ''} ${isExtraMobile ? 'extra-cuisine-mobile' : ''}`}
                  >
                    {label}
                  </button>
                );
              })}

              <button
                type="button"
                className="cuisine-mobile-toggle-btn"
                onClick={() => setShowAllCuisinesMobile((prev) => !prev)}
              >
                {showAllCuisinesMobile ? t.step2ShowFewer : t.step2MoreCuisines(RESTAURANT_CUISINES.length - 6)}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Owner & Contact Info */}
        {step === 3 && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">{t.step3Title}</h1>
            <p className="wizard-step-subtitle">{t.step3Subtitle}</p>

            <div className="wizard-grid-2col">
              <div className="portal-form-group">
                <label className="portal-form-label">{t.step3FirstName}</label>
                <input
                  type="text"
                  className={`portal-input ${errors.firstName ? 'error' : ''}`}
                  placeholder={t.step3FirstNamePlaceholder}
                  value={form.firstName}
                  onChange={(e) => {
                    setForm({ ...form, firstName: e.target.value });
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                />
                {errors.firstName && <div className="portal-error-msg">{errors.firstName}</div>}
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">{t.step3LastName}</label>
                <input
                  type="text"
                  className={`portal-input ${errors.lastName ? 'error' : ''}`}
                  placeholder={t.step3LastNamePlaceholder}
                  value={form.lastName}
                  onChange={(e) => {
                    setForm({ ...form, lastName: e.target.value });
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                />
                {errors.lastName && <div className="portal-error-msg">{errors.lastName}</div>}
              </div>
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">{t.step3Email}</label>
              <input
                type="email"
                className={`portal-input ${errors.email ? 'error' : ''}`}
                placeholder={t.step3EmailPlaceholder}
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              {errors.email && <div className="portal-error-msg">{errors.email}</div>}
            </div>

            <div className="portal-form-group">
              <label className="portal-form-label">{t.step3Phone}</label>
              <input
                type="tel"
                className={`portal-input ${errors.phone ? 'error' : ''}`}
                placeholder={t.step3PhonePlaceholder}
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
              />
              {errors.phone && <div className="portal-error-msg">{errors.phone}</div>}
            </div>
          </div>
        )}

        {/* STEP 4: Restaurant Name */}
        {step === 4 && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">{t.step4Title}</h1>
            <p className="wizard-step-subtitle">{t.step4Subtitle}</p>

            <div className="portal-form-group">
              <label className="portal-form-label">{t.step4BrandLabel}</label>
              <input
                type="text"
                className="portal-input"
                style={{ fontSize: '1.15rem', fontWeight: 800, height: '52px' }}
                placeholder={t.step4BrandPlaceholder}
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Kitchen Address */}
        {step === 5 && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">{t.step5Title}</h1>
            <p className="wizard-step-subtitle">{t.step5Subtitle}</p>

            <div className="portal-form-group">
              <label className="portal-form-label">{t.step5StreetLabel}</label>
              <input
                type="text"
                className="portal-input"
                placeholder={t.step5StreetPlaceholder}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="wizard-grid-2col">
              <div className="portal-form-group">
                <label className="portal-form-label">{t.step5PostalLabel}</label>
                <input
                  type="text"
                  className="portal-input"
                  placeholder={t.step5PostalPlaceholder}
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">{t.step5CityLabel}</label>
                <input type="text" className="portal-input" value={form.city} readOnly />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Fulfillment Model */}
        {step === 6 && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h1 className="wizard-step-title font-display">{t.step6Title}</h1>
            <p className="wizard-step-subtitle">{t.step6Subtitle}</p>

            <div className="wizard-grid-services">
              {RESTAURANT_SERVICE_OPTIONS.map((item) => {
                const isSelected = form.serviceType === item.id;
                const serviceInfo = t.services[item.id] || { label: item.label, desc: item.desc };
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
                      {serviceInfo.label}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--portal-text-muted)', lineHeight: 1.4 }}>
                      {serviceInfo.desc}
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
            <h1 className="wizard-step-title font-display">{t.step7Title}</h1>
            <p className="wizard-step-subtitle">{t.step7Subtitle}</p>

            <div className="wizard-grid-availability">
              {[
                { id: 'mon_wed', label: t.schedules.mon_wed },
                { id: 'thu_sun', label: t.schedules.thu_sun },
                { id: 'full_week', label: t.schedules.full_week },
                { id: 'weekends_only', label: t.schedules.weekends_only },
                { id: 'lunch_rush', label: t.schedules.lunch_rush },
                { id: 'dinner_rush', label: t.schedules.dinner_rush },
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
            language={lang}
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
              <Sparkles size={16} /> {t.step9Badge}
            </div>

            <h1 className="wizard-step-title font-display">{t.step9Title}</h1>
            <p className="wizard-step-subtitle">
              {t.step9Subtitle}
            </p>

            {/* Launch Offer Choice Cards */}
            <div className="wizard-grid-offers">
              {LAUNCH_OFFERS.map((baseOffer) => {
                const isSelected = form.launchOffer === baseOffer.id;
                const offer = t.offers[baseOffer.id] || baseOffer;
                return (
                  <div
                    key={baseOffer.id}
                    className="wizard-offer-card"
                    onClick={() => setForm({ ...form, launchOffer: baseOffer.id })}
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
                    {baseOffer.popular && (
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
                        {t.step9Recommended}
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
                  {t.includedBanner.title}
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
                      {t.includedBanner.posTitle}
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      {t.includedBanner.posDesc}
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
                      {t.includedBanner.callTitle}
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      {t.includedBanner.callDesc(form.phone)}
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

            <h1 className="wizard-step-title font-display">{t.step10Title}</h1>
            <p className="wizard-step-subtitle">
              {t.step10Subtitle}
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
                    {t.step10DetailsTitle}
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
                    <div style={{ fontWeight: 700, color: 'var(--portal-brown)' }}>{t.step10DishesAttached(submittedLead.dishes?.length || 0)}</div>
                  </div>

                  <div style={{ gridColumn: '1 / -1', background: '#FAF8F5', border: '1px solid #EEDFD5', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--portal-text-muted)', fontSize: '0.725rem', fontWeight: 700 }}>{t.step10PackageTitle}</div>
                    <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem', marginTop: '2px' }}>
                      🎁 {submittedLead.launchOffer === 'credits_3k' ? (lang === 'nl' ? '€3.000 Commissietegoed' : '€3,000 Fee Credit Pool') : (lang === 'nl' ? '2 Maanden Volledig Gratis (0% Commissie)' : '2 Months Free of Charge Usage (0% Commission)')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>
                      {t.step10HardwareNote(submittedLead.phone)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>✓ SendGrid Notifications Wired:</span>
                  <span>{t.step10NotificationsNote(submittedLead.email)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStep(1)}
                className="portal-btn-brown"
                style={{ padding: '0.85rem 2rem' }}
              >
                {t.step10SubmitAnother}
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
            <ArrowLeft size={16} /> {t.navBack}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="portal-btn-brown"
          >
            {isSubmitting ? (
              <>
                {t.navSubmitting} <Loader2 size={16} className="animate-spin" />
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                {t.navSubmitApplication} <ArrowRight size={16} />
              </>
            ) : (
              <>
                {t.navNext} <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
