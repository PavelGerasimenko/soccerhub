# SoccerHub Backend - Docker-Only Setup (No Node.js Required)

## Prerequisites

**Only requirement**: Docker Desktop
- Download: https://www.docker.com/products/docker-desktop
- Windows: Install Docker Desktop for Windows
- Requires: Windows 10/11 Pro, Enterprise, or Education
- Or: WSL 2 (Windows Subsystem for Linux)

**Check if installed**:
```bash
docker --version
docker-compose --version
```

## Setup (3 Easy Steps)

### Step 1: Start Services
```bash
cd C:\Users\pg114544\SoccerHub

# Start app, database, and cache
docker-compose -f docker-compose.dev.yml up
```

That's it! Services will start:
- ✅ API Server (http://localhost:3000)
- ✅ PostgreSQL (localhost:5432)
- ✅ Redis (localhost:6379)

### Step 2: Verify Setup
In another terminal:
```bash
# Check health
curl http://localhost:3000/health

# Or visit in browser
# http://localhost:3000/health
```

### Step 3: Test API
```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

## Common Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Run tests inside container
docker-compose -f docker-compose.dev.yml exec app npm test

# Rebuild image (after package changes)
docker-compose -f docker-compose.dev.yml up --build
```

## Using the API

### Option A: Curl (Terminal)
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!","first_name":"John","last_name":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123!"}'
```

### Option B: REST Client (VS Code)
1. Install "REST Client" extension
2. Open `api.rest` file
3. Click "Send Request" on endpoints

### Option C: Postman
1. Download Postman: https://www.postman.com/downloads/
2. Import endpoints from `api.rest`
3. Test endpoints

### Option D: Browser
```
http://localhost:3000/health
```

## Editing Code

### Without Node.js installed:
You can still **edit code normally**:
- Use VS Code to edit files
- Changes appear immediately in running container
- Server hot-reloads automatically

### Edit workflow:
1. Open project in VS Code
2. Edit files in `src/` directory
3. Save files (Ctrl+S)
4. Container detects changes
5. Server auto-reloads
6. Changes live on http://localhost:3000

## Running Tests

```bash
# Run all tests
docker-compose -f docker-compose.dev.yml exec app npm test

# Run with coverage
docker-compose -f docker-compose.dev.yml exec app npm run test:coverage

# Watch mode
docker-compose -f docker-compose.dev.yml exec app npm run test:watch
```

## Accessing Databases

### PostgreSQL
```bash
# Connect to database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d soccerhub_dev

# Query users
SELECT * FROM users.users;

# Exit
\q
```

### Redis
```bash
# Connect to Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli

# Ping
PING

# List keys
KEYS *

# Exit
exit
```

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Remove old containers
docker-compose -f docker-compose.dev.yml down -v

# Try again
docker-compose -f docker-compose.dev.yml up --build
```

### Port already in use
```bash
# Find process on port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
# Edit docker-compose.dev.yml, change "3000:3000" to "3001:3000"
```

### Slow performance
```bash
# Docker Desktop settings:
# 1. Right-click Docker icon → Settings
# 2. Resources → Memory: Set to 4GB or more
# 3. Resources → CPUs: Set to 4 or more
# 4. Click Apply & Restart
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a

# Remove all containers
docker-compose -f docker-compose.dev.yml down -v
```

## Development Workflow with Docker

```
1. Edit code in VS Code
        ↓
2. Save file (Ctrl+S)
        ↓
3. Container detects change
        ↓
4. Server auto-reloads
        ↓
5. Test API at http://localhost:3000
```

## Installing Node.js Later

If you want to develop **without** Docker later, you can install Node.js:

### Option 1: Portable Node.js (No Admin)
1. Download: https://nodejs.org/en/download/
2. Extract to `C:\Users\<YourName>\nodejs`
3. Add to PATH:
   ```powershell
   $env:PATH += ";C:\Users\pg114544\nodejs"
   ```

### Option 2: Windows Package Manager
```powershell
# If winget installed
winget install OpenJS.NodeJS
```

### Option 3: Request IT
Contact IT department to install Node.js 18+

## VS Code Setup

You don't need special setup:
1. Open folder: `C:\Users\pg114544\SoccerHub`
2. Install Docker extension
3. Edit files normally
4. Docker handles compilation

## File Structure with Docker

```
SoccerHub/
├── src/                      ← Edit these files
│   ├── modules/users/
│   ├── config/
│   └── ...
├── api.rest                  ← Test API here
├── docker-compose.dev.yml    ← Use this file
├── Dockerfile.dev
└── README.md
```

## Summary

✅ **Advantages of Docker Setup**:
- No Node.js installation needed
- All services included (DB, Cache)
- Consistent environment
- Easy to share
- Hot-reload on save
- Matches production environment

✅ **Disadvantages**:
- Slightly slower than native
- Requires Docker Desktop
- Slightly bigger disk footprint (~2GB)

## Next Steps

1. Install Docker Desktop
2. Run: `docker-compose -f docker-compose.dev.yml up`
3. Open: http://localhost:3000/health
4. Edit code in VS Code
5. Test API with curl or REST Client

---

**Status**: ✅ Ready for Docker-based development
**No Node.js Installation Required**
