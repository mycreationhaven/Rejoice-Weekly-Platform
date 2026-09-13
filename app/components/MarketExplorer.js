'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DEMO_CENTER = [-88.99936, 33.89668];
const DEMO_PROSPECTS = [
  { id: 'demo-1', name: 'Houston Family Dental', type: 'Dentist', status: 'Available', lng: -88.987, lat: 33.902 },
  { id: 'demo-2', name: 'Faith Community Church', type: 'Church', status: 'Directory', lng: -89.011, lat: 33.906 },
  { id: 'demo-3', name: 'Smith Heating & Air', type: 'HVAC', status: 'Follow-up', lng: -88.982, lat: 33.887 },
  { id: 'demo-4', name: 'Helping Hands Outreach', type: 'Nonprofit', status: 'Available', lng: -89.015, lat: 33.886 },
  { id: 'demo-5', name: 'Main Street Cafe', type: 'Restaurant', status: 'Advertiser', lng: -88.999, lat: 33.897 },
  { id: 'demo-6', name: 'Northside Auto Care', type: 'Automotive', status: 'Available', lng: -89.017, lat: 33.899 }
];

function fallbackPolygon(minutes) {
  const scale = minutes === 15 ? 0.72 : 1;
  const [lng, lat] = DEMO_CENTER;
  const points = [
    [-0.20, 0.01], [-0.15, 0.11], [-0.03, 0.15], [0.10, 0.11], [0.20, 0.03],
    [0.15, -0.10], [0.02, -0.14], [-0.12, -0.11], [-0.20, 0.01]
  ].map(([x, y]) => [lng + x * scale, lat + y * scale]);
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { demo: true }, geometry: { type: 'Polygon', coordinates: [points] } }] };
}

