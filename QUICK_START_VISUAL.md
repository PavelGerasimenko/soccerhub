# Quick Start - Visual Guide

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Install Docker Desktop                             │
│  Download: https://www.docker.com/products/docker-desktop   │
│  Install it, then continue...                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Open VS Code                                       │
│  1. Open VS Code                                            │
│  2. File → Open Folder                                      │
│  3. Select: C:\Users\pg114544\SoccerHub                     │
│  4. Click "Select Folder"                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Open Terminal in VS Code                           │
│  Press: Ctrl + ~  (control + tilde key)                     │
│                                                             │
│  You should see:                                            │
│  C:\Users\pg114544\SoccerHub>                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Run Docker Compose                                 │
│  Type this and press Enter:                                 │
│                                                             │
│  docker-compose -f docker-compose.dev.yml up                │
│                                                             │
│  Wait for messages:                                         │
│  ✓ postgres Healthy                                         │
│  ✓ redis    Healthy                                         │
│  ✓ app      Running                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Test in New Terminal                               │
│  Click + button to open new terminal                        │
│  Type:                                                      │
│                                                             │
│  curl http://localhost:3000/health                          │
│                                                             │
│  Should see:                                                │
│  {"status":"ok","timestamp":"..."}                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ✅ SUCCESS!
        Server running at http://localhost:3000
```

## VS Code Terminal Layout

```
VS Code Window
├─ Files (left side)
│  ├── src/
│  ├── docker-compose.dev.yml
│  └── api.rest
│
└─ Terminal (bottom)
   ├─ [PowerShell]  [+]  ⚙️
   │
   ├─ Tab 1: Docker logs (KEEP RUNNING)
   │  C:\Users\pg114544\SoccerHub> docker-compose -f docker-compose.dev.yml up
   │  [+] Running 3/3
   │  ✓ postgres Healthy
   │  ✓ redis Healthy
   │  ✓ app Running
   │  
   │  app_1 | Server running on port 3000
   │  app_1 | Environment: development
   │
   └─ Tab 2: Commands (use for testing)
      C:\Users\pg114544\SoccerHub> curl http://localhost:3000/health
      {"status":"ok","timestamp":"2026-07-23T..."}
```

## Terminal Commands Reference

### In Terminal Tab 1 (Docker)
```powershell
# This starts everything
docker-compose -f docker-compose.dev.yml up

# To stop (press Ctrl+C):
Ctrl + C
```

### In Terminal Tab 2 (Testing)
```powershell
# Test API is running
curl http://localhost:3000/health

# Run tests
docker-compose -f docker-compose.dev.yml exec app npm test

# Run linting
docker-compose -f docker-compose.dev.yml exec app npm run lint

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

## File Editing Workflow

```
1. Edit file in left panel (src/modules/users/user.service.ts)
   └─ Single click to preview
   └─ Double click to open for editing

2. Make changes
   └─ Type code normally

3. Save file
   └─ Ctrl + S

4. Watch Terminal Tab 1
   └─ Should show: "File changed, reloading..."
   └─ Container reloads automatically

5. Test in Terminal Tab 2
   └─ curl http://localhost:3000/health
   └─ Changes are live!
```

## Testing API

### Option A: Using Curl (Terminal Tab 2)

```powershell
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### Option B: Using REST Client (VS Code)

1. Install "REST Client" extension
2. Open `api.rest` file from left panel
3. You'll see endpoints like:
   ```
   ### Register new user
   POST {{baseUrl}}{{apiVersion}}/auth/register
   Content-Type: application/json

   {
     "email": "test@example.com",
     ...
   }
   ```
4. Click "Send Request" button above the endpoint
5. See response in right panel

## Troubleshooting Quick Fixes

### Docker won't start
```powershell
# Make sure Docker Desktop is running
# (Look for Docker icon in system tray)

# Or try:
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### "command not found: docker-compose"
```powershell
# Make sure you're in the right folder:
cd C:\Users\pg114544\SoccerHub

# Check if Docker Desktop is installed:
docker --version
```

### Port 3000 in use
```powershell
# Kill process on port 3000:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or restart Docker Desktop
```

### Containers running but API won't respond
```powershell
# Check logs:
docker-compose -f docker-compose.dev.yml logs app

# Restart:
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up
```

## What Each Service Does

```
Terminal shows:
├─ postgres    = Database (stores users, events, etc)
├─ redis       = Cache (speeds up requests)
└─ app         = Your API server (http://localhost:3000)

All 3 start together with one command!
```

## File Changes Auto-Reload

```
You edit: src/modules/users/user.service.ts
    ↓
Save: Ctrl + S
    ↓
Container detects change
    ↓
Server reloads automatically
    ↓
Your API updated in seconds!

You can see it in Terminal Tab 1:
> File changed, reloading...
> Server running on port 3000
```

## Stopping Everything

```
In Terminal Tab 1 where docker-compose is running:

Press: Ctrl + C

Watch for:
Gracefully stopping...
[+] Stopping 3/3
 ✓ postgres Stopped
 ✓ redis Stopped  
 ✓ app Stopped

Then: Close terminal
```

## Restarting Later

```
Next time you want to develop:

1. Open VS Code with SoccerHub folder
2. Press Ctrl + ~ for terminal
3. Type: docker-compose -f docker-compose.dev.yml up
4. Wait for "app Running"
5. Code away!
```

## Summary

| Step | Command | Location |
|------|---------|----------|
| 1 | Install Docker | Download website |
| 2 | Open VS Code | Windows Start |
| 3 | Open folder | File → Open Folder |
| 4 | Open terminal | Ctrl + ~ |
| 5 | Start services | `docker-compose -f docker-compose.dev.yml up` |
| 6 | Test API | `curl http://localhost:3000/health` |
| 7 | Edit code | Left file panel |
| 8 | Save | Ctrl + S |
| 9 | See changes | Live! Check http://localhost:3000 |

---

**You're ready!** 

👉 **Next:** Install Docker Desktop, then follow the visual workflow above. ✅
