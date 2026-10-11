export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { content, filename, mimeType, isBase64 } = req.body || {};

  if (!content) {
    return res.status(400).json({ success: false, error: 'No content provided' });
  }

  try {
    // If Gemini API Key or Lovable API key is configured in env, run AI parser
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const systemPrompt = `You are an expert restaurant menu parser. Extract all dishes and beverages from the provided menu and return a strict JSON array.
Each object must have:
- name: string (e.g. "Spaghetti Carbonara")
- description: string (e.g. "Creamy pecorino, crispy guanciale, black pepper")
- price: number (decimal without currency symbols, e.g. 14.50)
- category: string ("Starters", "Mains", "Desserts", "Drinks", or "Sides")
- is_upsell: boolean (true for drinks, desserts, sides; false for main dishes)

Return ONLY valid JSON array with no conversational markdown or backticks.`;

    if (geminiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload: any = {
        contents: [
          {
            parts: isBase64
              ? [
                  { text: systemPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType || 'image/jpeg',
                      data: content.replace(/^data:[^;]+;base64,/, ''),
                    },
                  },
                ]
              : [{ text: `${systemPrompt}\n\nMenu filename: ${filename}\nMenu text:\n${content}` }],
          },
        ],
      };

      const aiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const rawText = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
        const dishes = JSON.parse(cleaned);
        if (Array.isArray(dishes) && dishes.length > 0) {
          return res.status(200).json({ success: true, dishes });
        }
      }
    }

    // Smart fallback parser for text and structured data
    const parsedDishes = parseRawMenuText(String(content));
    return res.status(200).json({ success: true, dishes: parsedDishes });
  } catch (error: any) {
    console.error('Menu parse error:', error);
    const fallbackDishes = parseRawMenuText(String(content));
    return res.status(200).json({ success: true, dishes: fallbackDishes });
  }
}

function parseRawMenuText(text: string): any[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const dishes: any[] = [];
  let currentCategory = 'Mains';

  const categoryHeaders: Record<string, string> = {
    starter: 'Starters',
    voorgerecht: 'Starters',
    appetizer: 'Starters',
    antipasti: 'Starters',
    main: 'Mains',
    hoofdgerecht: 'Mains',
    pasta: 'Mains',
    pizza: 'Mains',
    burger: 'Mains',
    curry: 'Mains',
    dessert: 'Desserts',
    nagerecht: 'Desserts',
    sweet: 'Desserts',
    drink: 'Drinks',
    drank: 'Drinks',
    beverage: 'Drinks',
    bier: 'Drinks',
    wijn: 'Drinks',
    side: 'Sides',
    bijgerecht: 'Sides',
    extra: 'Sides',
  };

  const priceRegex = /(?:€|\$|EUR)?\s*([0-9]+[.,][0-9]{2}|[0-9]{1,2}(?:,-|-)?)(?:\s*(?:€|\$|EUR))?/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a category section header
    const lower = line.toLowerCase();
    const matchedCategory = Object.keys(categoryHeaders).find((k) => lower.includes(k));
    if (matchedCategory && line.length < 35 && !priceRegex.test(line)) {
      currentCategory = categoryHeaders[matchedCategory];
      continue;
    }

    // Check for dish with price
    const match = line.match(priceRegex);
    if (match) {
      const priceStr = match[1].replace(/[,-]/g, '.');
      const price = parseFloat(priceStr) || 12.5;

      // Clean name
      let name = line.replace(match[0], '').replace(/[—–\-:;]/g, ' ').trim();
      name = name.replace(/\s+/g, ' ');

      if (name.length > 2) {
        // Next line might be a description if it has no price
        let description = '';
        if (i + 1 < lines.length && !priceRegex.test(lines[i + 1]) && lines[i + 1].length < 150) {
          description = lines[i + 1];
          i++; // Skip description line
        }

        dishes.push({
          name,
          description,
          price,
          category: currentCategory,
          is_upsell: ['Drinks', 'Desserts', 'Sides'].includes(currentCategory),
        });
      }
    }
  }

  return dishes;
}
