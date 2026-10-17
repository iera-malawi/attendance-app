// API base URL, injected at build time from the EXPO_PUBLIC_API_URL env var
// (see .env). Expo only inlines variables prefixed with EXPO_PUBLIC_, and only
// when referenced with direct dot notation like below - a bare
// `process.env.API_URL` would be undefined in the built app.
//   - production:  https://clock.iera.org/api  (set in .env)
//   - local dev:   your PC's LAN IP, e.g. http://192.168.x.x:8000/api
//     (phones can't reach "localhost"; run the backend with --host=0.0.0.0)
export const API_URL = process.env.EXPO_PUBLIC_API_URL;
