# Frontend

Component-first organization:

- pages/customer: customer pages (home, movie detail, checkout)
- pages/admin: admin pages (dashboard, showtime management)
- components/seat-map: realtime seat map module
- components/checkout: hold timer, payment steps
- services: API clients grouped by business domain

Rule: features related to one business problem stay in one module/component folder instead of one giant file.
