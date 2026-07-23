# Claude Code Prompt: SoccerHub Development

## Project Overview
Build **SoccerHub**, a US-based sports coordination platform that connects football/soccer players and organizes pickup games, training sessions, tournaments, and competitive leagues across multiple cities in the United States.

---

## Architecture Reference
Use the SoccerHub_IT_Architecture_Documentation.docx as the authoritative guide for all technical decisions. Follow the specifications in Sections 1-12 strictly.

---

## Phase 1: Backend API Foundation (Priority 1)

### Objective
Create a scalable Node.js/Express.js REST API with TypeScript following OpenAPI 3.0 specification.

### Technology Stack
- **Runtime:** Node.js (LTS)
- **Framework:** Express.js
- **Language:** TypeScript (no plain JavaScript)
- **Database:** PostgreSQL (primary), Redis (caching), MongoDB (analytics)
- **Authentication:** JWT with refresh tokens, OAuth 2.0 (Google, Facebook)
- **API Documentation:** OpenAPI 3.0 with Swagger UI
- **Testing:** Jest (unit tests, >80% coverage minimum), Supertest (integration tests)
- **Linting:** ESLint (Airbnb config), Prettier (2-space indentation)

### Microservices to Implement

#### 1. User Management Service (`/services/user-management`)
**Responsibilities:**
- User registration and authentication
- Profile management and social login integration
- User preferences and notification settings
- Rating and review system

**API Endpoints:**
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh-token
- GET /api/v1/auth/me
- PUT /api/v1/users/{id}
- GET /api/v1/users/{id}
- POST /api/v1/auth/oauth (Google/Facebook)
- PUT /api/v1/users/{id}/preferences
- POST /api/v1/reviews
- GET /api/v1/users/{id}/reviews

**Database Schema:**
```sql
Users table: id, email, phone, first_name, last_name, profile_picture, bio, gender, skill_level, preferred_positions, location, rating, created_at, updated_at
Reviews table: id, reviewer_id, reviewee_id, event_id, rating (1-5), comment, created_at
```

#### 2. Event Management Service (`/services/event-management`)
**Responsibilities:**
- CRUD operations for games, tournaments, and leagues
- Event filtering and search (by city, time, skill level, surface type)
- Event participant management
- Event status tracking and lifecycle management

**API Endpoints:**
- GET /api/v1/events (with filtering)
- POST /api/v1/events
- GET /api/v1/events/{id}
- PUT /api/v1/events/{id}
- DELETE /api/v1/events/{id}
- GET /api/v1/events/{id}/participants
- POST /api/v1/events/{id}/participants
- DELETE /api/v1/events/{id}/participants/{userId}

**Database Schema:**
```sql
Events table: id, title, type (game/tournament/league), description, location, start_time, end_time, field_id, host_id, min_participants, max_participants, skill_level, surface_type, price, status, created_at
Participation table: id, user_id, event_id, joined_at, status (confirmed/pending), preferred_position, team_assignment
```

#### 3. Booking & Participation Service (`/services/booking-participation`)
**Responsibilities:**
- Player registration for specific games
- Squad/team formation for events
- Participant list management with capacity limits
- Cancellation and refund handling

**API Endpoints:**
- POST /api/v1/bookings
- GET /api/v1/bookings
- GET /api/v1/bookings/{id}
- DELETE /api/v1/bookings/{id}
- PUT /api/v1/bookings/{id}/cancel
- POST /api/v1/teams
- GET /api/v1/teams/{id}

#### 4. Field Rental & Logistics Service (`/services/field-logistics`)
**Responsibilities:**
- Field inventory management
- Booking and availability scheduling
- Equipment provision tracking (balls, bibs)
- Host assignment and coordination

**API Endpoints:**
- GET /api/v1/fields
- GET /api/v1/fields/{id}
- POST /api/v1/fields
- PUT /api/v1/fields/{id}
- GET /api/v1/fields/{id}/availability
- POST /api/v1/field-bookings

**Database Schema:**
```sql
Fields table: id, name, location, capacity, surface_type, amenities, owner_id, price_per_hour, availability_schedule
```

#### 5. Payment & Billing Service (`/services/payment-billing`)
**Responsibilities:**
- Payment processing and invoicing
- Subscription management for tournaments and leagues
- Host commission and revenue sharing
- Transaction history and reconciliation

