'use client';

import { useMemo, useState } from 'react';

const prospects = [
  { name: 'Houston Family Dental', type: 'Dentist', minutes: 8, status: 'Available', x: 68, y: 31 },
  { name: 'Faith Community Church', type: 'Church', minutes: 11, status: 'Directory', x: 38, y: 28 },
  { name: 'Smith Heating & Air', type: 'HVAC', minutes: 14, status: 'Follow-up', x: 73, y: 63 },
  { name: 'Helping Hands Outreach', type: 'Nonprofit', minutes: 16, status: 'Available', x: 28, y: 64 },
  { name: 'Main Street Cafe', type: 'Restaurant', minutes: 6, status: 'Advertiser', x: 51, y: 47 },
  { name: 'Northside Auto Care', type: 'Automotive', minutes: 19, status: 'Available', x: 22, y: 41 }
];

const categories = [
  ['Plumbing', 'Filled'], ['HVAC', 'Available'], ['Dentist', 'Available'], ['Restaurant', 'Filled'],
  ['Auto Repair', 'Available'], ['Insurance', 'Filled'], ['Realtor', 'Available'], ['Church', 'Community'],
  ['Landscaping', 'Available'], ['Banking', 'Available'], ['Salon', 'Available'], ['Attorney', 'Available']
];

const nav = ['Overview', 'Market Explorer', 'Prospects', 'Advertisers', 'Categories', 'Distribution', 'Weekly Edition', 'Revenue', 'Tasks', 'Academy'];

function Stat({ label, value, hint }) {
  return <div className="stat"><div className="statLabel">{label}</div><div className="statValue">{value}</div><div className="statHint">{hint}</div></div>;
}

export default function Page() {
  const [active, setActive] = useState('Overview');
  const [filter, setFilter] = useState('All');
  const filtered = useMemo(() => filter === 'All' ? prospects : prospects.filter(p => p.type === filter), [filter]);
  const types = ['All', ...new Set(prospects.map(p => p.type))];

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brandMark">RW</div>
        <div className="brandText"><strong>Rejoice Weekly</strong><span>Independent Publisher</span></div>
        <div className="editionCard"><span>Authorized Edition</span><strong>Houston Area Edition</strong><small>20-minute Local Market</small></div>
        <nav>{nav.map(item => <button key={item} className={active === item ? 'active' : ''} onClick={() => setActive(item)}>{item}</button>)}</nav>
        <div className="sidebarBottom"><div className="goodDot"/> Active & in good standing</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><div className="eyebrow">REJOICE WEEKLY LOCAL MARKET SYSTEM</div><h1>{active === 'Overview' ? 'Publisher Dashboard' : active}</h1><p>Houston Area Edition · Your protected local publishing market</p></div>
          <div className="profile">JS</div>
        </header>

        <div className="statsGrid">
          <Stat label="AD POSITIONS" value="14 / 23" hint="9 available this week" />
          <Stat label="WEEKLY BOOKED" value="$490" hint="$35 standard local ad" />
          <Stat label="PLANNED COPIES" value="1,000" hint="reader-first circulation target" />
          <Stat label="LOCAL OPPORTUNITIES" value="327" hint="inside your drive-time market" />
          <Stat label="FOLLOW-UPS DUE" value="7" hint="3 are high priority" />
        </div>

        <div className="mainGrid">
          <section className="panel mapPanel">
            <div className="panelHeader">
              <div><div className="eyebrow">LOCAL MARKET EXPLORER</div><h2>Your 20-minute market</h2><p>Designed around how customers actually drive, shop, worship and do business locally.</p></div>
              <select value={filter} onChange={e => setFilter(e.target.value)}>{types.map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="mapStage">
              <div className="road road1"/><div className="road road2"/><div className="road road3"/><div className="road road4"/>
              <div className="driveArea"/>
              <div className="pulse pulse1"/><div className="pulse pulse2"/><div className="pulse pulse3"/>
              <div className="marketCenter"><span>RW</span></div>
              {filtered.map((p, i) => <button key={p.name} className={`pin pin${i % 4}`} style={{left: `${p.x}%`, top: `${p.y}%`}} title={`${p.name} · ${p.minutes} min`}><span/></button>)}
              <div className="mapLegend"><span><i className="legend available"/> Prospect</span><span><i className="legend advertiser"/> Advertiser</span><span><i className="legend community"/> Community</span></div>
              <div className="marketBadge"><strong>20 min</strong><span>Approved drive-time market</span></div>
            </div>
          </section>

          <section className="panel opportunityPanel">
            <div className="panelHeader compact"><div><div className="eyebrow">TODAY'S OPPORTUNITIES</div><h2>Who should I contact?</h2></div><button className="textButton">View all</button></div>
            <div className="prospectList">
              {prospects.slice(0,5).map(p => <div className="prospect" key={p.name}><div className="prospectIcon">{p.type[0]}</div><div className="prospectMain"><strong>{p.name}</strong><span>{p.type} · {p.minutes} min away</span></div><span className={`status ${p.status.toLowerCase().replace(' ', '')}`}>{p.status}</span></div>)}
            </div>
            <button className="primary">Open Prospect CRM</button>
          </section>
        </div>

        <div className="lowerGrid">
          <section className="panel">
            <div className="panelHeader compact"><div><div className="eyebrow">CATEGORY BOARD</div><h2>Fill the open spots</h2></div><span className="pill">14 filled · 9 open</span></div>
            <div className="categoryGrid">{categories.map(([name,status]) => <button key={name} className={`category ${status.toLowerCase()}`}><strong>{name}</strong><span>{status}</span></button>)}</div>
          </section>

          <section className="panel editionPanel">
            <div className="eyebrow">THIS WEEK'S EDITION</div><h2>September 18 Edition</h2>
            <div className="progressRow"><span>Advertising</span><strong>14 / 23</strong></div><div className="progress"><i style={{width:'61%'}}/></div>
            <div className="progressRow"><span>Reader features</span><strong>10 / 10</strong></div><div className="progress green"><i style={{width:'100%'}}/></div>
            <div className="checklist"><span>✓ 10 content features ready</span><span>✓ 14 advertiser files received</span><span>• 2 proofs awaiting approval</span><span>• 125 copies need distribution placement</span></div>
            <button className="primary wide">Prepare This Week's Edition</button>
          </section>
        </div>

        <div className="lowerGrid second">
          <section className="panel distributionPanel"><div className="eyebrow">DISTRIBUTION</div><h2>875 / 1,000 copies assigned</h2><div className="bigProgress"><i style={{width:'87.5%'}}/></div><p>18 active pickup locations. Find space for 125 more copies before print day.</p><button className="secondary">Find Distribution Partners</button></section>
          <section className="panel taskPanel"><div className="eyebrow">TODAY</div><h2>Your next actions</h2><label><input type="checkbox"/> Call Smith Heating & Air</label><label><input type="checkbox"/> Approve Main Street Cafe proof</label><label><input type="checkbox"/> Follow up with Houston Family Dental</label><label><input type="checkbox"/> Add 2 new distribution locations</label></section>
        </div>
      </section>
    </main>
  );
}
