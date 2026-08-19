# Backend

Microservices organized by business capability:

- seat-management (central seat truth)
- pos-sales (sales entry points)
- booking-order
- payment
- notification

Each service keeps code by module (controller/service/repository/model) to avoid a single oversized file.