**API Endpoints:**
- POST /api/v1/payments
- GET /api/v1/payments/{id}
- GET /api/v1/payments (user history)
- POST /api/v1/subscriptions
- GET /api/v1/billing/invoices

**Database Schema:**
```sql
Payments table: id, user_id, event_id, amount, currency, status, payment_method, transaction_id, created_at
```

#### 6. Community & Chat Service (`/services/community-chat`)
**Responsibilities:**
- Real-time chat for event participants
- Message persistence and retrieval
- Community notifications and announcements
- User blocking and moderation

**API Endpoints (REST + WebSocket):**
- POST /api/v1/messages
- GET /api/v1/messages (by event)
- DELETE /api/v1/messages/{id}
- POST /api/v1/users/{id}/block
- GET /api/v1/notifications

**Technology:** Socket.IO for real-time communication

**Database Schema:**
```sql
Messages table: id, sender_id, event_id, content, created_at, is_deleted
```

### Additional Backend Requirements

**Authentication & Security:**
- Implement JWT-based stateless authentication
- Access tokens: 15-minute expiry
- Refresh tokens: 30-day expiry
- OAuth 2.0 integration (Google, Facebook)
- Two-factor authentication (2FA) via SMS
- HTTPS/TLS 1.3 for all communication
- Password hashing with bcrypt (12 rounds minimum)
- Sensitive data encryption at rest (AES-256)
- Rate limiting: 1000 requests/hour per user
- CORS policy configured for approved domains
- Input validation and sanitization on all endpoints
- SQL injection prevention via prepared statements
- CSRF protection with SameSite cookies
- PCI DSS compliance for payment handling

**Database Setup:**
- PostgreSQL for primary transactional data
- Redis for caching and session management
- MongoDB for analytics
- Connection pooling via PgBouncer (max 500 connections)
- Database read replicas for reporting queries
- Automatic query performance monitoring

**Code Quality:**
- >80% code coverage with Jest
- Integration tests with Supertest
- Automated security scanning (SAST)
- Dependency checks
- Git commits: Conventional Commits format (feat:, fix:, docs:)
- Minimum 2 code reviewers for production code
- Semantic versioning (major.minor.patch)

**Documentation:**
- OpenAPI 3.0 specification with Swagger UI
- Architecture decision records (ADRs) in markdown
- Code comments focusing on "why" not "what"
- README file with setup instructions

---

## Phase 2: Mobile Applications (Priority 2)

### iOS Application (Swift)

**Architecture Pattern:** MVVM with Combine framework
**UI Framework:** SwiftUI for new features, UIKit for legacy support
**Local Data Storage:** Realm for complex queries, UserDefaults for preferences
**Networking:** URLSession with Codable

**Key Features:**
- Player profile creation and management
- Location-based event search with GPS integration
- Event booking and participation
- Real-time chat with Socket.IO
- Push notifications via Firebase Cloud Messaging
- Image uploads with compression
- Offline mode with sync on reconnection
- User ratings and reviews

**Minimum Viable Product (MVP):**
- User authentication (email, social login)
- Event discovery and search
- Event booking
- User profile
- Real-time chat for booked events

### Android Application (Kotlin)

**Architecture Pattern:** MVVM with Jetpack libraries (ViewModel, LiveData)
**UI Framework:** Jetpack Compose for modern UI, Material Design 3
**Local Data Storage:** Room database with Kotlin coroutines
**Networking:** Retrofit with OkHttp

**Key Features:**
- Player profile creation and management
- Location-based event search with GPS integration
- Event booking and participation
- Real-time chat with Socket.IO
- Push notifications via Firebase Cloud Messaging
- Image uploads with compression
- Offline mode with sync on reconnection
- User ratings and reviews

**Minimum Viable Product (MVP):**
- User authentication (email, social login)
- Event discovery and search
- Event booking
- User profile
- Real-time chat for booked events

---

## Phase 3: Admin Dashboard (Priority 3)

**Framework:** React.js with Redux, Material-UI, Next.js

**Key Features:**
- Event management and moderation
- User management and analytics
- Payment and revenue reports
- Field and host verification
- Community moderation tools
- Platform analytics dashboard

---

## Phase 4: DevOps & Infrastructure (Priority 4)

**Cloud Infrastructure:** AWS
- EC2 Auto Scaling Groups for API servers (5-50 instances)
- Application Load Balancer (ALB) with sticky sessions
- RDS PostgreSQL Multi-AZ deployment
- ElastiCache for Redis cluster
- S3 for media storage with CloudFront CDN
- Lambda functions for async tasks

