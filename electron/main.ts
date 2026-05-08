import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, ChildProcess } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')
const VITE_PUBLIC = process.env.VITE_PUBLIC || ''


let win: BrowserWindow | null
let csharpProcess: ChildProcess | null = null

// ── Spawn C# .NET Engine ──────────────────────────────────────────────────────
async function startCSharpEngine() {
  const isDev = !app.isPackaged
  
  if (isDev) {
    // Kill any existing instances on port 5281 first
    try {
      const { execSync } = await import('node:child_process');
      // Find PID on port 5281 and kill it
      const stdout = execSync('netstat -ano | findstr :5281').toString();
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
          const pid = parts[parts.length - 1];
          if (pid !== '0') execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
        }
      }
    } catch (e) {}

    const projectPath = path.join(__dirname, '../src-csharp/DidaElev.Engine/DidaElev.Engine.csproj')
    console.log('Starting C# Engine via dotnet run:', projectPath)
    
    csharpProcess = spawn('dotnet', ['run', '--project', projectPath, '--urls', 'http://localhost:5281'], {
      stdio: 'inherit',
      windowsHide: true,
      shell: true
    })
  } else {
    const enginePath = path.join(process.resourcesPath, 'DidaElev.Engine.exe')
    console.log('Starting C# Engine at:', enginePath)
    
    csharpProcess = spawn(enginePath, ['--urls', 'http://localhost:5281'], {
      stdio: 'inherit',
      windowsHide: true
    })
  }

  csharpProcess.on('error', (err) => {
    console.error('Failed to start C# Engine:', err)
  })

  csharpProcess.on('exit', (code) => {
    console.log(`C# Engine exited with code ${code}`)
  })
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1400,
    height: 900,
    title: 'DIDA-ELEV — Professional Parametric CAD',
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
  // Kill C# engine on exit
  if (csharpProcess) {
    csharpProcess.kill()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  startCSharpEngine()
  createWindow()
})
