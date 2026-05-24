npm install
npm run dev<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# CluckTrack - Farm Management Software

## Project Overview
CluckTrack is a lightweight, mobile-first React + Vite web app for small chicken farmers. The Year 1 prototype includes authentication, dashboard, daily logging, flock management, and vaccination tracking.

## Technology Stack
- **Frontend**: React 18 (JavaScript, no TypeScript)
- **Build Tool**: Vite 4
- **Styling**: Tailwind CSS 3
- **Storage**: localStorage (offline-first, no backend)
- **Colors**: Warm orange (#E8956D) and brown (#8B6F47) farm theme

## Project Structure
```
src/
├── pages/
│   ├── LoginPage.jsx (Phone + OTP demo auth)
│   ├── Dashboard.jsx (Farm metrics & overview)
│   ├── DailyLogForm.jsx (Entry tracking)
│   ├── FlockManager.jsx (Manage multiple flocks)
│   └── VaccinationReminders.jsx (Health tracking)
├── App.jsx (Main routing & bottom nav)
├── main.jsx (Entry point)
└── index.css (Global styles + Tailwind)
```

## Getting Started
1. `npm install`
2. `npm run dev`
3. Open http://localhost:5173
4. Login with any 10-digit number, OTP: 123456

## Design Guidelines
- Mobile-first, responsive design (Tailwind utilities)
- Warm farm color theme (orange/brown)
- Clean, simple UI for farmers with minimal tech experience
- Emoji icons in navigation for intuitive interaction
- 5-screen navigation at bottom (mobile-style)

## Development Rules
- Use React hooks (useState, useEffect) for state management
- Store all data in localStorage with `clucktrack_` prefix keys
- Each page component handles its own data persistence
- Keep components simple and focused
- Use Tailwind classes for all styling (no CSS files except index.css)
- Format dates using `toLocaleDateString('en-IN')`
- Include validation for all form inputs

## Key Features Completed
- ✅ Login/authentication (demo mode)
- ✅ Dashboard with dummy metrics
- ✅ Daily log with localStorage persistence
- ✅ Flock manager with add/delete
- ✅ Vaccination reminders with overdue alerts
- ✅ Bottom navigation with emoji icons
- ✅ Responsive mobile design
- ✅ Tailwind CSS fully configured

## Next Steps / Future Features
- Data export (CSV/PDF)
- Cloud sync
- Multi-user support
- Analytics & profitability tracking
- PWA capabilities
- Mobile app (React Native)

## Notes for Future Development
- All components are self-contained with local state
- No external API integrations yet
- Demo data is provided for flocks and vaccinations on first load
- OTP is hardcoded as "123456" for prototype
- All dates use strict ISO format (YYYY-MM-DD)