**Containerization & Orchestration:**
- Docker containers with multi-stage builds
- Kubernetes (EKS) for container orchestration
- Helm charts for configuration management
- Istio service mesh for traffic management

**CI/CD Pipeline:**
- GitHub Actions for automated testing
- Jenkins for multi-stage deployments
- Automated security scanning

**Monitoring & Logging:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Prometheus for metrics
- Grafana for visualization
- Datadog for distributed tracing
- Structured logging in JSON format
- PagerDuty for critical alerts

**Performance Targets:**
- API response time: <500ms (p95)
- Database query response: <100ms
- API availability: 99.99% uptime SLA

---

## Implementation Instructions for Claude Code

### Step 1: Create Project Structure
```
soccerhub/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── user-management/
│   │   │   ├── event-management/
│   │   │   ├── booking-participation/
│   │   │   ├── field-logistics/
│   │   │   ├── payment-billing/
│   │   │   └── community-chat/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── app.ts
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── mobile/
│   ├── ios/
│   └── android/
├── admin-dashboard/
└── docs/
```

### Step 2: Set Up TypeScript & Node.js
- Initialize Node.js project with npm/yarn
- Install Express.js, TypeScript, ESLint, Prettier
- Configure TypeScript compiler
- Set up ESLint with Airbnb configuration
- Set up Prettier with 2-space indentation

### Step 3: Implement Core Services
- Start with User Management Service
- Follow with Event Management Service
- Implement remaining services in order of priority

### Step 4: Add Authentication & Security
- Implement JWT authentication with refresh tokens
- Add OAuth 2.0 integration
- Implement 2FA
- Add rate limiting middleware
- Add input validation and sanitization

### Step 5: Database Setup
- Create PostgreSQL schemas for each service
- Set up Redis caching
- Configure MongoDB for analytics
- Implement connection pooling

### Step 6: Testing & Documentation
- Write unit tests (>80% coverage)
- Write integration tests
- Generate OpenAPI documentation
- Create architecture decision records

### Step 7: API Documentation
- Set up Swagger UI
- Document all endpoints
- Create API usage examples

---

## Code Standards & Best Practices

**TypeScript:**
- Strict mode enabled
- No `any` types unless absolutely necessary
- Interfaces for all data structures
- Proper error handling with custom error classes

**Git Commits:**
- Format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Example: `feat: add event creation endpoint`

**Error Handling:**
- Consistent error response format
- Meaningful error messages
- Proper HTTP status codes
- Logging of all errors

**Testing:**
- Unit tests for all business logic
- Integration tests for API endpoints
- Test coverage >80%
- Mocking external dependencies

---

## Success Criteria

✅ All 6 microservices implemented with >80% test coverage
✅ Authentication and security measures in place
✅ OpenAPI 3.0 documentation with Swagger UI
✅ Database schemas and migrations working
✅ Real-time chat with Socket.IO functional
✅ Performance targets met (<500ms API response)
✅ Code follows TypeScript/ESLint standards
✅ Ready for containerization and deployment

---

## Next Steps After Phase 1 Completion

1. Deploy backend to staging environment
2. Begin Phase 2 (iOS/Android development)
3. Set up CI/CD pipeline
4. Performance testing and optimization
5. Security audit and penetration testing
6. Go-live preparation

---

## Questions/Clarifications for Claude Code

- Where would you like to start first? (Recommend: User Management Service)
- Should we set up Docker right away or focus on local development first?
- Do you want mock payment processing for MVP or real Stripe integration?
- Should we implement all 6 microservices or start with a monolithic backend and refactor later?
- What's the MVP scope - just Phase 1 backend, or include basic mobile apps?

---

## Resources & References

- Architecture Documentation: SoccerHub_IT_Architecture_Documentation.docx (Sections 1-12)
- OpenAPI 3.0: https://spec.openapis.org/oas/v3.0.3
- Express.js: https://expressjs.com/
- TypeScript: https://www.typescriptlang.org/
- Jest: https://jestjs.io/
- PostgreSQL: https://www.postgresql.org/
- Redis: https://redis.io/
- Socket.IO: https://socket.io/

---

**Ready to build SoccerHub?** Start with Phase 1 and follow the implementation instructions above.
