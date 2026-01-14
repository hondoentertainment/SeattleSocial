# SeattleSocial 🔥

A social events discovery and booking platform designed for the Seattle metropolitan area, targeting adults 18+ who want to discover, attend, and share experiences.

## Overview

SeattleSocial combines personalized event discovery, rich media notifications, social proof through a proprietary FOMO Index, and a freemium business model with the first event free.

### Key Features

- **FOMO Index**: Real-time social proof algorithm showing event popularity and urgency
- **Rich Media Experience**: High-quality event previews and images
- **Social Integration**: See who's going and coordinate with friends
- **Event Discovery**: Browse and filter events by category, neighborhood, date, and more
- **Seattle-First**: Hyper-local focus optimized for Seattle's unique culture

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SeattleSocial/client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
client/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   └── EventCard.tsx
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   └── EventDetailPage.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── data/             # Mock data and constants
│   │   └── mockEvents.ts
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── package.json
```

## Features Implemented (MVP)

### ✅ Completed
- Event discovery homepage with hero section
- Event browsing and filtering by category
- Event detail pages with full information
- FOMO Index visualization with color-coded badges
- Responsive navigation
- Event cards with social proof (friends going, attendees)
- Mock event data for Seattle-area events

### 🚧 Coming Soon (Based on PRD)
- User authentication and profiles
- Calendar system with RSVP functionality
- Advanced filters (price, neighborhood, date range)
- Social features (friend system, who's going)
- Rich media video notifications
- Premium membership features
- Payment integration
- Backend API and database

## Key Differentiators

1. **FOMO Index**: Proprietary algorithm that calculates event popularity based on:
   - Ticket velocity (35% weight)
   - Social media buzz (25% weight)
   - Attendee diversity (15% weight)
   - Venue & capacity (10% weight)
   - Celebrity/influencer factor (10% weight)
   - Historical performance (5% weight)

2. **First Event Free**: Low-friction user acquisition with immediate value

3. **Hyper-Local Focus**: Built specifically for Seattle's neighborhoods and culture

## Event Categories

- 🎵 Music
- 🍽️ Food & Drink
- 🎨 Arts & Culture
- ⚽ Sports & Fitness
- 🤝 Networking
- 📚 Learning
- 🌙 Nightlife
- 🤲 Community

## Color Scheme

- Primary: Blue tones (#0ea5e9 to #0c4a6e)
- FOMO Badges:
  - Low (0-39): Blue
  - Moderate (40-59): Yellow
  - High (60-79): Orange
  - Extreme (80-100): Red

## Contributing

This is currently a private project. For questions or suggestions, please contact the development team.

## License

Copyright © 2026 SeattleSocial. All rights reserved.
