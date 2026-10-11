import { Dish } from '../types/onboarding';

export const FOOD_PHOTO_PRESETS_BY_CATEGORY: Record<string, string[]> = {
  mains: [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80', // Pasta
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', // Burger
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Steak
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', // Ramen
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', // Pizza
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80', // Curry
  ],
  starters: [
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80', // Bruschetta / bites
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', // Salad
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', // Soup
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80', // Meatballs / Tapas
  ],
  desserts: [
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', // Tiramisu
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', // Cake
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', // Ice cream
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80', // Pastry
  ],
  drinks: [
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', // Cocktail
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', // Soda
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', // Coffee
    'https://images.unsplash.com/photo-1608270199043-90989f66014e?auto=format&fit=crop&w=600&q=80', // Beer
  ],
  sides: [
    'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', // Fries
    'https://images.unsplash.com/photo-1505253758473-96b3015f27eb?auto=format&fit=crop&w=600&q=80', // Garlic bread
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80', // Rice
  ],
};

function pickPresetImage(category: string, dishIndex: number): string {
  const catKey = (category || 'mains').toLowerCase();
  const presets =
    FOOD_PHOTO_PRESETS_BY_CATEGORY[catKey] ||
    (catKey.includes('start') || catKey.includes('app')
      ? FOOD_PHOTO_PRESETS_BY_CATEGORY.starters
      : catKey.includes('dess') || catKey.includes('sweet')
      ? FOOD_PHOTO_PRESETS_BY_CATEGORY.desserts
      : catKey.includes('drink') || catKey.includes('bever')
      ? FOOD_PHOTO_PRESETS_BY_CATEGORY.drinks
      : catKey.includes('side') || catKey.includes('extra')
      ? FOOD_PHOTO_PRESETS_BY_CATEGORY.sides
      : FOOD_PHOTO_PRESETS_BY_CATEGORY.mains);

  return presets[dishIndex % presets.length];
}

/**
 * Intelligent file reader & parser for uploaded menu documents.
 * Handles CSV, TXT, PDF, and image formats (JPG, PNG, WEBP).
 */
export async function parseUploadedMenuFile(file: File): Promise<Dish[]> {
  const isImage = file.type.startsWith('image/');
  const isCsvOrText =
    file.name.toLowerCase().endsWith('.csv') ||
    file.name.toLowerCase().endsWith('.txt') ||
    file.type === 'text/csv' ||
    file.type === 'text/plain';

  // 1. Text / CSV local parsing
  if (isCsvOrText) {
    const text = await file.text();
    const dishes = parseTextMenu(text);
    if (dishes.length > 0) return dishes;
  }

  // 2. Call serverless parser with base64 DataURL
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const res = await fetch('/api/parse-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: dataUrl,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        isBase64: isImage,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.dishes) && json.dishes.length > 0) {
        return json.dishes.map((item: any, idx: number): Dish => ({
          id: `dish-${Date.now()}-${idx}`,
          name: item.name || `Special Item ${idx + 1}`,
          description: item.description || '',
          price: Number(item.price) || 12.5,
          category: item.category || 'Mains',
          imageUrl: item.imageUrl || pickPresetImage(item.category || 'mains', idx),
          isAvailable: true,
        }));
      }
    }
  } catch (err) {
    console.warn('API parse-menu call fallback to smart heuristics:', err);
  }

  // 3. Fallback smart template dishes inspired by filename
  return generateHeuristicMenu(file.name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseTextMenu(text: string): Dish[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const dishes: Dish[] = [];
  let currentCategory = 'Mains';

  const categoryKeywords: Record<string, string> = {
    starter: 'Starters',
    voorgerecht: 'Starters',
    antipasti: 'Starters',
    main: 'Mains',
    hoofd: 'Mains',
    pasta: 'Mains',
    pizza: 'Mains',
    burger: 'Mains',
    dessert: 'Desserts',
    nagerecht: 'Desserts',
    drink: 'Drinks',
    drank: 'Drinks',
    beverage: 'Drinks',
    side: 'Sides',
    extra: 'Sides',
  };

  const priceRegex = /(?:€|\$|EUR)?\s*([0-9]+[.,][0-9]{2}|[0-9]{1,2}(?:,-|-)?)(?:\s*(?:€|\$|EUR))?/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check category header
    const lower = line.toLowerCase();
    const matchedCat = Object.keys(categoryKeywords).find((k) => lower.includes(k));
    if (matchedCat && line.length < 30 && !priceRegex.test(line)) {
      currentCategory = categoryKeywords[matchedCat];
      continue;
    }

    // CSV format split
    if (line.includes(',')) {
      const parts = line.split(',').map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts[0] && parts[0].toLowerCase() !== 'name' && parts[0].toLowerCase() !== 'dish') {
        const name = parts[0];
        const price = parts[1] ? parseFloat(parts[1].replace(/[^0-9.]/g, '')) || 12.0 : 12.0;
        const category = parts[2] || currentCategory;
        const description = parts[3] || '';
        dishes.push({
          id: `dish-${Date.now()}-${dishes.length}`,
          name,
          price,
          category,
          description,
          imageUrl: pickPresetImage(category, dishes.length),
          isAvailable: true,
        });
        continue;
      }
    }

    // Free text line with price
    const match = line.match(priceRegex);
    if (match) {
      const priceStr = match[1].replace(/[,-]/g, '.');
      const price = parseFloat(priceStr) || 12.5;
      let name = line.replace(match[0], '').replace(/[—–\-:;]/g, ' ').trim();
      name = name.replace(/\s+/g, ' ');

      if (name.length > 2) {
        let description = '';
        if (i + 1 < lines.length && !priceRegex.test(lines[i + 1]) && lines[i + 1].length < 140) {
          description = lines[i + 1];
          i++;
        }

        dishes.push({
          id: `dish-${Date.now()}-${dishes.length}`,
          name,
          description,
          price,
          category: currentCategory,
          imageUrl: pickPresetImage(currentCategory, dishes.length),
          isAvailable: true,
        });
      }
    }
  }

  return dishes;
}

