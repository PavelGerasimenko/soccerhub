# VS Code Setup - Step by Step

## Install VS Code

1. Download: https://code.visualstudio.com/
2. Install and open
3. Click **File → Open Folder**
4. Select: `C:\Users\pg114544\SoccerHub`
5. Click **Select Folder**

## Open Terminal in VS Code

### Method 1 (Easiest)
Press: `Ctrl + ~` (control + tilde)

### Method 2
Click: **Terminal → New Terminal**

You should see this at bottom of screen:
```
PowerShell
C:\Users\pg114544\SoccerHub>
```

## Run Docker Commands

In the terminal, type:
```powershell
docker-compose -f docker-compose.dev.yml up
```

Press Enter and wait for:
```
✓ postgres Healthy
✓ redis    Healthy
✓ app      Running
```

## Keep Terminal Open

✅ **Don't close this terminal!** Keep it running.

It will show you:
- ✅ Errors
- ✅ Logs
- ✅ When files change and reload

## Open Second Terminal

Click the **+** button in terminal to open another:

```
┌─────────────────────────────────────────┐
│ PowerShell (tab 1)  +  ⚙️               │
│                                         │
│ C:\Users\pg114544\SoccerHub>            │
│ docker-compose -f docker-compose.dev... │
│ [logs showing...]                       │
└─────────────────────────────────────────┘
```

Click the **+** to add Tab 2:
```
C:\Users\pg114544\SoccerHub>
```

Now use Tab 2 to run commands like:
```powershell
# Test API
curl http://localhost:3000/health

# Run tests
docker-compose -f docker-compose.dev.yml exec app npm test
```

## Edit Code

Left panel shows your files. Edit them normally:
- src/
- package.json
- docker-compose.dev.yml
- etc.

When you save (`Ctrl + S`), the container reloads automatically!

## Viewing Logs

### Tab 1 (Keep Open)
Shows all logs from running services

### Common Logs
```
app_1 | npm run dev
app_1 | Server running on port 3000
postgres_1 | database initialized
redis_1 | Server started
```

## Useful VS Code Extensions

Install these for better experience:
- **Docker** (Microsoft)
- **REST Client** (Humao Zhang)
- **Thunder Client** (Ranga Vadhineni)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + ~` | Toggle terminal |
| `Ctrl + Shift + ~` | New terminal |
| `Ctrl + S` | Save file |
| `Ctrl + Shift + D` | Go to definition |
| `Ctrl + /` | Comment line |

## Testing API in VS Code

### Using REST Client Extension

1. Install "REST Client" extension
2. Open `api.rest` file
3. Look for lines like:
   ```
   ### Register new user
   POST {{baseUrl}}{{apiVersion}}/auth/register
   ```
4. Click **Send Request** above the endpoint
5. See response in right panel

## Directory Structure in VS Code

```
SoccerHub (root folder)
├── src/
│   ├── modules/
│   │   └── users/
│   ├── config/
│   ├── middleware/
│   └── ...
├── scripts/
├── .env.example
├── .eslintrc.json
├── docker-compose.dev.yml
├── api.rest
├── package.json
├── README.md
└── [more files]
```

Click on any file to open and edit it.

## Workflow

```
1. Open VS Code with SoccerHub folder
2. Press Ctrl + ~ to open terminal
3. Run: docker-compose -f docker-compose.dev.yml up
4. Wait for "app Running" message
5. Open new terminal (click +)
6. Run: curl http://localhost:3000/health
7. Edit files in left panel
8. Save with Ctrl + S
9. Changes auto-reload in container
10. View logs in Tab 1
```

## Stopping Services

In terminal running docker-compose, press:
```
Ctrl + C
```

You'll see:
```
Gracefully stopping...
[+] Stopping 3/3
 ✓ postgres Stopped
 ✓ redis Stopped
 ✓ app Stopped
```

Then restart anytime with same command:
```powershell
docker-compose -f docker-compose.dev.yml up
```

---

**Ready?** Follow these steps and you'll be up and running in minutes! ✅
