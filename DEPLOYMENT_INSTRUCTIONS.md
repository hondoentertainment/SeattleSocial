# SeattleSocial - Local Deployment Instructions

## Quick Start

This package contains a fully functional SeattleSocial website that you can run on your local machine.

### Option 1: Run Production Build (Recommended - Fastest)

The `client/dist/` folder contains the production-ready build.

**Using Python (any OS with Python 3):**
```bash
cd client/dist
python3 -m http.server 8000
```
Then open: http://localhost:8000

**Using Node.js:**
```bash
cd client/dist
npx serve
```
Then open the URL shown (usually http://localhost:3000)

**Using VS Code:**
- Install "Live Server" extension
- Right-click on `client/dist/index.html`
- Select "Open with Live Server"

### Option 2: Run Development Server (Hot Reload)

If you want to make changes and see them live:

```bash
cd client
npm install
npm run dev
```
Then open: http://localhost:5173

## What's Included

### Files Structure:
```
SeattleSocial/
├── client/
│   ├── dist/              ← Production build (ready to serve)
│   ├── src/               ← Source code
│   │   ├── components/    ← React components
│   │   ├── pages/         ← Page components
│   │   ├── data/          ← Mock event data
│   │   └── types/         ← TypeScript types
│   └── package.json       ← Dependencies
├── social-events-platform-prd (1).md  ← Original PRD
└── SITE_PREVIEW.md        ← Visual guide

```

### Features Working:
- ✅ Homepage with hero section
- ✅ Event discovery and filtering by category
- ✅ Event detail pages
- ✅ FOMO Index visualization
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ 10 sample Seattle events
- ✅ Navigation system

### Tech Stack:
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS v3
- React Router v6
- Lucide React icons

## Deployment Options

### Deploy to Cloud (Free Options):

**Vercel (Recommended):**
```bash
cd client
npx vercel --prod
```

**Netlify:**
```bash
cd client
npx netlify-cli deploy --dir=dist --prod
```

**GitHub Pages:**
```bash
# Push to GitHub, then enable GitHub Pages in Settings
# Set source to deploy from /dist folder
```

**Cloudflare Pages:**
- Drag and drop the `client/dist` folder to Cloudflare Pages dashboard

## Making Changes

1. Edit files in `client/src/`
2. Run `npm run dev` to see changes live
3. Run `npm run build` to create new production build
4. Files are generated in `client/dist/`

## Key Files to Customize:

- `src/data/mockEvents.ts` - Add/edit events
- `src/components/Hero.tsx` - Modify hero section
- `src/components/EventCard.tsx` - Change event card design
- `src/pages/HomePage.tsx` - Update homepage layout
- `tailwind.config.js` - Customize colors and theme

## Troubleshooting

**Issue**: Blank page or errors
- Check browser console (F12)
- Make sure you're serving from `dist/` folder
- Try rebuilding: `npm run build`

**Issue**: Images not loading
- Images use Unsplash URLs (requires internet)
- Replace with local images if needed

**Issue**: Port already in use
- Change port: `python3 -m http.server 9000`
- Or use different port number

## Next Steps

To continue development:
1. Review the PRD: `social-events-platform-prd (1).md`
2. Check SITE_PREVIEW.md for feature details
3. Add backend API (Node.js, Python, etc.)
4. Implement user authentication
5. Connect to real database
6. Add payment processing (Stripe)

## Support

- Check `client/README.md` for detailed documentation
- Review component code for examples
- All components are well-commented

---

Built with ❤️ for Seattle's social scene