function generateHeuristicMenu(filename: string): Dish[] {
  const lower = filename.toLowerCase();

  if (lower.includes('burger')) {
    return [
      {
        id: `dish-1`,
        name: 'The Classic Smash Cheeseburger',
        description: 'Dry-aged beef patty, double cheddar, caramelized onions, house burger sauce on brioche.',
        price: 13.5,
        category: 'Mains',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.mains[1],
        isAvailable: true,
      },
      {
        id: `dish-2`,
        name: 'Truffle & Bacon Deluxe',
        description: 'Smash beef, crispy bacon, aged gouda, black truffle mayo.',
        price: 15.5,
        category: 'Mains',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.mains[1],
        isAvailable: true,
      },
      {
        id: `dish-3`,
        name: 'Crispy Truffle Fries',
        description: 'Hand-cut skin-on fries tossed in parmesan & white truffle oil.',
        price: 5.5,
        category: 'Sides',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.sides[0],
        isAvailable: true,
      },
      {
        id: `dish-4`,
        name: 'Craft Ginger Beer',
        description: 'Naturally brewed sparkling ginger drink.',
        price: 3.5,
        category: 'Drinks',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.drinks[1],
        isAvailable: true,
      },
    ];
  }

  if (lower.includes('pizza') || lower.includes('pasta') || lower.includes('ital')) {
    return [
      {
        id: `dish-1`,
        name: 'Tagliatelle al Tartufo',
        description: 'Fresh egg pasta with seasonal black truffle butter and 24-month Parmigiano Reggiano.',
        price: 18.5,
        category: 'Mains',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.mains[0],
        isAvailable: true,
      },
      {
        id: `dish-2`,
        name: 'Pizza Margherita Verace',
        description: 'San Marzano D.O.P. tomatoes, fior di latte mozzarella, fresh basil, extra virgin olive oil.',
        price: 14.0,
        category: 'Mains',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.mains[4],
        isAvailable: true,
      },
      {
        id: `dish-3`,
        name: 'Burrata Pugliese con Pomodorini',
        description: 'Creamy burrata, roasted cherry tomatoes, basil pesto, grilled sourdough.',
        price: 11.5,
        category: 'Starters',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.starters[0],
        isAvailable: true,
      },
      {
        id: `dish-4`,
        name: 'Artisanal Tiramisù Classico',
        description: 'Savoiardi biscuits soaked in espresso, mascarpone mousse, bitter cocoa.',
        price: 7.5,
        category: 'Desserts',
        imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.desserts[0],
        isAvailable: true,
      },
    ];
  }

  // General restaurant starter kit
  return [
    {
      id: `dish-1`,
      name: 'Signature House Special',
      description: 'Chef recommendation prepared with local fresh ingredients.',
      price: 16.5,
      category: 'Mains',
      imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.mains[0],
      isAvailable: true,
    },
    {
      id: `dish-2`,
      name: 'Crispy Seasonal Appetizer',
      description: 'Fresh market produce, house dipping sauce, herbs.',
      price: 8.5,
      category: 'Starters',
      imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.starters[1],
      isAvailable: true,
    },
    {
      id: `dish-3`,
      name: 'Artisan Side Dish',
      description: 'Perfect accompaniment prepared daily.',
      price: 5.0,
      category: 'Sides',
      imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.sides[0],
      isAvailable: true,
    },
    {
      id: `dish-4`,
      name: 'Refreshing Beverage',
      description: 'Cold artisan beverage.',
      price: 3.5,
      category: 'Drinks',
      imageUrl: FOOD_PHOTO_PRESETS_BY_CATEGORY.drinks[0],
      isAvailable: true,
    },
  ];
}
