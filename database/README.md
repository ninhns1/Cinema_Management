# Database

Primary database: MongoDB

Collections recommendation:

- movies
- showtimes
- seats
- seat_holds
- bookings
- payments
- users

Use TTL index for temporary seat holds via expiresAt field.
