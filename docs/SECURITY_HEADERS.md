Front (Vercel):
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

Backend (Nginx): same headers + static cache immutable for assets.