export default function MarketExplorer() {
  const mapNode = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const [minutes, setMinutes] = useState(20);
  const [prospects, setProspects] = useState(DEMO_PROSPECTS);
  const [selectedType, setSelectedType] = useState('All');
  const [mode, setMode] = useState('Loading market data…');
  const [selected, setSelected] = useState(null);

  const visibleProspects = useMemo(() => selectedType === 'All' ? prospects : prospects.filter(p => p.type === selectedType), [prospects, selectedType]);
  const types = useMemo(() => ['All', ...Array.from(new Set(prospects.map(p => p.type))).sort()], [prospects]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !mapNode.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapNode.current,
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
        center: DEMO_CENTER,
        zoom: 10.1,
        attributionControl: true
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      mapRef.current = map;
      map.on('load', () => refreshMarket(map, maplibregl, minutes));
    }

    boot();
    return () => {
      cancelled = true;
      markerRefs.current.forEach(marker => marker.remove());
      markerRefs.current = [];
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.loaded()) return;
    import('maplibre-gl').then(module => refreshMarket(mapRef.current, module.default, minutes));
  }, [minutes]);

  async function refreshMarket(map, maplibregl, duration) {
    setMode('Loading live drive-time boundary…');
    let boundary = fallbackPolygon(duration);
    let liveBoundary = false;

    try {
      const response = await fetch('/api/market/isochrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center: DEMO_CENTER, minutes: duration })
      });
      const data = await response.json();
      if (response.ok && data.geojson?.features?.length) {
        boundary = data.geojson;
        liveBoundary = !data.demo;
      }
    } catch (_) {}

    if (map.getSource('market-area')) {
      map.getSource('market-area').setData(boundary);
    } else {
      map.addSource('market-area', { type: 'geojson', data: boundary });
      map.addLayer({ id: 'market-area-fill', type: 'fill', source: 'market-area', paint: { 'fill-color': '#f2c96d', 'fill-opacity': 0.18 } });
      map.addLayer({ id: 'market-area-line', type: 'line', source: 'market-area', paint: { 'line-color': '#b17b1f', 'line-width': 3 } });
    }

    const ring = boundary.features?.[0]?.geometry?.coordinates?.[0] || [];
    if (ring.length) {
      const bounds = ring.reduce((b, point) => b.extend(point), new maplibregl.LngLatBounds(ring[0], ring[0]));
      map.fitBounds(bounds, { padding: 48, duration: 700 });
    }

    let nextProspects = DEMO_PROSPECTS;
    let livePlaces = false;
    try {
      const response = await fetch('/api/market/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center: DEMO_CENTER, minutes: duration, polygon: ring })
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.places) && data.places.length) {
        nextProspects = data.places;
        livePlaces = !data.demo;
      }
    } catch (_) {}

    setProspects(nextProspects);
    markerRefs.current.forEach(marker => marker.remove());
    markerRefs.current = [];

    nextProspects.forEach(place => {
      if (typeof place.lng !== 'number' || typeof place.lat !== 'number') return;
      const el = document.createElement('button');
      el.className = `mapPin ${String(place.status || 'Available').toLowerCase().replaceAll(' ', '-')}`;
      el.type = 'button';
      el.title = place.name;
      el.setAttribute('aria-label', place.name);
      el.addEventListener('click', () => setSelected(place));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([place.lng, place.lat]).addTo(map);
      markerRefs.current.push(marker);
    });

    const centerEl = document.createElement('div');
    centerEl.className = 'marketCenterMarker';
    centerEl.textContent = 'RW';
    markerRefs.current.push(new maplibregl.Marker({ element: centerEl }).setLngLat(DEMO_CENTER).addTo(map));

    if (liveBoundary && livePlaces) setMode('Live drive-time boundary + live prospect data');
    else if (liveBoundary) setMode('Live drive-time boundary · demo prospect data');
    else setMode('Demo mode · add provider API keys for live market data');
  }

  return (
    <section className="marketExplorerLive">
      <div className="marketToolbar">
        <div>
          <div className="eyebrow">LOCAL MARKET EXPLORER</div>
          <h2>Your approved drive-time market</h2>
          <p>{mode}</p>
        </div>
        <div className="marketControls">
          <div className="segmented" aria-label="Drive-time limit">
            {[15, 20].map(value => <button key={value} className={minutes === value ? 'selected' : ''} onClick={() => setMinutes(value)}>{value} min</button>)}
          </div>
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>{types.map(type => <option key={type}>{type}</option>)}</select>
        </div>
      </div>

      <div className="marketWorkspace">
        <div className="realMap" ref={mapNode} />
        <div className="radarSweep" aria-hidden="true" />
        <div className="marketReadout"><strong>{minutes} min</strong><span>approved driving limit</span></div>
        <div className="mapKey"><span><i className="keyDot prospect"/> Prospect</span><span><i className="keyDot advertiser"/> Advertiser</span><span><i className="keyDot followup"/> Follow-up</span></div>
      </div>

      <div className="marketResultBar">
        <div><strong>{visibleProspects.length}</strong><span>visible local opportunities</span></div>
        <div><strong>{prospects.filter(p => p.status === 'Advertiser').length}</strong><span>current advertisers</span></div>
        <div><strong>{prospects.filter(p => p.status === 'Follow-up').length}</strong><span>follow-ups</span></div>
      </div>

      <div className="marketProspectGrid">
        {visibleProspects.slice(0, 12).map(place => (
          <button key={place.id || `${place.name}-${place.lat}`} className={`marketProspectCard ${selected?.id === place.id ? 'selected' : ''}`} onClick={() => setSelected(place)}>
            <span className="prospectBadge">{(place.type || 'Business').slice(0,1)}</span>
            <span className="prospectCopy"><strong>{place.name}</strong><small>{place.type || 'Local business'}{place.address ? ` · ${place.address}` : ''}</small></span>
            <span className={`status ${String(place.status || 'Available').toLowerCase().replaceAll(' ', '')}`}>{place.status || 'Available'}</span>
          </button>
        ))}
      </div>

      {selected && <div className="selectedProspect">
        <div><div className="eyebrow">SELECTED OPPORTUNITY</div><h3>{selected.name}</h3><p>{selected.address || selected.type || 'Local prospect'}</p></div>
        <div className="selectedActions"><button className="secondary">Add to Prospect CRM</button><button className="primary">Mark Contacted</button></div>
      </div>}
    </section>
  );
}
