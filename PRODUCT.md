# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are women, solo travelers, and students commuting daily who need proactive route safety, situational awareness, and real-time guardian tracking. Secondary users include trusted contacts (family, friends) receiving automated journey updates and SOS notifications.

## Product Purpose

Saheli AI ("Your Predictive Safety Companion") provides proactive personal safety intelligence, safe route planning, real-time journey monitoring (digital twin), and rapid emergency escalation. Success means users feel empowered and secure during commutes, avoid high-risk zones, and have immediate emergency response if anomalies or dangers occur.

## Positioning

Unlike traditional navigation apps that optimize strictly for speed/distance or reactive panic-button apps that only trigger after an incident, Saheli AI delivers predictive safety scoring (lighting, safe havens, crowd density, historical context), continuous journey anomaly tracking, an empathetic AI companion, and automated SOS escalations.

## Operating Context

- **Environment:** Mobile web on smartphones while commuting on foot, public transit, rideshares, or campus walkways; also accessible via desktop/tablet for pre-trip planning and contact monitoring.
- **High-Stress Scenarios:** Night travel, isolated roads, unexpected route deviations, or feeling followed. Requires single-hand usability, low cognitive load, and instant access to critical protective tools.

## Capabilities and Constraints

- **Safe Route Planning:** Multi-factor safety scoring, comparative route analysis, and safe-haven discovery (police booths, 24/7 pharmacies, well-lit hubs).
- **Active Journey Tracking:** Real-time digital twin monitoring, route deviation detection, and automated check-ins.
- **AI Safety Companion:** Conversational safety advisor, simulated incoming call distraction, and real-time reassurance.
- **Emergency Hub & SOS:** One-tap alert dispatch to trusted circle, GPS location broadcasting, quick emergency service dialers, and audio siren/strobe.
- **Safety Knowledge Base:** Practical safety guides, legal rights, and verified helpline directories.
- **Technical Stack:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet maps, Supabase.

## Brand Commitments

- **Name:** Saheli AI (Empathetic safety companion).
- **Tone of Voice:** Reassuring, calm, authoritative in crisis, vigilant without inducing panic or fear.
- **Visual Identity:** Deep slate/indigo foundations with clear color semantic signaling (emerald for verified safe, amber for advisory, rose/crimson for critical emergency).

## Evidence on Hand

- Fully structured React 19 application with Dashboard, Journey Tracker, Companion Chat, Emergency SOS, Learn Center, and Settings.
- Realistic mock data for routing, safety scoring, demo journeys, emergency contacts, and community safety guidelines in `src/data/`.

## Product Principles

1. **Proactive over Reactive:** Anticipate and steer clear of risks before they escalate rather than relying solely on post-incident alerts.
2. **Instant Clarity Under Stress:** Essential actions (SOS, safe havens, live check-ins) must be reachable in a single tap with zero friction.
3. **Empathetic Guardian:** Provide constant reassurance and safety advice without fear-mongering or alarmism.
4. **Reliability & Privacy:** User location and alert triggers must be dependable, transparent, and user-controlled.

## Accessibility & Inclusion

- Optimized for high-contrast visibility in daylight and nighttime settings.
- Generous tap targets (min 44x44px) suited for rapid, one-handed mobile interaction.
- Clear ARIA semantics and high-visibility status indicators for critical states.
