import { NextResponse } from 'next/server';

function demoPolygon(center, minutes) {
  const scale = minutes === 15 ? 0.72 : 1;
  const [lng, lat] = center;
  const ring = [
    [-0.20, 0.01], [-0.15, 0.11], [-0.03, 0.15], [0.10, 0.11], [0.20, 0.03],
    [0.15, -0.10], [0.02, -0.14], [-0.12, -0.11], [-0.20, 0.01]
  ].map(([x, y]) => [lng + x * scale, lat + y * scale]);

  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: { demo: true, minutes }, geometry: { type: 'Polygon', coordinates: [ring] } }]
  };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const center = Array.isArray(body.center) && body.center.length === 2 ? body.center.map(Number) : [-88.99936, 33.89668];
  const minutes = [15, 20].includes(Number(body.minutes)) ? Number(body.minutes) : 20;
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ demo: true, provider: 'demo', geojson: demoPolygon(center, minutes) });
  }

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/isochrones/driving-car', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [center],
        range: [minutes * 60],
        range_type: 'time',
        smoothing: 0.45
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('OpenRouteService isochrone error:', response.status, detail);
      return NextResponse.json({ demo: true, provider: 'demo-fallback', geojson: demoPolygon(center, minutes) });
    }

    const geojson = await response.json();
    return NextResponse.json({ demo: false, provider: 'openrouteservice', geojson });
  } catch (error) {
    console.error('Isochrone request failed:', error);
    return NextResponse.json({ demo: true, provider: 'demo-fallback', geojson: demoPolygon(center, minutes) });
  }
}
