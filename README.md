# 🔥 SeattleSocial

A social events discovery platform for Seattle - helping people find and attend the best events in the city.

## 🚀 Quick Start (3 Steps)

### 1️⃣ Download/Clone this repository

### 2️⃣ Run the start script:

**Mac/Linux:**
```bash
./START.sh
```

**Windows:**
```
START.bat
```

### 3️⃣ Open your browser:
```
http://localhost:8000
```

That's it! 🎉

---

## 📚 Documentation

- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** - Full deployment guide with multiple options
- **[SITE_PREVIEW.md](./SITE_PREVIEW.md)** - Visual guide showing all features
- **[client/README.md](./client/README.md)** - Technical documentation

## ✨ What's Included

- ✅ Fully functional React website
- ✅ 10 sample Seattle events
- ✅ FOMO Index scoring system
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Event browsing and filtering
- ✅ Event detail pages
- ✅ Production-ready build in `client/dist/`

## 🎯 Key Features

### FOMO Index
Real-time scoring shows event popularity with color-coded badges:
- 🔥🔥🔥 Red (80-100): "Selling out fast!"
- 🔥🔥 Orange (60-79): "High demand"
- 🔥 Yellow (40-59): "Popular event"

### Event Categories
- 🎵 Music
- 🍽️ Food & Drink
- 🎨 Arts & Culture
- ⚽ Sports & Fitness
- 🤝 Networking
- 🌙 Nightlife
- 🤲 Community

### Sample Events
Browse real mock events like:
- Indie Night at Neumos (Capitol Hill)
- Pike Place Food Tour (Downtown)
- Tech Startup Networking Mixer (Ballard)
- Sunset Yoga at Kerry Park (Queen Anne)
- And 6 more!

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Routing**: React Router v6
- **Icons**: Lucide React

## 📱 Screenshots

Open the site to see:
- Beautiful hero section with search
- Event cards with FOMO indicators
- Detailed event pages
- Responsive mobile design

## 🎨 Customization

All source code is in `client/src/`:
- `data/mockEvents.ts` - Edit events
- `components/` - Modify UI components
- `pages/` - Update page layouts
- `tailwind.config.js` - Change colors/theme

## 🌐 Deploy to Cloud (Optional)

Deploy for free to:
- **Vercel**: `cd client && npx vercel --prod`
- **Netlify**: `cd client && npx netlify-cli deploy --dir=dist --prod`
- **GitHub Pages**: Enable in repository settings
- **Cloudflare Pages**: Drag/drop `client/dist` folder

## 📖 Based on PRD

This implementation follows the comprehensive Product Requirements Document:
- See `social-events-platform-prd (1).md` for full product vision
- MVP features implemented
- Ready for backend integration

## 🔧 Development Mode

For live editing with hot reload:

```bash
cd client
npm install
npm run dev
```

Open: http://localhost:5173

## 📝 Next Steps

To continue development:
1. ✅ Frontend MVP (Complete!)
2. ⏭️ Add backend API
3. ⏭️ Implement user authentication
4. ⏭️ Connect to database
5. ⏭️ Add payment processing
6. ⏭️ Implement real FOMO calculations
7. ⏭️ Add social features (friend system)
8. ⏭️ Deploy to production

## 🤝 Support

- Check documentation files for detailed guides
- All code is commented and well-organized
- Follows React/TypeScript best practices

---

**Built for Seattle's social scene** 🌆
**Your first event is always free** 🎁

© 2026 SeattleSocial. All rights reserved.
