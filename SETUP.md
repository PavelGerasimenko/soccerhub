# SoccerHub Backend - Setup Guide

## Quick Start

### 1. Prerequisites

Ensure you have installed:
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Git

### 2. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd SoccerHub

# Install dependencies
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=soccerhub_dev
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_dev_secret_key_here
```

### 4. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker-compose ps
```

#### Option B: Manual PostgreSQL Setup

```bash
# Create database
createdb -U postgres soccerhub_dev

# Run schema
psql -U postgres -d soccerhub_dev -f src/database/schema.sql
```

### 5. Start Development Server

```bash
# In development mode with hot reload
npm run dev

# Server will be available at http://localhost:3000
```

### 6. Verify Setup

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response
{"status":"ok","timestamp":"2026-07-23T10:00:00.000Z"}
```

## Development Workflow

### Making Changes

1. Make code changes in `src/` directory
2. TypeScript is compiled on save
3. Changes are hot-reloaded automatically

### Writing Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.service.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (re-run on changes)
npm run test:watch
```

### Code Quality

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/user-authentication

# Make changes and commit
git add .
git commit -m "feat: add user authentication"

# Push and create PR
git push origin feat/user-authentication
```

## Troubleshooting

### PostgreSQL Connection Error

**Problem**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Or check Docker container
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Tests Failing

**Problem**: Tests fail with database errors

**Solution**:
```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm ci

# Verify database is running
docker-compose ps
```

### Out of Sync Dependencies

**Problem**: `npm ERR! peer dep missing`

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Building for Production

```bash
# Build TypeScript
npm run build

# Verify build
ls -la dist/

# Test production build
NODE_ENV=production node dist/index.js
```

## Docker Development

### Build Image

```bash
# Build image
docker build -t soccerhub-backend:latest .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  soccerhub-backend:latest

# Run with network
docker run -p 3000:3000 \
  --env-file .env \
  --network docker_default \
  soccerhub-backend:latest
```

### Docker Compose Full Stack

```bash
# Add service to docker-compose.yml
nano docker-compose.yml

# Add backend service, then run
docker-compose up

# Check logs
docker-compose logs -f backend
```

## IDE Setup

### VS Code

Install extensions:
- ESLint
- Prettier - Code formatter
- Thunder Client (for API testing)
- PostgreSQL (for database viewing)

Create `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["typescript"],
  "eslint.format.enable": true
}
```

### WebStorm/IntelliJ

- ESLint is built-in
- Configure Node.js interpreter in Settings
- Enable TypeScript compilation

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Node environment |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | soccerhub_dev | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_EXPIRE` | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRE` | 30d | Refresh token expiry |

## Common Commands

```bash
# Development
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run start        # Run production build

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report

# Quality
npm run lint         # Check code style
npm run lint:fix     # Auto-fix style issues
npm run format       # Format with Prettier

# Database
npm run db:init      # Initialize schema
npm run db:migrate   # Run migrations
```

## Next Steps

1. **Read Architecture**: Check [README.md](./README.md) for API documentation
2. **Explore Tests**: Look at `src/modules/users/*.test.ts` to understand testing patterns
3. **Add Features**: Create new modules following user service pattern
4. **Join Team**: Coordinate with other developers on features

## Support

- **Issues**: Create issues in repository
- **Questions**: Contact development team
- **Documentation**: See README.md and inline code comments

---

Happy coding! 🚀
