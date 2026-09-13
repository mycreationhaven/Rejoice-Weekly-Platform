# Rejoice Weekly Platform

Independent Publisher operating system for Rejoice Weekly™.

## Current prototype

This branch introduces a first-pass Independent Publisher Dashboard with:

- Publisher overview metrics
- 23-position advertising inventory tracking
- Local Market Explorer with a radar-style 20-minute market visualization
- Local business / church / nonprofit prospect examples
- Prospect CRM entry points
- Advertising category availability board
- Distribution progress tracking
- Weekly edition readiness workflow
- Revenue and task navigation placeholders
- Mobile-responsive layout

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important implementation note

The current Local Market Explorer is a UI prototype. The drive-time boundary and prospect pins are mocked so the workflow can be reviewed before choosing production map / routing / places-data providers. The production version should calculate true road-network isochrones from an approved market center and load businesses, churches, nonprofits, schools, community organizations, and distribution opportunities from compliant data providers.

The market center should be an approved business/geographic point rather than exposing an Independent Publisher's private home address.
