export type Language = 'en' | 'nl';

export interface WizardTranslations {
  // Lang switcher
  langPillLabel: string;
  langEn: string;
  langNl: string;

  // Chapters
  chapters: {
    1: string;
    2: string;
    3: string;
    4: string;
  };

  // Nav buttons
  navBack: string;
  navNext: string;
  navSubmitting: string;
  navSubmitApplication: string;

  // Step 1
  step1Title: string;
  step1Subtitle: string;
  step1OtherCity: string;

  // Step 2
  step2Title: string;
  step2Subtitle: (selectedCount: number) => string;
  step2ShowFewer: string;
  step2MoreCuisines: (remainingCount: number) => string;
  cuisines: Record<string, string>;

  // Step 3
  step3Title: string;
  step3Subtitle: string;
  step3FirstName: string;
  step3LastName: string;
  step3Email: string;
  step3Phone: string;
  step3FirstNamePlaceholder: string;
  step3LastNamePlaceholder: string;
  step3EmailPlaceholder: string;
  step3PhonePlaceholder: string;
  errors: {
    firstNameReq: string;
    lastNameReq: string;
    emailReq: string;
    emailInvalid: string;
    phoneReq: string;
    phoneInvalid: string;
  };

  // Step 4
  step4Title: string;
  step4Subtitle: string;
  step4BrandLabel: string;
  step4BrandPlaceholder: string;

  // Step 5
  step5Title: string;
  step5Subtitle: string;
  step5StreetLabel: string;
  step5StreetPlaceholder: string;
  step5PostalLabel: string;
  step5PostalPlaceholder: string;
  step5CityLabel: string;

  // Step 6
  step6Title: string;
  step6Subtitle: string;
  services: Record<string, { label: string; desc: string }>;

  // Step 7
  step7Title: string;
  step7Subtitle: string;
  schedules: Record<string, string>;

  // Step 8
  step8Title: string;
  step8Subtitle: string;
  step8DropzoneAnalyzing: string;
  step8DropzoneUploaded: (filename: string) => string;
  step8DropzonePlaceholder: string;
  step8DropzoneFormats: string;
  step8AttachedSummary: (count: number) => string;
  step8AddManualDish: string;
  step8AddDish: string;
  dishCategories: Record<string, string>;
  dishCard: {
    namePlaceholder: string;
    descPlaceholder: string;
    priceLabel: string;
    pickPhoto: string;
    changePhoto: string;
    removeDish: string;
  };

  // Step 9
  step9Badge: string;
  step9Title: string;
  step9Subtitle: string;
  step9Recommended: string;
  offers: Record<
    string,
    {
      name: string;
      headline: string;
      subheadline: string;
      tagline: string;
      badge: string;
      perks: string[];
    }
  >;
  includedBanner: {
    title: string;
    posTitle: string;
    posDesc: string;
    callTitle: string;
    callDesc: (phone: string) => string;
  };

  // Step 10
  step10Title: string;
  step10Subtitle: string;
  step10DetailsTitle: string;
  step10DishesAttached: (count: number) => string;
  step10PackageTitle: string;
  step10HardwareNote: (phone: string) => string;
  step10NotificationsNote: (email: string) => string;
  step10SubmitAnother: string;
}

