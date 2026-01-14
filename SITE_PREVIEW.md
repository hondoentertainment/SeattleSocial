# SeattleSocial Site Preview

## Access URLs

Try accessing the site at one of these URLs:

1. **Vite Dev Server** (Hot reload enabled):
   - http://localhost:5173/
   - http://21.0.0.26:5173/

2. **Static Production Server** (Python HTTP):
   - http://localhost:8080/
   - http://0.0.0.0:8080/

## Site Structure & Features

### 🏠 Homepage (`/`)

**Hero Section:**
- Large gradient banner (blue to dark blue)
- Main headline: "Never Miss Out on Seattle's Best Experiences"
- Subheadline: "Your first event is on us. 🎉"
- Search bar with rounded design
- Three stat counters: "50K+ Active Users", "1000+ Events Monthly", "25+ Neighborhoods"
- Two CTA buttons: "Get Started Free" and "Learn More"

**Hottest Events Section:**
- Title with flame icon: "Hottest Events Right Now"
- Grid of 3 event cards showing events with FOMO score ≥80:
  1. **Pike Place Food Tour** - FOMO: 92 🔥🔥🔥 (RED badge)
  2. **Indie Night at Neumos** - FOMO: 87 🔥🔥🔥 (RED badge)
  3. **Tech Startup Networking** - FOMO: 82 🔥🔥🔥 (RED badge)

**Discover Events Section:**
- Category filter pills (All Events, Music, Food & Drink, Arts & Culture, Sports, Networking, Nightlife)
- Grid layout showing all 10 mock events with cards

**Why SeattleSocial Section:**
- Three feature highlights:
  1. 🔥 FOMO Index
  2. 🎥 Rich Media
  3. 🤝 Social First

**Footer:**
- Four columns: SeattleSocial info, Product, Company, Legal
- Copyright notice

### 📋 Event Card Design

Each event card shows:
- **Hero Image** (from Unsplash)
- **FOMO Badge** (top-right): Color-coded with score
  - 🔥🔥🔥 for 80+
  - 🔥🔥 for 60-79
  - 🔥 for 40-59
- **Category Badge** (bottom-left): Event type
- **Title**: Bold, 2-line max
- **FOMO Alert**: "Selling out fast! - 96% sold"
- **Description**: 2-line preview
- **Details**:
  - 📅 Date & time
  - 📍 Venue & neighborhood
  - 👥 Attendees (with friends going count)
- **Price**: Large, bold (FREE or $XX)
- **CTA Button**: "View Details"

### 📄 Event Detail Page (`/events/:id`)

**Hero Section:**
- Full-width event image (400px height)
- Dark gradient overlay
- Category and FOMO badges overlaid
- Large event title

**FOMO Alert Banner:**
- Colored background (matches FOMO level)
- Urgency message
- Stats: "87% sold out • Only 58 spots remaining • 342 people going"

**Event Information:**
- Detailed description
- Tags (indie, live-music, 21+, etc.)
- Organizer profile with verified badge
- Social proof: "5 of your friends are going!"

**Booking Sidebar:**
- Price display (with "First event FREE" badge)
- Event details:
  - 📅 Full date and time
  - 📍 Complete address
  - 👥 Attendee count
- Three action buttons:
  1. "Reserve Your Spot" (primary)
  2. "Save for Later"
  3. "Share Event"
- Premium upsell card

### 🎨 Design System

**Colors:**
- Primary Blue: #0ea5e9 to #0c4a6e (gradient)
- FOMO Badges:
  - Low (0-39): Blue (#3b82f6)
  - Moderate (40-59): Yellow (#eab308)
  - High (60-79): Orange (#f97316)
  - Extreme (80-100): Red (#ef4444)

**Typography:**
- Font: Inter (system fallback)
- Headlines: Bold, large
- Body: Regular, readable

**Components:**
- Rounded corners (8-12px)
- Shadow on hover
- Smooth transitions
- Responsive grid (1-3 columns)

### 📱 Responsive Features

**Desktop (lg+):**
- 3-column event grid
- Full navigation with all links
- Sticky header

**Tablet (md):**
- 2-column event grid
- Compact navigation

**Mobile (sm):**
- 1-column event grid
- Hamburger menu
- Touch-friendly buttons

### 🔗 Navigation

**Header Links:**
- 🔥 SeattleSocial (logo/home)
- 🔍 Discover
- 📅 My Events
- 🔔 Notifications (with badge: 3)
- 👤 Profile
- Button: "Upgrade to Premium"

**Current Pages:**
- ✅ Homepage (/)
- ✅ Event Details (/events/:id)
- 🚧 My Events Calendar (Coming Soon)
- 🚧 Notifications (Coming Soon)
- 🚧 Profile (Coming Soon)

### 📊 Sample Events

1. **Indie Night at Neumos** - Music, $25, Capitol Hill, FOMO: 87
2. **Pike Place Food Tour** - Food & Drink, $75, Downtown, FOMO: 92
3. **Fremont Art Walk** - Arts & Culture, FREE, Fremont, FOMO: 68
4. **Sounders Watch Party** - Sports, FREE, SODO, FOMO: 74
5. **Tech Networking Mixer** - Networking, $15, Ballard, FOMO: 82
6. **Sunset Yoga at Kerry Park** - Sports & Fitness, $20, Queen Anne, FOMO: 71
7. **Trivia Night** - Nightlife, FREE, Fremont, FOMO: 58
8. **Mixology Workshop** - Learning, $85, Capitol Hill, FOMO: 65
9. **Electronic Music Showcase** - Nightlife, $30, Georgetown, FOMO: 79
10. **Garden Volunteer Day** - Community, FREE, Ballard, FOMO: 42

## Technical Details

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Images**: Unsplash placeholder images

## Testing the Site

1. **Homepage**: Browse events, click category filters
2. **Click any event card**: View full event details
3. **Resize browser**: Test responsive design
4. **Click navigation**: See "Coming Soon" placeholders
5. **Hover effects**: Cards scale up, buttons change color

## Next Steps for Deployment

To deploy this site:
1. Use the `dist/` folder contents
2. Deploy to: Vercel, Netlify, GitHub Pages, AWS S3, etc.
3. All routes handled by React Router (SPA)
4. No backend required (uses mock data)

---

**Note**: If you still can't access the URLs above, you may need to:
- Check firewall/network settings
- Use port forwarding
- Access from the local machine directly
- Deploy to a cloud hosting service
