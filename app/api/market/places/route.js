import { NextResponse } from 'next/server';

const DEMO_PLACES = [
  { id: 'demo-1', name: 'Houston Family Dental', type: 'Dentist', status: 'Available', lng: -88.987, lat: 33.902 },
  { id: 'demo-2', name: 'Faith Community Church', type: 'Church', status: 'Directory', lng: -89.011, lat: 33.906 },
  { id: 'demo-3', name: 'Smith Heating & Air', type: 'HVAC', status: 'Follow-up', lng: -88.982, lat: 33.887 },
  { id: 'demo-4', name: 'Helping Hands Outreach', type: 'Nonprofit', status: 'Available', lng: -89.015, lat: 33.886 },
  { id: 'demo-5', name: 'Main Street Cafe', type: 'Restaurant', status: 'Advertiser', lng: -88.999, lat: 33.897 },
  { id: 'demo-6', name: 'Northside Auto Care', type: 'Automotive', status: 'Available', lng: -89.017, lat: 33.899 }
];

function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return true;
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function classify(place, query) {
  const types = place.types || [];
  if (query.includes('church') || types.includes('church') || types.includes('place_of_worship')) return 'Church';
  if (query.includes('nonprofit')) return 'Nonprofit';
  const primary = place.primaryTypeDisplayName?.text || place.primaryType || 'Business';
  return primary.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function searchGoogle({ apiKey, query, center, radiusMeters }) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.types,places.websiteUri,places.nationalPhoneNumber'
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: center[1], longitude: center[0] },
          radius: radiusMeters
        }
      }
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Places ${response.status}: ${detail}`);
  }

  const data = await response.json();
  return (data.places || []).map(place => ({ place, query }));
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const center = Array.isArray(body.center) && body.center.length === 2 ? body.center.map(Number) : [-88.99936, 33.89668];
  const minutes = [15, 20].includes(Number(body.minutes)) ? Number(body.minutes) : 20;
  const polygon = Array.isArray(body.polygon) ? body.polygon : [];
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ demo: true, provider: 'demo', places: DEMO_PLACES });
  }

  // Search groups are intentionally limited to control API cost. Expand this list
  // as Rejoice Weekly finalizes its advertiser-category taxonomy.
  const queries = [
    'local business',
    'church',
    'nonprofit organization',
    'restaurant',
    'dentist',
    'auto repair',
    'HVAC contractor',
    'plumber',
    'real estate agency',
    'insurance agency'
  ];
  const radiusMeters = minutes === 15 ? 18000 : 25000;

  try {
    const groups = [];
    for (const query of queries) {
      groups.push(...await searchGoogle({ apiKey, query, center, radiusMeters }));
    }

    const deduped = new Map();
    for (const { place, query } of groups) {
      const lng = place.location?.longitude;
      const lat = place.location?.latitude;
      if (typeof lng !== 'number' || typeof lat !== 'number') continue;
      if (polygon.length && !pointInPolygon([lng, lat], polygon)) continue;
      if (deduped.has(place.id)) continue;
      deduped.set(place.id, {
        id: place.id,
        name: place.displayName?.text || 'Local organization',
        type: classify(place, query),
        status: 'Available',
        lng,
        lat,
        address: place.formattedAddress || '',
        website: place.websiteUri || '',
        phone: place.nationalPhoneNumber || ''
      });
    }

    return NextResponse.json({ demo: false, provider: 'google-places', places: Array.from(deduped.values()).slice(0, 120) });
  } catch (error) {
    console.error('Places search failed:', error);
    return NextResponse.json({ demo: true, provider: 'demo-fallback', places: DEMO_PLACES });
  }
}
