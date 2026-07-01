# 🔧 Troubleshooting & Best Practices Moba-Engine

**Panduan Lengkap untuk Mengatasi Masalah & Optimasi**

---

## 📋 Daftar Isi

1. [Common Issues & Solutions](#common-issues--solutions)
2. [Troubleshooting Hierarchy](#troubleshooting-hierarchy)
3. [Best Practices](#best-practices)
4. [Performance Optimization](#performance-optimization)
5. [Security & Deployment](#security--deployment)
6. [Advanced Debugging](#advanced-debugging)
7. [FAQ & Quick Reference](#faq--quick-reference)

---

## 🆘 Common Issues & Solutions

### Category 1: Installation & Setup Issues

#### Problem 1.1: Node.js/NPM Installation Tidak Terdeteksi

**Error Message:**
```
'npm' is not recognized as an internal or external command
'node: command not found
```

**Diagnosis:**

```bash
# 1. Check instalasi
node --version
npm --version
which node      # macOS/Linux
where node      # Windows

# 2. Jika tidak ada output, berarti belum install
```

**Solutions:**

```bash
# Solution A: Install Node.js
# Download dari: https://nodejs.org/
# Pilih LTS version (v18.x atau v20.x)
# Install sesuai OS instructions

# Verifikasi setelah install
node --version  # Should show: v18.x.x atau v20.x.x
npm --version   # Should show: 9.x.x atau 10.x.x

# Solution B: Add to PATH (jika sudah install tapi tidak terdeteksi)
# Windows: 
# Control Panel → System → Advanced → Environment Variables
# Add: C:\Program Files\nodejs\ ke PATH

# macOS/Linux:
export PATH="/usr/local/bin/node:$PATH"
echo 'export PATH="/usr/local/bin/node:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify PATH
echo $PATH | grep node
```

#### Problem 1.2: Git Not Found

**Error Message:**
```
'git' is not recognized
git: command not found
```

**Solutions:**

```bash
# Verify installation
git --version

# If not installed, install Git
# Download: https://git-scm.com/download

# After install, configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify setup
git config --global --list
```

#### Problem 1.3: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solutions:**

```bash
# Solution A: Kill process menggunakan port
# macOS/Linux
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Solution B: Use different port
npm run dev -- --port 5174

# Solution C: Add to npm script
# Edit package.json:
"dev": "vite --port 5174"

npm run dev
```

---

### Category 2: Build & Compilation Issues

#### Problem 2.1: TypeScript Compilation Errors

**Error Message:**
```
error TS2339: Property 'x' does not exist on type 'Y'
error TS2345: Argument of type 'A' is not assignable to parameter of type 'B'
```

**Diagnosis:**

```bash
# 1. Check TypeScript version
npm list typescript

# 2. Rebuild tsconfig
npx tsc --init

# 3. Check specific file
npx tsc src/main.ts --noEmit

# 4. Get detailed error
npm run build -- --verbose
```

**Solutions:**

```bash
# Solution A: Fix type errors
# Edit file yang error, pastikan type definitions correct

# Solution B: Update TypeScript
npm install -D typescript@latest

# Solution C: Relax type checking (temporary)
# tsconfig.json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}

# Solution D: Reinstall all
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Problem 2.2: Webpack Bundle Error

**Error Message:**
```
Module not found: Error: Can't resolve 'module-name'
```

**Solutions:**

```bash
# 1. Check module exists
npm list module-name

# 2. Install missing module
npm install module-name

# 3. Check package.json
cat package.json | grep -A 20 "dependencies"

# 4. Reinstall dependencies
npm install

# 5. Rebuild bundle
npm run build
npm run bundle
```

#### Problem 2.3: Vite Build Timeout

**Error Message:**
```
timeout of 30000ms exceeded
build failed
```

**Solutions:**

```bash
# Solution A: Increase timeout
npm run build -- --timeou 60000

# Solution B: Enable optimization
npm run build -- --minify esbuild

# Solution C: Reduce bundle size
# Remove unused dependencies
npm prune

# Solution D: Check system resources
# macOS/Linux
free -h
top -b -n 1 | head -20

# Windows
wmic os get totalvisiblememorysIize, freephysicalmemory

# Solution E: Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

### Category 3: Export & Import Issues

#### Problem 3.1: Export Script Tidak Ditemukan

**Error Message:**
```
npm ERR! missing script: export:sketchware
```

**Solutions:**

```bash
# 1. Verify scripts di package.json
grep -A 20 '"scripts"' package.json

# 2. Check folder scripts/
ls -la scripts/

# 3. Verify file exists
test -f scripts/export-sketchware.js && echo "File found"

# 4. If missing, create placeholder
mkdir -p scripts
cat > scripts/export-sketchware.js << 'EOF'
#!/usr/bin/env node
console.log('Export script stub - implement functionality');
EOF

npm run export:sketchware
```

#### Problem 3.2: Permission Denied on Export

**Error Message:**
```
Error: EACCES: permission denied, open './export/...'
```

**Solutions:**

```bash
# 1. Check folder permissions
ls -la export/

# 2. Fix permissions
chmod -R 755 export/
chmod -R 644 export/**/*.{xml,json,gradle}

# 3. If need sudo (not recommended)
sudo chmod -R 755 export/

# 4. Change ownership (if file owner issue)
sudo chown -R $USER:$USER export/

# 5. Create export folder if not exists
mkdir -p export
chmod 755 export
```

#### Problem 3.3: Corrupted ZIP Archive

**Error Message:**
```
End of central directory record signature not found
Error: incorrect data check
```

**Diagnosis & Solutions:**

```bash
# 1. Test archive integrity
unzip -t moba-engine-sketchware-v1.zip

# 2. If corrupted, re-export
rm moba-engine-sketchware-v1.zip
npm run export:sketchware

# 3. If problem persists, clean rebuild
rm -rf dist export
npm run build
npm run export:sketchware

# 4. Try alternative compression
cd export
zip -r moba-engine-sketchware-v1-new.zip sketchware-project/
cd ..

# 5. Verify new archive
unzip -t export/moba-engine-sketchware-v1-new.zip
```

---

### Category 4: Sketchware Import Issues

#### Problem 4.1: Project Import Fails

**Error Message:**
```
Import failed
Cannot extract project
Invalid project format
```

**Diagnosis:**

```bash
# 1. Verify ZIP structure
unzip -l moba-engine-sketchware-v1.zip | head -20

# Expected structure:
# sketchware-project/
# ├── src/main/AndroidManifest.xml
# ├── build.gradle
# ├── settings.gradle
# └── ...

# 2. Check manifest validity
unzip -p moba-engine-sketchware-v1.zip sketchware-project/src/main/AndroidManifest.xml | head -5

# 3. Test extraction
mkdir -p /tmp/test-extract
unzip moba-engine-sketchware-v1.zip -d /tmp/test-extract/
```

**Solutions:**

```bash
# Solution A: Re-export dan re-compress
npm run export:sketchware
cd export
rm moba-engine-sketchware-v1.zip
zip -r moba-engine-sketchware-v1.zip sketchware-project/
cd ..

# Solution B: Manual import folder (bypass ZIP)
# Di device Android:
adb push export/sketchware-project/ /sdcard/Sketchware/projects/MobaEngine/

# Di Sketchware:
# Projects → Refresh → Moba-Engine akan muncul

# Solution C: Validate export before import
npm run export:sketchware -- --validate-only

# Solution D: Use older Sketchware version
# Beberapa versi Sketchware ada compatibility issue
# Try install Sketchware Pro v6.5 jika v7 tidak work
```

#### Problem 4.2: Project Loading Lambat di Sketchware

**Symptoms:**
```
- Sketchware stuck saat membuka project
- "Indexing..." loading > 5 menit
- App freezes / unresponsive
```

**Solutions:**

```bash
# Solution A: Reduce project size
# 1. Remove unused code/assets
npm run export:sketchware -- \
  --exclude-tests \
  --exclude-docs \
  --optimize-size=true

# 2. Compress assets
imagemin export/sketchware-project/src/main/res/drawable/* \
  --out-dir=export/sketchware-project/src/main/res/drawable/ \
  --plugin=jpeg --plugin=png

# Solution B: Device optimization (di Android)
# 1. Clear Sketchware cache
# Settings → App → Sketchware Pro → Clear Cache → OK

# 2. Free up device storage
# Delete unnecessary files/apps
# Ensure minimal 1GB free space

# 3. Restart device
# Power off → Wait 30 sec → Power on

# 4. Close other apps
# Use Task Manager jika ada lag

# Solution C: Split project
# Bagi project menjadi modules terpisah
# Import satu per satu

# Solution D: Upgrade device specs
# Minimal requirement:
# RAM: 3GB (4GB recommended)
# Storage: 500MB free
# Android: 6.0+ (9.0+ recommended)
```

#### Problem 4.3: Build Error di Sketchware

**Error Message:**
```
Build error: Cannot find symbol
Build error: Unsupported class version
Build error: Gradle build failed
```

**Solutions:**

```bash
# Solution A: Check Java version compatibility
java -version

# Should be Java 11+
# If old version, update Java from:
# https://www.oracle.com/java/technologies/downloads/

# Solution B: Update gradle wrapper
./gradlew wrapper --gradle-version=7.6.1

# Solution C: Clean build cache
# Di project Sketchware:
# 1. Long-press project → Options
# 2. Select "Clean Build"
# 3. Select "Build" lagi

# Solution D: Regenerate project structure
npm run export:sketchware -- --rebuild-structure=true

# Solution E: Check build.gradle
cat export/sketchware-project/build.gradle

# Pastikan:
# - targetSdk dan compileSdk sesuai
# - Semua dependencies resolve-able
# - Gradle version compatible

# Solution F: Full rebuild
npm run build
rm -rf export
npm run export:sketchware
```

---

## 🔍 Troubleshooting Hierarchy

### Flowchart Troubleshooting

```
┌─────────────────────────────────────────┐
│ Identify Problem Category               │
└────────┬────────────────────────────────┘
         │
    ┌────┴─────────────┬──────────────┬──────────────┐
    │                  │              │              │
    ▼                  ▼              ▼              ▼
[Setup]          [Build]         [Export]        [Import]
    │                  │              │              │
    ├─Node?           ├─Type?        ├─ZIP?         ├─Format?
    ├─Git?            ├─Bundle?      ├─Folder?      ├─Size?
    ├─Java?           ├─Lint?        ├─Manifest?    ├─Permissions?
    └─Paths?          └─Test?        └─Compress?    └─Device?

    │                  │              │              │
    ▼                  ▼              ▼              ▼
[Solution]       [Solution]       [Solution]      [Solution]
    │                  │              │              │
    └──────────────────┴──────────────┴──────────────┘
                       │
                       ▼
              [Test & Validate]
                       │
                 ┌─────┴─────┐
                 ▼           ▼
             [Success]    [Failed]
                           │
                      [Repeat from top]
```

### Step-by-Step Debugging

```bash
# 1. Determine phase mana yang error
# - Setup / Installation
# - Development / Coding
# - Build / Compilation
# - Export / Packaging
# - Import / Integration
# - Runtime / Execution

# 2. Isolate the issue
# - Change satu variable
# - Test lagi
# - Record hasil

# 3. Check documentation
# - Read error message carefully
# - Google error message
# - Check GitHub issues

# 4. Try solutions dari Simple ke Complex
# - Restart/Clear cache (simple)
# - Reinstall package (medium)
# - Full rebuild (complex)
# - Change approach (very complex)

# 5. Log & Document
# - Catat apa yang error
# - Catat apa yang dicoba
# - Catat apa yang work
# - Share ke community jika perlu
```

---

## 📚 Best Practices

### 1. Version Control & Git

**Best Practices:**

```bash
# 1. Always commit before export
git status
git add .
git commit -m "Ready for export v1.0.0"

# 2. Use meaningful commit messages
# Good:
git commit -m "feat: add game physics engine"
git commit -m "fix: resolve memory leak in renderer"
git commit -m "docs: update setup documentation"

# Bad:
git commit -m "fix stuff"
git commit -m "update"
git commit -m "asdf"

# 3. Use branches untuk features
git checkout -b feature/new-mechanic
# ... code ...
git commit -m "feat: implement jump mechanic"
git checkout main
git merge feature/new-mechanic

# 4. Tag untuk releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 5. Regular push to remote
git push origin main
git push origin --tags
```

### 2. Code Quality

**Best Practices:**

```bash
# 1. Run linter sebelum commit
npm run lint

# 2. Fix linting issues otomatis
npm run lint:fix

# 3. Format code consistently
npm run format

# 4. Type safety dengan TypeScript
npm run build -- --noEmit

# 5. Write & run tests
npm run test
npm run test:coverage

# Target: > 80% code coverage
```

**Pre-commit Hook:**

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run lint
if [ $? -ne 0 ]; then
  echo "Linting failed. Commit aborted."
  exit 1
fi
npm run test
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 3. Project Organization

**Best Practices:**

```
Moba-Engine/
├── src/
│   ├── components/          # Reusable components
│   ├── scenes/              # Game scenes
│   ├── sprites/             # Sprite objects
│   ├── systems/             # Core systems
│   ├── utils/               # Helper functions
│   ├── config/              # Configuration files
│   ├── types/               # TypeScript types
│   └── main.ts              # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── export-sketchware.js
│   ├── export-project.js
│   ├── import-project.js
│   └── clone-project.js
├── docs/
│   ├── api/                 # API documentation
│   ├── guides/              # Setup guides
│   └── examples/            # Code examples
├── dist/                    # Build output (git ignored)
├── export/                  # Export artifacts (git ignored)
├── node_modules/            # Dependencies (git ignored)
├── package.json
├── tsconfig.json
├── README.md
├── DOKUMENTASI_SKETCHWARE_PRO_V7.md
├── PANDUAN_EXPORT_IMPORT.md
└── .gitignore
```

### 4. Dependency Management

**Best Practices:**

```bash
# 1. Keep dependencies updated
npm outdated

# 2. Update safely
npm update

# 3. Check security issues
npm audit

# 4. Fix vulnerabilities
npm audit fix

# 5. Avoid unnecessary dependencies
# Before add dependency:
# - Check if built-in solution exists
# - Compare with alternatives
# - Check maintenance & popularity
# - Verify license compatibility

# 6. Use exact versions di dependencies
# package.json:
"dependencies": {
  "package-name": "1.2.3"  // exact
}

# Use ^ untuk minor/patch updates
"devDependencies": {
  "tool-name": "^5.0.0"    // allow: 5.x.x
}
```

### 5. Documentation

**Best Practices:**

```bash
# 1. Maintain comprehensive README
cat README.md

# 2. Update changelog
cat CHANGELOG.md
# Format:
# ## [1.0.0] - 2026-07-01
# ### Added
# - New feature X
# ### Fixed
# - Bug Y
# ### Changed
# - Behavior Z

# 3. Document API
npm run doc

# 4. Add inline code comments
// Bad:
let x = 5;

// Good:
// Player movement speed (pixels per second)
const PLAYER_SPEED = 5;

# 5. Keep setup guide updated
# Edit: DOKUMENTASI_SKETCHWARE_PRO_V7.md

# 6. Document known issues
# Create: KNOWN_ISSUES.md
# - Issue description
# - Workaround
# - When it will be fixed
```

---

## ⚡ Performance Optimization

### 1. Bundle Size Optimization

```bash
# 1. Analyze bundle
npm run build -- --analyze

# 2. Find large modules
npx webpack-bundle-analyzer dist/moba-engine.js

# 3. Remove unused code
npm prune
npm run build -- --tree-shake=true

# 4. Minify aggressively
npm run build -- --minify esbuild --compress

# Before optimization: 5.2MB
# After optimization: 2.1MB (60% reduction)
```

### 2. Runtime Performance

```bash
# 1. Profile performance
npm run test:performance

# 2. Monitor memory usage
# macOS
top -l 1 -stats pid,rss,command | head -20

# Linux
top -b -n 1

# Windows
tasklist /v

# 3. Optimize game loop
// Good:
requestAnimationFrame(gameLoop);

// Bad:
setInterval(gameLoop, 16); // Fixed interval less reliable

# 4. Lazy load resources
// Load only when needed
const loadAsset = async (name) => {
  if (!cache[name]) {
    cache[name] = await fetch(`/assets/${name}`);
  }
  return cache[name];
};
```

### 3. Device Performance

```bash
# 1. Target appropriate API level
# Min SDK: 21 (Android 5.0)
# Target SDK: 33 (Android 13)
# Compile SDK: 33

# 2. Optimize for low-end devices
# Test di emulator dengan 2GB RAM
# Reduce draw calls
# Use lower resolution textures

# 3. Battery optimization
// Reduce update frequency when in background
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause game
    gameEngine.pause();
  } else {
    // Resume game
    gameEngine.resume();
  }
});

# 4. Memory leak prevention
// Always cleanup
canvas.addEventListener('resize', () => {
  oldContext.clear();
  context = newContext; // Don't leave dangling references
});
```

---

## 🔒 Security & Deployment

### 1. Code Security

```bash
# 1. Check dependencies for vulnerabilities
npm audit

# 2. Fix security issues
npm audit fix

# 3. Use strict TypeScript
# tsconfig.json:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}

# 4. Validate user input
// Bad:
const name = userInput;

// Good:
const name = sanitizeInput(userInput);
const validator = z.string().min(1).max(50);
const validatedName = validator.parse(userInput);

# 5. Encrypt sensitive data
const encrypted = crypto.encrypt(sensitiveData, key);

# 6. Never commit secrets
# .gitignore:
.env
.env.local
*.key
*.pem
secrets.json
```

### 2. Build Security

```bash
# 1. Code obfuscation
npm run build -- --obfuscate=true

# 2. Remove source maps di production
npm run build -- --sourcemap=false

# 3. Sign APK dengan production key
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ~/.android/release.keystore \
  app-release-unsigned.apk release

# 4. Verify signature
jarsigner -verify -certs app-release.apk

# 5. Create signed APK bundle
# Use Android App Bundle untuk Google Play
bundletool build-apks \
  --bundle=app.aab \
  --output=app.apks \
  --ks=release.keystore
```

### 3. Deployment Checklist

```
Sebelum Deploy ke Production:

Functional Testing
□ Semua fitur berfungsi sesuai spec
□ No game-breaking bugs
□ Performance acceptable (< 100ms latency)
□ Memory usage normal (< 300MB)

Security Testing
□ Input validation implemented
□ Sensitive data encrypted
□ No hardcoded secrets
□ Source maps removed
□ Code obfuscated

Compatibility Testing
□ Tested di Android 5.0+ (min SDK)
□ Tested di Android 13 (target SDK)
□ Works di berbagai screen sizes
□ Works online dan offline
□ Works di low-end devices

Documentation
□ README updated
□ API documented
□ Setup guide complete
□ Known issues documented
□ Changelog updated

Code Quality
□ Lint score: 0 errors
□ Test coverage: > 80%
□ No console errors/warnings
□ TypeScript strict mode
□ No security vulnerabilities

Performance
□ Bundle size optimized
□ Load time < 2 seconds
□ 60 FPS gameplay
□ Battery drain minimal

Compliance
□ Terms of Service defined
□ Privacy Policy available
□ License clear (GPL-2.0)
□ Copyright notices included
```

---

## 🐛 Advanced Debugging

### 1. Debug Workflow

```bash
# 1. Enable debug mode
export DEBUG=moba-engine:*

# 2. Run with verbose logging
npm run dev -- --debug

# 3. Open browser DevTools
# Ctrl+Shift+I (Windows/Linux)
# Cmd+Option+I (macOS)

# 4. In DevTools console, execute:
localStorage.setItem('debug', 'moba-engine:*');
location.reload();

# 5. Check console output
console.log(...) akan show dengan prefix [moba-engine]

# 6. Set breakpoints
// Dalam code:
debugger;  // Will pause ketika DevTools open

# 7. Step through code
# F10 - Step over
# F11 - Step into
# Shift+F11 - Step out
```

### 2. Memory Debugging

```bash
# 1. Record memory profile
# DevTools → Memory tab
# Click "Allocate" button
# Perform actions
# Click "Stop" button
# Analyze heap

# 2. Detect memory leaks
// Before action
const before = performance.memory.usedJSHeapSize;

// Perform action
performAction();

// After action
const after = performance.memory.usedJSHeapSize;
console.log(`Memory delta: ${(after - before) / 1024 / 1024}MB`);

# 3. Force garbage collection
// Chrome DevTools console:
// Click trash icon untuk force GC
// Memory should drop significantly if no leak

# 4. Profile heap
// macOS
instrument -t 'Allocations' -D 300 ./app

// Windows/Linux
chrome://inspect
```

### 3. Performance Profiling

```bash
# 1. FPS monitoring
// In code:
let lastTime = Date.now();
let frameCount = 0;
let fps = 0;

function gameLoop() {
  frameCount++;
  const now = Date.now();
  if (now - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
    console.log(`FPS: ${fps}`);
  }
}

# 2. Performance marks
performance.mark('start-game-loop');
// ... game logic ...
performance.mark('end-game-loop');
performance.measure('game-loop', 'start-game-loop', 'end-game-loop');

const measure = performance.getEntriesByName('game-loop')[0];
console.log(`Game loop took: ${measure.duration}ms`);

# 3. Network profiling
// DevTools → Network tab
// Reload page
// Check load times
// Identify bottlenecks

# 4. CPU profiling
// DevTools → Performance tab
// Press Record
// Perform actions
// Press Stop
// Analyze flame graph
```

---

## ❓ FAQ & Quick Reference

### Q1: Bagaimana cara update Moba-Engine ke versi terbaru?

**A:**
```bash
# 1. Fetch latest changes
git fetch origin

# 2. Pull latest
git pull origin main

# 3. Update dependencies
npm install

# 4. Rebuild
npm run build

# 5. If ada breaking changes:
# - Read CHANGELOG.md
# - Check migration guide
# - Update config jika perlu
```

### Q2: Bisakah saya merge multiple projects jadi satu?

**A:**
```bash
# 1. Clone both projects
git clone repo1
git clone repo2

# 2. Add second as subtree
cd repo1
git subtree add --prefix=modules/repo2 ../repo2 main

# 3. Merge source code
cp -r repo2/src/* src/

# 4. Update imports
# Search & replace semua import paths

# 5. Test & commit
npm install
npm run build
git commit -m "Merge projects"
```

### Q3: Bagaimana cara debug di device Android?

**A:**
```bash
# 1. Enable USB Debugging di device
# Settings → Developer Options → USB Debugging: ON

# 2. Connect device
adb devices

# 3. Open Chrome DevTools
# Chrome → chrome://inspect

# 4. Select device & app
# Click "Inspect"

# 5. DevTools akan open untuk remote debugging
# Bisa set breakpoints, view console, dll
```

### Q4: Berapa ukuran maksimal APK yang acceptable?

**A:**
```
Recommended sizes:
- Small game: 10-50MB
- Medium game: 50-150MB
- Large game: 150-300MB
- Ultra: > 300MB (split dengan AAB)

Optimization tips:
- Compress textures (WebP format)
- Remove unused assets
- Minify code
- Use dynamic delivery
```

### Q5: Bagaimana handle game state saat app di-background?

**A:**
```javascript
// Good approach:
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App in background
    gameEngine.pause();
    // Save state
    saveGameState();
  } else {
    // App in foreground
    gameEngine.resume();
    // Restore state if needed
    restoreGameState();
  }
});
```

### Quick Reference Table

| Task | Command |
|------|---------|
| Setup awal | `git clone ... && cd ... && npm install` |
| Development | `npm run dev` |
| Build | `npm run build` |
| Export ke Sketchware | `npm run export:sketchware` |
| Import ke Sketchware | Copy ke /sdcard/Sketchware/projects/ |
| Run tests | `npm run test` |
| Check quality | `npm run lint` |
| Format code | `npm run format` |
| Generate docs | `npm run doc` |
| Deploy APK | `adb install dist/app-release.apk` |

---

## 📞 Getting Help

### Where to Ask for Help

1. **GitHub Issues**
   - https://github.com/hbowo430-sudo/Moba-Engine/issues
   - Search existing issues first
   - Provide: error message, OS, version, steps to reproduce

2. **Stack Overflow**
   - Tag: `moba-engine`, `game-engine`, `sketchware`
   - Search before posting
   - Provide: minimal reproducible example

3. **Community Forums**
   - Sketchware Community: https://forum.sketchware.com/
   - Reddit: r/gamedev, r/mobiledev
   - Discord communities

4. **Create Bug Report**
   ```bash
   # Collect system info
   uname -a                # OS info
   node --version
   npm --version
   git --version
   
   # Collect error logs
   npm run build 2>&1 | tee error-log.txt
   
   # Create issue dengan semua info
   ```

---

## 📌 Key Takeaways

✅ **DO:**
- Always backup sebelum export
- Commit code regularly
- Write meaningful commit messages
- Test sebelum deploy
- Monitor performance
- Keep documentation updated
- Use version control
- Follow best practices

❌ **DON'T:**
- Commit node_modules
- Hardcode secrets
- Skip testing
- Ignore security warnings
- Export tanpa backup
- Use outdated dependencies
- Ignore error messages
- Deploy untested code

---

**Selamat debugging dan semoga smooth development! 🚀**

*Last Updated: 2026-07-01*  
*Version: 1.0.0*  
*Author: hbowo430-sudo*
