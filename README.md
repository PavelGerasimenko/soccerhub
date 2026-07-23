# SoccerHub Backend API

A comprehensive Node.js/Express.js backend for SoccerHub, a global sports coordination platform connecting soccer players and organizing pickup games, training sessions, and leagues.

## Project Status

**Phase 1: User Management Service** ✅
- User registration and authentication
- JWT-based token management
- User profile management
- Password hashing and security
- Comprehensive test coverage

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Caching**: Redis (future)
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint, Prettier
- **Deployment**: Docker, Kubernetes

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14.x
- Docker (optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SoccerHub
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env` file

5. Initialize database schema:
```bash
npm run db:init
```

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.ts     # Database connection
│   └── environment.ts  # Environment variables
├── database/           # Database schemas and migrations
│   └── schema.sql      # PostgreSQL schema
├── middleware/         # Express middleware
│   ├── auth.ts        # Authentication middleware
│   ├── errorHandler.ts # Error handling
│   └── validation.ts  # Request validation
├── modules/           # Feature modules
│   └── users/        # User management service
│       ├── user.repository.ts
│       ├── user.service.ts
│       ├── user.routes.ts
│       ├── user.service.test.ts
│       └── user.routes.test.ts
├── types/            # TypeScript interfaces
│   └── user.interface.ts
├── utils/            # Utility functions
│   ├── jwt.ts
│   ├── password.ts
│   ├── id.ts
│   ├── errors.ts
│   └── *.test.ts
├── app.ts           # Express app setup
└── index.ts         # Entry point
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "gender": "male",
  "skill_level": "intermediate"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2026-07-23T10:00:00Z",
      "updated_at": "2026-07-23T10:00:00Z"
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  }
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### User Management

#### Get User Profile
```http
GET /api/v1/users/{id}
Authorization: Bearer {accessToken}
```

#### Update User Profile
```http
PUT /api/v1/users/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "bio": "Soccer enthusiast",
  "skill_level": "advanced"
}
```

#### Delete User Account
```http
DELETE /api/v1/users/{id}
Authorization: Bearer {accessToken}
```

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "statusCode": 400,
    "errors": {
      "field_name": "Field-specific error message"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Input validation failed
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists
- `INTERNAL_ERROR` (500) - Server error

## Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Service, repository, and utility functions
- **Integration Tests**: API routes and middleware
- **Coverage Target**: 80% minimum

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.service.test.ts

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 
  - Access tokens: 15-minute expiry
  - Refresh tokens: 30-day expiry
- **HTTPS/TLS**: Enforced in production
- **CORS**: Configured for authorized domains
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Implemented per endpoint
- **Helmet**: Security headers enabled

## Database

### Schema

The database uses PostgreSQL with the following key tables:

- `users.users` - User profiles
- `users.user_preferences` - User notification/privacy settings
- `users.refresh_tokens` - JWT refresh token management
- `users.reviews` - User ratings and reviews

### Connection Management

- Connection pooling via PgBouncer
- Max 20 concurrent connections (configurable)
- Automatic reconnection on failure

## Deployment

### Docker

```bash
# Build Docker image
docker build -t soccerhub-backend .

# Run container
docker run -p 3000:3000 --env-file .env soccerhub-backend
```

### Environment Variables

See `.env.example` for all available configuration options.

## Development Guidelines

### Code Standards

- **Language**: TypeScript (no plain JavaScript)
- **Linting**: ESLint with Airbnb configuration
- **Formatting**: Prettier with 2-space indentation
- **Imports**: Organized and sorted

### Git Conventions

- **Commits**: Conventional Commits format
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation
  - `test:` Tests
  - `refactor:` Code refactoring

Example:
```bash
git commit -m "feat: add user authentication service"
```

### Code Review

- Minimum 2 reviewers required
- All CI/CD checks must pass
- Test coverage maintained at 80%+

## Performance Targets

- API response time: <500ms (p95)
- Database query time: <100ms
- Application startup: <2 seconds
- Availability: 99.99% uptime

## Monitoring & Logging

- Structured JSON logging
- Log aggregation ready (ELK Stack)
- Correlation IDs for request tracing
- Error tracking integration ready

## Next Phases

- **Phase 2**: Event Management Service
- **Phase 3**: Booking & Participation Service
- **Phase 4**: Field Rental & Logistics
- **Phase 5**: Community & Chat Service
- **Phase 6**: Payment & Billing Service

## Contributing

1. Create a feature branch from `main`
2. Make your changes following code standards
3. Write or update tests
4. Ensure all tests pass and coverage maintained
5. Commit using conventional commits format
6. Create a pull request with detailed description

## License

MIT

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2026-07-23  
**Maintained By**: SoccerHub Development Team
