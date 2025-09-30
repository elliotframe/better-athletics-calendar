# Better Athletics Calendar

A straightforward calendar of all upcoming events listed on the Scottish Athletics and British Milers Club websites, automatically updating daily.

## Background

I find the events calendar on the Scottish Athletics website exceedingly frustrating to use for finding competitions, so I've made this website to prevent this from ever being necessary.

All upcoming events on the Scottish Athletics and British Milers Club websites are listed, easily filterable by date or type of event, to quickly find what you're looking for.

BMC events are linked to directly, while SA events have their details saved and viewable within this website, for obvious reasons.



## Technologies Used

- **Frontend:** Next.js, React, Tailwind CSS  
- **Backend / Database:** Firebase Firestore  
- **Hosting / Deployment:** Vercel  

## Setup Instructions

1. **Clone the repository:**  
```bash
git clone https://github.com/elliotframe/better-athletics-calendar.git
cd better-athletics-calendar
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variables**

Create a .env.local file in the root directory with the following keys:
```ini
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=your-firebase-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key
```
4. **Run the development server:**
```bash
npm run dev
```




## Deployment Notes

The app is hosted on Vercel, so ensure environment variables are set in the Vercel dashboard

## License

[MIT](https://choosealicense.com/licenses/mit/)