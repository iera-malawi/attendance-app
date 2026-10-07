// Phones can't use "localhost": on the device it means the phone itself, not your PC.
// Use your PC's LAN IP (run `ipconfig` and look for the IPv4 address). Start the backend with
// `php artisan serve --host=0.0.0.0 --port=8000` and keep the phone on the same Wi-Fi.
export const API_URL = 'http://192.168.1.217:8000/api';