export const translations: Record<Language, WizardTranslations> = {
  en: {
    langPillLabel: '🇬🇧 EN',
    langEn: '🇬🇧 English',
    langNl: '🇳🇱 Nederlands',

    chapters: {
      1: 'The Basics',
      2: 'Restaurant & Location',
      3: 'Operations & Menu',
      4: 'Launch Offer & Setup',
    },

    navBack: 'Back',
    navNext: 'Next',
    navSubmitting: 'Submitting...',
    navSubmitApplication: 'Submit application',

    step1Title: 'Where is your restaurant located?',
    step1Subtitle: 'Select your operating city to verify delivery courier dispatch',
    step1OtherCity: 'Other city',

    step2Title: 'What cuisine does your kitchen serve?',
    step2Subtitle: (selectedCount) => `Select up to 3 culinary styles (${selectedCount}/3)`,
    step2ShowFewer: 'Show fewer styles ↑',
    step2MoreCuisines: (remainingCount) => `+ More cuisines (${remainingCount}) ↓`,
    cuisines: {
      'Italian & Pasta': 'Italian & Pasta',
      'Artisan Burgers': 'Artisan Burgers',
      'Surinamese & Javanese': 'Surinamese & Javanese',
      'Asian Street Food & Wok': 'Asian Street Food & Wok',
      'Indian & Pakistani': 'Indian & Pakistani',
      'Middle Eastern & Mezze': 'Middle Eastern & Mezze',
      'Mexican & Tacos': 'Mexican & Tacos',
      'Japanese & Ramen': 'Japanese & Ramen',
      'Healthy & Bowls': 'Healthy & Bowls',
      'Artisanal Bakery & Cafe': 'Artisanal Bakery & Cafe',
      'Mediterranean & Seafood': 'Mediterranean & Seafood',
      'Steakhouse & Grill': 'Steakhouse & Grill',
    },

    step3Title: 'Restaurant Manager / Owner Details',
    step3Subtitle: 'How can the Spoonfull partnership team contact you?',
    step3FirstName: 'First Name *',
    step3LastName: 'Last Name *',
    step3Email: 'Business Email *',
    step3Phone: 'Mobile Phone / WhatsApp *',
    step3FirstNamePlaceholder: 'Marco',
    step3LastNamePlaceholder: 'Rossi',
    step3EmailPlaceholder: 'marco@trattoriamilano.nl',
    step3PhonePlaceholder: '+31 6 12 34 56 78',
    errors: {
      firstNameReq: 'First name is required',
      lastNameReq: 'Last name is required',
      emailReq: 'Business email is required',
      emailInvalid: 'Please enter a valid email address',
      phoneReq: 'Mobile phone / WhatsApp is required',
      phoneInvalid: 'Please enter a valid phone number',
    },

    step4Title: 'What is your restaurant name?',
    step4Subtitle: 'This will be your storefront on the Spoonfull discovery app',
    step4BrandLabel: 'Official Restaurant Brand Name *',
    step4BrandPlaceholder: 'e.g. Trattoria Da Luigi or Tokyo Buns Bar',

    step5Title: 'Where is your kitchen located?',
    step5Subtitle: 'Couriers and customer pickups will arrive at this address',
    step5StreetLabel: 'Street Address & House Number *',
    step5StreetPlaceholder: 'e.g. Herengracht 142',
    step5PostalLabel: 'Postal Code',
    step5PostalPlaceholder: '1015 BN',
    step5CityLabel: 'City',

    step6Title: 'What is your restaurant concept?',
    step6Subtitle: 'Select your primary operation and kitchen fulfillment setup',
    services: {
      dinein_takeout: {
        label: 'Restaurant with Takeaway & Delivery',
        desc: 'Existing brick-and-mortar restaurant adding Spoonfull delivery volume.',
      },
      delivery_only: {
        label: 'Dark Kitchen / Cloud Kitchen',
        desc: 'Facility dedicated exclusively to online courier fulfillment.',
      },
      fine_dining_delivery: {
        label: 'Boutique & Premium Casual',
        desc: 'High-end culinary concept offering elevated delivery presentation.',
      },
      catering: {
        label: 'Restaurant Catering & Group Orders',
        desc: 'Specialized in bulk orders, business events, and corporate lunches.',
      },
    },

    step7Title: 'When will you be open on Spoonfull?',
    step7Subtitle: 'Select your active kitchen order shifts',
    schedules: {
      mon_wed: 'Mon – Wed (Midweek Lunch & Dinner)',
      thu_sun: 'Thu – Sun (Peak Weekend Shifts)',
      full_week: '7 Days a Week Full Service',
      weekends_only: 'Friday & Weekends Only',
      lunch_rush: 'Lunch Only (11:30 - 15:00)',
      dinner_rush: 'Dinner Only (17:00 - 22:30)',
    },

    step8Title: 'Upload & Edit Your Restaurant Menu',
    step8Subtitle: 'Drop your menu file (PDF, CSV, image) and fine-tune your dishes with prices and high-res photos.',
    step8DropzoneAnalyzing: 'Analyzing menu dishes, categories & prices...',
    step8DropzoneUploaded: (filename) => `Uploaded: ${filename}`,
    step8DropzonePlaceholder: 'Click to Upload Menu or Drop File Here',
    step8DropzoneFormats: 'Supports PDF, CSV, Excel, PNG, JPG or food menu photos.',
    step8AttachedSummary: (count) => `File Attached • ${count} Dishes in Editor`,
    step8AddManualDish: '+ Add Your First Dish Manually',
    step8AddDish: 'Add Dish',
    dishCategories: {
      All: 'All',
      Starters: 'Starters',
      Mains: 'Mains',
      Desserts: 'Desserts',
      Sides: 'Sides',
      Drinks: 'Drinks',
    },
    dishCard: {
      namePlaceholder: 'Dish name...',
      descPlaceholder: 'Short dish description, ingredients...',
      priceLabel: 'Price (€)',
      pickPhoto: 'Pick Photo',
      changePhoto: 'Change Photo',
      removeDish: 'Remove Dish',
    },

    step9Badge: 'Exclusive Restaurant Partner Launch Offer',
    step9Title: 'Choose Your Restaurant Launch Offer',
    step9Subtitle:
      'Instead of upfront commission plans, we kickstart your kitchen with fee credits or 2 months of free usage. Both options include a free POS machine and personal setup call.',
    step9Recommended: '★ Recommended Option',
    offers: {
      credits_3k: {
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
      free_2_months: {
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
      },
    },
    includedBanner: {
      title: 'Included with Every Spoonfull Restaurant Partnership',
      posTitle: 'Free Touchscreen POS Terminal Provided',
      posDesc:
        'We deliver a dedicated Spoonfull touchscreen terminal with integrated thermal kitchen receipt printer directly to your venue at zero cost.',
      callTitle: 'Personal Setup Call to Connect Everything',
      callDesc: (phone) =>
        `We will personally call you at ${phone || 'your phone number'} to review your menu, connect printer hardware, and launch your kitchen live.`,
    },

    step10Title: 'Application Successfully Received!',
    step10Subtitle:
      'Welcome to Spoonfull. We are reviewing your kitchen profile and setting up your merchant portal.',
    step10DetailsTitle: 'PARTNERSHIP APPLICATION SUMMARY',
    step10DishesAttached: (count) => `${count} Dishes Attached`,
    step10PackageTitle: 'SELECTED LAUNCH PACKAGE & HARDWARE',
    step10HardwareNote: (phone) =>
      `✅ Complimentary Spoonfull POS machine & receipt printer included • We will call ${phone} to configure hardware`,
    step10NotificationsNote: (email) =>
      `Confirmation emailed to ${email} & admin team alerted at bangalexf@gmail.com`,
    step10SubmitAnother: 'Submit Another Location or Restaurant',
  },

  nl: {
    langPillLabel: '🇳🇱 NL',
    langEn: '🇬🇧 English',
    langNl: '🇳🇱 Nederlands',

    chapters: {
      1: 'De Basis',
      2: 'Restaurant & Locatie',
      3: 'Bedrijfsvoering & Menu',
      4: 'Startaanbod & Setup',
    },

    navBack: 'Terug',
    navNext: 'Volgende',
    navSubmitting: 'Verzenden...',
    navSubmitApplication: 'Aanvraag indienen',

    step1Title: 'Waar is je restaurant gevestigd?',
    step1Subtitle: 'Selecteer je stad om bezorging en koeriersdiensten te verifiëren',
    step1OtherCity: 'Andere stad',

    step2Title: 'Welke keuken serveert jouw restaurant?',
    step2Subtitle: (selectedCount) => `Selecteer maximaal 3 stijlen (${selectedCount}/3)`,
    step2ShowFewer: 'Minder stijlen tonen ↑',
    step2MoreCuisines: (remainingCount) => `+ Meer keukens (${remainingCount}) ↓`,
    cuisines: {
      'Italian & Pasta': 'Italiaans & Pasta',
      'Artisan Burgers': 'Ambachtelijke Burgers',
      'Surinamese & Javanese': 'Surinaams & Javaans',
      'Asian Street Food & Wok': 'Aziatisch & Wok',
      'Indian & Pakistani': 'Indiaas & Pakistaans',
      'Middle Eastern & Mezze': 'Midden-Oosters & Mezze',
      'Mexican & Tacos': "Mexicaans & Taco's",
      'Japanese & Ramen': 'Japans & Ramen',
      'Healthy & Bowls': 'Gezond & Bowls',
      'Artisanal Bakery & Cafe': 'Bakkerij & Café',
      'Mediterranean & Seafood': 'Mediterraans & Vis',
      'Steakhouse & Grill': 'Steakhouse & Grill',
    },

    step3Title: 'Gegevens eigenaar / bedrijfsleider',
    step3Subtitle: 'Hoe kan het Spoonfull-partnerteam contact met je opnemen?',
    step3FirstName: 'Voornaam *',
    step3LastName: 'Achternaam *',
    step3Email: 'Zakelijk e-mailadres *',
    step3Phone: 'Mobiel telefoonnummer / WhatsApp *',
    step3FirstNamePlaceholder: 'Marco',
    step3LastNamePlaceholder: 'Rossi',
    step3EmailPlaceholder: 'marco@trattoriamilano.nl',
    step3PhonePlaceholder: '+31 6 12 34 56 78',
    errors: {
      firstNameReq: 'Voornaam is verplicht',
      lastNameReq: 'Achternaam is verplicht',
      emailReq: 'Zakelijk e-mailadres is verplicht',
      emailInvalid: 'Voer een geldig e-mailadres in',
      phoneReq: 'Mobiel telefoonnummer / WhatsApp is verplicht',
      phoneInvalid: 'Voer een geldig telefoonnummer in',
    },

    step4Title: 'Wat is de naam van je restaurant?',
    step4Subtitle: 'Dit wordt je profielpagina in de Spoonfull app voor gasten',
    step4BrandLabel: 'Officiële restaurantnaam *',
    step4BrandPlaceholder: 'bijv. Trattoria Da Luigi of Tokyo Buns Bar',

    step5Title: 'Waar bevindt je keuken zich?',
    step5Subtitle: 'Koeriers en afhalers halen bestellingen op op dit adres',
    step5StreetLabel: 'Straatnaam & huisnummer *',
    step5StreetPlaceholder: 'bijv. Herengracht 142',
    step5PostalLabel: 'Postcode',
    step5PostalPlaceholder: '1015 BN',
    step5CityLabel: 'Stad',

    step6Title: 'Wat is je restaurantconcept?',
    step6Subtitle: 'Selecteer hoe je keuken en bezorging zijn ingericht',
    services: {
      dinein_takeout: {
        label: 'Restaurant met afhalen & bezorgen',
        desc: 'Bestaand fysiek restaurant dat extra bezorgvolume via Spoonfull toevoegt.',
      },
      delivery_only: {
        label: 'Dark Kitchen / Spookkeuken',
        desc: 'Keuken uitsluitend ingericht voor online bezorging via koeriers.',
      },
      fine_dining_delivery: {
        label: 'Boutique & Premium Casual',
        desc: 'Exclusief culinair concept met hoogwaardige bezorgpresentatie.',
      },
      catering: {
        label: 'Catering & Groepsbestellingen',
        desc: 'Gespecialiseerd in grote bestellingen, bedrijfsevenementen en lunches.',
      },
    },

    step7Title: 'Wanneer ben je geopend op Spoonfull?',
    step7Subtitle: 'Selecteer je actieve openingsuren voor bestellingen',
    schedules: {
      mon_wed: 'Ma – Wo (Lunch & Diner door de week)',
      thu_sun: 'Do – Zo (Drukke weekenddiensten)',
      full_week: '7 dagen per week geopend',
      weekends_only: 'Alleen vrijdag en het weekend',
      lunch_rush: 'Alleen lunch (11:30 - 15:00)',
      dinner_rush: 'Alleen diner (17:00 - 22:30)',
    },

    step8Title: 'Upload & bewerk je restaurantmenu',
    step8Subtitle: 'Upload je menukaart (PDF, CSV, afbeelding) of bewerk gerechten direct met prijzen en foto’s.',
    step8DropzoneAnalyzing: 'Menukaart, categorieën en prijzen worden geanalyseerd...',
    step8DropzoneUploaded: (filename) => `Geüpload: ${filename}`,
    step8DropzonePlaceholder: 'Klik om menu te uploaden of sleep bestand hierheen',
    step8DropzoneFormats: "Ondersteunt PDF, CSV, Excel, PNG, JPG of menufoto's.",
    step8AttachedSummary: (count) => `Bestand gekoppeld • ${count} gerechten in editor`,
    step8AddManualDish: '+ Voeg handmatig je eerste gerecht toe',
    step8AddDish: 'Gerecht toevoegen',
    dishCategories: {
      All: 'Alles',
      Starters: 'Voorgerechten',
      Mains: 'Hoofdgerechten',
      Desserts: 'Desserts',
      Sides: 'Bijgerechten',
      Drinks: 'Drankjes',
    },
    dishCard: {
      namePlaceholder: 'Naam van gerecht...',
      descPlaceholder: 'Korte beschrijving, ingrediënten...',
      priceLabel: 'Prijs (€)',
      pickPhoto: 'Kies foto',
      changePhoto: 'Wijzig foto',
      removeDish: 'Verwijder gerecht',
    },

    step9Badge: 'Exclusief Spoonfull Partner Startaanbod',
    step9Title: 'Kies je Spoonfull startaanbod',
    step9Subtitle:
      'Geen opstartkosten: we starten je keuken op met tegoed voor commissies of 2 maanden gratis gebruik. Beide opties zijn inclusief gratis kassa/printer en persoonlijke onboarding.',
    step9Recommended: '★ Aanbevolen optie',
    offers: {
      credits_3k: {
        name: '€3.000 Commissietegoed',
        headline: '€3.000 Tegoed',
        subheadline: 'Compenseer commissie & bestelkosten',
        tagline: 'Ideaal voor restaurants die direct maximale cashflow willen',
        badge: 'Meest flexibel',
        perks: [
          '€3.000 tegoed rechtstreeks toegepast op je restaurantaccount',
          'Gratis touchscreen kassa met bonnenprinter inbegrepen',
          'Persoonlijke onboarding om hardware en menu in te stellen',
          'Behoud 100% van je omzet totdat het tegoed is verbruikt',
          'Wekelijkse automatische uitbetalingen & geen aansluitkosten',
        ],
      },
      free_2_months: {
        name: '2 Maanden Volledig Gratis',
        headline: '2 Maanden 100% Gratis',
        subheadline: '0% commissie gedurende 60 dagen',
        tagline: 'Ideaal voor restaurants die risicoloos bezorging willen uitbreiden',
        badge: 'Meest gekozen',
        perks: [
          '0% commissie & gratis gebruik gedurende je eerste 60 dagen',
          'Gratis touchscreen kassa met bonnenprinter inbegrepen',
          'Persoonlijke onboarding om hardware en menu in te stellen',
          'Onbeperkt bestellingen verwerken tijdens de actieperiode',
          'Geen vast contract — op elk moment pauzeren of opzeggen',
        ],
      },
    },
    includedBanner: {
      title: 'Inbegrepen bij elke Spoonfull samenwerking',
      posTitle: 'Gratis touchscreen kassa geleverd',
      posDesc:
        'Wij leveren kosteloos een speciale Spoonfull touchscreen kassa met ingebouwde thermische keukenprinter op jouw locatie.',
      callTitle: 'Persoonlijke installatie & onboarding',
      callDesc: (phone) =>
        `We nemen telefonisch contact met je op via ${phone || 'je telefoonnummer'} om je menu te controleren, printer te koppelen en live te gaan.`,
    },

    step10Title: 'Aanvraag succesvol ontvangen!',
    step10Subtitle:
      'Welkom bij Spoonfull. We bekijken je restaurantprofiel en richten je partnerportaal in.',
    step10DetailsTitle: 'OVERZICHT VAN JE AANVRAAG',
    step10DishesAttached: (count) => `${count} Gerechten toegevoegd`,
    step10PackageTitle: 'GEKOZEN STARTPAKKET & HARDWARE',
    step10HardwareNote: (phone) =>
      `✅ Gratis Spoonfull kassa & bonnenprinter inbegrepen • We bellen ${phone} om hardware in te stellen`,
    step10NotificationsNote: (email) =>
      `Bevestiging verzonden naar ${email} & partnerteam genotificeerd`,
    step10SubmitAnother: 'Nog een restaurant of locatie aanmelden',
  },
};
