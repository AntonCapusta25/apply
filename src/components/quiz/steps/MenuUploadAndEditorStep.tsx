import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Sparkles,
  Utensils,
  Eye,
  Camera,
  Loader2,
} from 'lucide-react';
import { Dish } from '../../../types/onboarding';
import { parseUploadedMenuFile } from '../../../services/menuParserService';

interface MenuUploadAndEditorStepProps {
  dishes: Dish[];
  uploadedFilename?: string;
  onUpdateDishes: (dishes: Dish[], filename?: string) => void;
  restaurantName: string;
}

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80', // Pasta
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', // Burger
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', // Meat
  'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=600&q=80', // Salad
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', // Ramen
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', // Tiramisu
];

function parseCsvMenuText(csvText: string): Dish[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0].toLowerCase();
  const startIndex = firstLine.includes('name') || firstLine.includes('dish') || firstLine.includes('price') ? 1 : 0;
  const parsed: Dish[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length >= 1 && cols[0]) {
      const name = cols[0];
      const price = cols[1] ? parseFloat(cols[1].replace(/[^0-9.]/g, '')) || 12.0 : 12.0;
      const category = cols[2] || 'Mains';
      const description = cols[3] || '';
      parsed.push({
        id: `dish-${Date.now()}-${i}`,
        name,
        price,
        category,
        description,
        isAvailable: true,
      });
    }
  }
  return parsed;
}

export const MenuUploadAndEditorStep: React.FC<MenuUploadAndEditorStepProps> = ({
  dishes,
  uploadedFilename,
  onUpdateDishes,
  restaurantName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingImageDishId, setEditingImageDishId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Handle file drop / upload with automated parsing across any format
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseNotice(null);

    try {
      const parsedDishes = await parseUploadedMenuFile(file);
      if (parsedDishes.length > 0) {
        onUpdateDishes(parsedDishes, file.name);
        setParseNotice(`✓ Extracted ${parsedDishes.length} dishes with categories & prices from ${file.name}`);
      } else {
        onUpdateDishes(dishes, file.name);
        setParseNotice(`✓ Attached ${file.name}`);
      }
    } catch (err) {
      console.error('Failed parsing menu file:', err);
      onUpdateDishes(dishes, file.name);
    } finally {
      setIsParsing(false);
    }
  };

  // Add new blank dish
  const handleAddDish = () => {
    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      name: '',
      description: '',
      price: 12.0,
      category: selectedCategory === 'All' ? 'Mains' : selectedCategory,
      imageUrl: '',
      isAvailable: true,
    };
    onUpdateDishes([...dishes, newDish], uploadedFilename);
  };

  // Update a dish field
  const handleDishChange = (id: string, field: keyof Dish, value: any) => {
    const updated = dishes.map((d) => (d.id === id ? { ...d, [field]: value } : d));
    onUpdateDishes(updated, uploadedFilename);
  };

  // Remove dish
  const handleRemoveDish = (id: string) => {
    const updated = dishes.filter((d) => d.id !== id);
    onUpdateDishes(updated, uploadedFilename);
  };

  // Apply photo preset
  const handleApplyPhoto = (dishId: string, url: string) => {
    handleDishChange(dishId, 'imageUrl', url);
    setEditingImageDishId(null);
    setCustomImageUrl('');
  };

  // Dynamic categories extracted from parsed menu dishes + defaults
  const categories = Array.from(
    new Set(['All', 'Starters', 'Mains', 'Desserts', 'Sides', 'Drinks', ...dishes.map((d) => d.category || 'Mains')])
  );

  const filteredDishes =
    selectedCategory === 'All' ? dishes : dishes.filter((d) => (d.category || 'Mains') === selectedCategory);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'left' }}>
      <h1 className="wizard-step-title font-display" style={{ textAlign: 'center' }}>
        Upload & Edit Your Restaurant Menu
      </h1>
      <p className="wizard-step-subtitle" style={{ textAlign: 'center' }}>
        Drop your menu file (PDF, CSV, image) and fine-tune your dishes with prices and high-res photos.
      </p>

      {/* 1. Upload Window Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #CBD5E1',
          borderRadius: '16px',
          background: '#FFFFFF',
          padding: '1.75rem',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.png,.jpg,.jpeg,.xlsx,.txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--portal-brown-pill)',
            color: 'var(--portal-brown)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
          }}
        >
          {isParsing ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={26} />}
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
          {isParsing
            ? 'Analyzing menu dishes, categories & prices...'
            : uploadedFilename
            ? `Uploaded: ${uploadedFilename}`
            : 'Click to Upload Menu or Drop File Here'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
          Supports <strong>PDF, CSV, Excel, PNG, JPG</strong> or food menu photos.
        </p>

        {parseNotice && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.75rem',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#ECFDF5',
              color: '#065F46',
              fontSize: '0.8rem',
              fontWeight: 800,
            }}
          >
            <span>{parseNotice}</span>
          </div>
        )}

        {uploadedFilename && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.75rem',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: '#ECFDF5',
              color: '#065F46',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <Check size={14} /> File Attached • {dishes.length} Dishes in Editor
          </div>
        )}
      </div>

      {/* If no dishes in editor, allow adding real dishes manually */}
      {dishes.length === 0 && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleAddDish}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#FFFFFF',
              border: '1.5px dashed var(--portal-brown)',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'var(--portal-brown)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> + Add Your First Dish Manually
          </button>
        </div>
      )}

      {/* 2. Interactive Menu Editor */}
      {dishes.length > 0 && (
        <div>
          {/* Header & Category Filters */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--portal-brown)' : '#E2E8F0',
                    background: selectedCategory === cat ? 'var(--portal-brown)' : '#FFFFFF',
                    color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddDish}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#FAF8F5',
                border: '1px solid var(--portal-brown)',
                color: 'var(--portal-brown)',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add Dish
            </button>
          </div>

          {/* Dishes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  alignItems: 'flex-start',
                }}
              >
                {/* Dish Photo Thumbnail & Change button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <div
                    style={{
                      width: '78px',
                      height: '78px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                      flexShrink: 0,
                    }}
                  >
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <ImageIcon size={24} style={{ color: '#94A3B8' }} />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingImageDishId(editingImageDishId === dish.id ? null : dish.id)
                    }
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--portal-brown)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Camera size={11} /> {dish.imageUrl ? 'Change' : '+ Photo'}
                  </button>
                </div>

                {/* Dish Details Inputs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="dish-row-grid">
                    <input
                      type="text"
                      className="portal-input"
                      style={{ height: '38px', fontSize: '0.9rem', fontWeight: 700 }}
                      placeholder="Dish Name (e.g. Truffle Tagliolini)"
                      value={dish.name}
                      onChange={(e) => handleDishChange(dish.id, 'name', e.target.value)}
                    />

                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '9px',
                          fontSize: '0.85rem',
                          color: '#64748B',
                          fontWeight: 700,
                        }}
                      >
                        €
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        className="portal-input"
                        style={{ height: '38px', paddingLeft: '24px', fontSize: '0.9rem', fontWeight: 700 }}
                        placeholder="14.50"
                        value={dish.price}
                        onChange={(e) =>
                          handleDishChange(dish.id, 'price', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>

                    <select
                      className="portal-input"
                      style={{ height: '38px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      value={dish.category}
                      onChange={(e) => handleDishChange(dish.id, 'category', e.target.value)}
                    >
                      <option value="Starters">Starters</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Sides">Sides</option>
                      <option value="Drinks">Drinks</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    className="portal-input"
                    style={{ height: '36px', fontSize: '0.825rem' }}
                    placeholder="Short description (ingredients, dietary notes, portion size...)"
                    value={dish.description}
                    onChange={(e) => handleDishChange(dish.id, 'description', e.target.value)}
                  />

                  {/* Photo Picker Drawer for this dish */}
                  {editingImageDishId === dish.id && (
                    <div
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        marginTop: '0.35rem',
                      }}
                    >
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                        Select Photo Preset or Paste Image URL:
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto' }}>
                        {SAMPLE_PHOTO_PRESETS.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Preset"
                            onClick={() => handleApplyPhoto(dish.id, url)}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: dish.imageUrl === url ? '2px solid var(--portal-brown)' : '1px solid #CBD5E1',
                            }}
                          />
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <input
                          type="url"
                          className="portal-input"
                          style={{ height: '32px', fontSize: '0.78rem' }}
                          placeholder="Paste image link: https://..."
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyPhoto(dish.id, customImageUrl)}
                          className="portal-btn-brown"
                          style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.75rem' }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveDish(dish.id)}
                  style={{
                    color: '#94A3B8',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                  title="Remove dish"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
