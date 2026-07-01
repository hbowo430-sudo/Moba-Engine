# 📦 Panduan Lengkap Ekspor/Impor Moba-Engine untuk Sketchware Pro v7

**Advanced Guide untuk Export & Import Project**

---

## 📋 Daftar Isi

1. [Ekspor Project - Metode Lengkap](#ekspor-project---metode-lengkap)
2. [Impor ke Sketchware - Step by Step](#impor-ke-sketchware---step-by-step)
3. [Format File & Struktur](#format-file--struktur)
4. [Validasi & Testing](#validasi--testing)
5. [Advanced Export Options](#advanced-export-options)
6. [Troubleshooting Lanjutan](#troubleshooting-lanjutan)

---

## 📤 Ekspor Project - Metode Lengkap

### Metode 1: Export untuk Sketchware (Recommended)

#### Step 1: Persiapkan Environment

```bash
# 1. Masuk ke folder project
cd ~/Projects/MobileGameDev/Moba-Engine

# 2. Verifikasi status git
git status

# 3. Buat branch baru untuk export
git checkout -b export/sketchware-v1
```

#### Step 2: Build Project

```bash
# 1. Clean build (optional tapi recommended)
rm -rf dist node_modules package-lock.json

# 2. Fresh install dependencies
npm install

# 3. Build dengan verbose output
npm run build -- --verbose

# Expected output:
# ✓ 1200+ modules compiled
# ✓ 15 chunks created
# ✓ Total bundle size: 2.5MB
```

#### Step 3: Export untuk Sketchware

```bash
# 1. Run export script
npm run export:sketchware

# 2. Script akan:
#    ├─ Baca konfigurasi dari package.json
#    ├─ Generate Android-compatible structure
#    ├─ Compile TypeScript ke JavaScript
#    ├─ Optimize assets dan resources
#    └─ Create export archive

# Expected output:
# ✓ Export started...
# ✓ Building Android manifest
# ✓ Compiling resources
# ✓ Packaging project... 100%
# ✓ Export completed: ./export/sketchware-project/
```

#### Step 4: Verifikasi Export Output

```bash
# 1. List folder export
ls -la export/sketchware-project/

# 2. Struktur yang diharapkan:
# export/sketchware-project/
# ├── src/
# │   ├── main/
# │   │   ├── java/
# │   │   ├── AndroidManifest.xml
# │   │   └── res/
# │   └── androidTest/
# ├── build.gradle
# ├── settings.gradle
# ├── gradle.properties
# ├── local.properties
# └── gradlew / gradlew.bat

# 3. Cek ukuran folder
du -sh export/sketchware-project/

# 4. Cek manifest
cat export/sketchware-project/src/main/AndroidManifest.xml

# 5. Cek build.gradle
cat export/sketchware-project/build.gradle
```

#### Step 5: Kompres Export

```bash
# 1. Buat ZIP archive
cd export/
zip -r moba-engine-sketchware-v1.zip sketchware-project/

# 2. Verifikasi ZIP
unzip -t moba-engine-sketchware-v1.zip

# 3. Check ukuran
ls -lh moba-engine-sketchware-v1.zip

# Expected: ~3-5MB tergantung assets

# 4. Kembali ke folder root
cd ..
```

---

### Metode 2: Export dengan Custom Configuration

#### Buat File Konfigurasi

```javascript
// export-config.js
module.exports = {
  // Project settings
  project: {
    name: 'Moba-Engine',
    version: '1.0.0',
    packageName: 'com.mobaengine.game'
  },
  
  // Build settings
  build: {
    targetSdk: 33,
    minSdk: 21,
    compileSdk: 33,
    buildTools: '33.0.0'
  },
  
  // Export options
  export: {
    format: 'sketchware',
    includeAssets: true,
    optimizeSize: true,
    stripDebugSymbols: true
  },
  
  // Features
  features: {
    permissions: [
      'INTERNET',
      'WRITE_EXTERNAL_STORAGE',
      'READ_EXTERNAL_STORAGE',
      'CAMERA',
      'RECORD_AUDIO'
    ],
    activities: [],
    services: []
  }
};
```

#### Jalankan Export Custom

```bash
# 1. Export dengan config custom
npm run export:project -- --config=export-config.js

# 2. Atau dengan inline options
npm run export:project -- \
  --target=sketchware \
  --package-name=com.mycompany.mygame \
  --app-name="My Game" \
  --optimize=true

# 3. Output akan di-create di: ./export/custom-export/
```

---

### Metode 3: Export APK untuk Direct Install

#### Step 1: Setup Android Build

```bash
# 1. Ensure Java Development Kit (JDK) installed
java -version

# 2. Setup Android SDK path (jika belum)
export ANDROID_HOME=~/Android/Sdk
export PATH=$ANDROID_HOME/tools:$PATH
export PATH=$ANDROID_HOME/platform-tools:$PATH

# 3. Verify setup
adb --version
```

#### Step 2: Build APK

```bash
# 1. Build release APK
npm run build

# 2. Package untuk Android
./gradlew build -x test

# 3. Locate APK output
find . -name "*.apk" -type f

# Output akan berada di:
# ./dist/outputs/apk/release/app-release-unsigned.apk

# 4. Sign APK (requires keystore)
jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 \
  -keystore ~/.android/debug.keystore \
  dist/outputs/apk/release/app-release-unsigned.apk \
  androiddebugkey

# 5. Align APK (optional but recommended)
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

#### Step 3: Transfer & Install

```bash
# 1. Connect Android device via USB
adb devices

# 2. Push APK ke device
adb push dist/app-release.apk /data/local/tmp/

# 3. Install APK
adb install /data/local/tmp/app-release.apk

# 4. Verify installation
adb shell pm list packages | grep moba

# 5. Run aplikasi
adb shell am start -n com.mobaengine.game/com.mobaengine.game.MainActivity
```

---

## 📥 Impor ke Sketchware - Step by Step

### Method 1: Import via ZIP File (Recommended)

#### A. Persiapan di PC/Laptop

```bash
# 1. Pastikan file export sudah ready
ls -lh export/moba-engine-sketchware-v1.zip

# 2. Verifikasi integrity
unzip -t export/moba-engine-sketchware-v1.zip | tail -20

# 3. Copy ke folder accessible
cp export/moba-engine-sketchware-v1.zip ~/Downloads/
```

#### B. Transfer ke Device Android

**Metode 1 - USB Connection:**

```bash
# 1. Connect device via USB (Enable USB Debugging)
adb devices

# 2. Push file ke Downloads
adb push ~/Downloads/moba-engine-sketchware-v1.zip \
  /sdcard/Download/moba-engine-sketchware-v1.zip

# 3. Verify transfer
adb shell ls -lh /sdcard/Download/moba-engine-sketchware-v1.zip
```

**Metode 2 - Cloud Transfer:**

```bash
# 1. Upload ke cloud (Google Drive, Dropbox, etc.)
# 2. Download di device dari browser
# 3. File otomatis tersimpan di: /sdcard/Download/
```

**Metode 3 - Email/WhatsApp:**

```
1. Send file via email atau messenger
2. Download di device
3. File akan tersimpan di: /sdcard/Download/
```

#### C. Import di Sketchware Pro v7

**Interface Sketchware:**

```
1. Buka aplikasi Sketchware Pro v7
2. Tap ⊞ "Projects" (tab utama)
3. Tap ➕ "+" button atau "New"
4. Pilih "Import Project"
5. Tap "Browse" atau folder icon
6. Navigate ke /sdcard/Download/
7. Select: moba-engine-sketchware-v1.zip
8. Tap "Open" / "Select"
9. Sketchware akan:
   ├─ Extract file
   ├─ Scan struktur project
   ├─ Index code (2-5 menit)
   └─ Add ke Projects list
10. Tap project name untuk membuka
```

#### D. First Time Setup di Sketchware

```
✓ Project akan scan otomatis
✓ Dependencies akan di-resolve
✓ Resources akan di-index
✓ Akan ada popup: "Preparing project..."
✓ Tunggu sampai selesai loading

Tips:
- Pertama kali bisa lambat (3-5 menit)
- Jangan close app saat proses
- Ensure device punya space minimal 500MB
```

---

### Method 2: Direct Folder Copy (Advanced)

#### Tanpa Extract via Sketchware

```bash
# PC/Laptop side:

# 1. Unzip export file
unzip export/moba-engine-sketchware-v1.zip -d export/

# 2. Prepare folder
mkdir -p export/MobaEngine

# 3. Rename project folder
mv export/sketchware-project/* export/MobaEngine/

# 4. Copy ke device dengan ADB
adb push export/MobaEngine/ /sdcard/Sketchware/projects/MobaEngine/

# atau manual copy jika tidak ada ADB:
# - Mount device sebagai storage
# - Copy folder ke: /sdcard/Sketchware/projects/MobaEngine/
```

```
Di Sketchware:

1. Buka Projects
2. Refresh/Rescan projects
3. "MobaEngine" akan muncul di list
4. Tap untuk membuka
```

---

### Method 3: Using Sketchware CLI (Advanced)

```bash
# 1. Install Sketchware CLI globally
npm install -g sketchware-cli

# 2. Setup Sketchware path (first time)
sketchware config --set-home /sdcard/Sketchware

# 3. Import project from export
sketchware import --path=export/sketchware-project/ \
  --name=MobaEngine \
  --auto-organize=true

# 4. Verify import
sketchware list projects

# Output:
# Projects in Sketchware:
# 1. MobaEngine - Last modified: now
# 2. ... (other projects)
```

---

## 📁 Format File & Struktur

### Export Directory Structure

```
export/
├── sketchware-project/                    # Main export folder
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/mobaengine/
│   │   │   │   │       ├── MainActivity.java
│   │   │   │   │       ├── GameEngine.java
│   │   │   │   │       └── ... (compiled classes)
│   │   │   ��   ├── res/
│   │   │   │   │   ├── layout/
│   │   │   │   │   │   ├── activity_main.xml
│   │   │   │   │   │   └── ... (layouts)
│   │   │   │   │   ├── drawable/
│   │   │   │   │   │   └── ... (images, icons)
│   │   │   │   │   ├── values/
│   │   │   │   │   │   ├── strings.xml
│   │   │   │   │   │   ├── colors.xml
│   │   │   │   │   │   └── dimens.xml
│   │   │   │   │   ├── raw/
│   │   │   │   │   │   └── ... (game assets)
│   │   │   │   │   └── anim/
│   │   │   │   │       └── ... (animations)
│   │   │   │   └── AndroidManifest.xml
│   │   │   ├── test/
│   │   │   │   └── java/
│   │   │   │       └── ... (test classes)
│   │   │   └── androidTest/
│   │   │       └── java/
│   │   │           └── ... (instrumented tests)
│   │   ├── build.gradle                  # Module build config
│   │   ├── proguard-rules.pro             # Code obfuscation rules
│   │   └── .gitignore
│   ├── gradle/
│   │   └── wrapper/
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── build.gradle                       # Project build config
│   ├── settings.gradle                    # Project settings
│   ├── gradle.properties                  # Gradle properties
│   ├── local.properties                   # Local SDK path
│   ├── gradlew / gradlew.bat              # Gradle wrapper scripts
│   ├── .gitignore
│   ├── README.md
│   └── LICENSE
│
├── moba-engine-sketchware-v1.zip          # Compressed archive
├── export-manifest.json                   # Export metadata
└── export-log.txt                         # Export log
```

### Manifest File Structure

**AndroidManifest.xml:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mobaengine.game"
    android:versionCode="1"
    android:versionName="1.0.0">

    <!-- Minimum & Target SDK -->
    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <!-- Application Configuration -->
    <application
        android:allowBackup="true"
        android:debuggable="false"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Game Engine Activity -->
        <activity
            android:name=".GameEngine"
            android:screenOrientation="landscape" />

    </application>

</manifest>
```

### Gradle Configuration

**build.gradle (Project level):**

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:7.3.1'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

**build.gradle (App/Module level):**

```gradle
plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace 'com.mobaengine.game'
    compileSdk 33

    defaultConfig {
        applicationId 'com.mobaengine.game'
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName '1.0.0'

        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    // Capacitor dependencies
    implementation 'com.getcapacitor:capacitor-android:5.0.6'
    implementation 'com.getcapacitor:capacitor-app:5.0.6'
    implementation 'com.getcapacitor:capacitor-device:5.0.6'
    implementation 'com.getcapacitor:capacitor-filesystem:5.0.6'
    implementation 'com.getcapacitor:capacitor-storage:5.0.6'

    // Other dependencies
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.core:core:1.10.1'
}
```

---

## ✅ Validasi & Testing

### Pre-Export Validation

```bash
# 1. Run all checks
npm run validate

# 2. Lint code
npm run lint

# 3. Run tests
npm run test

# 4. Check TypeScript errors
npx tsc --noEmit

# 5. Build check
npm run build

# Expected output untuk semua: ✓ No errors
```

### Post-Export Validation

```bash
# 1. Verify export structure
npm run export:sketchware -- --validate-only

# 2. Check file integrity
find export/sketchware-project/ -type f | wc -l

# Output: Should be 50+ files

# 3. Verify manifest syntax
xmllint --noout export/sketchware-project/src/main/AndroidManifest.xml

# 4. Check for critical files
test -f export/sketchware-project/src/main/AndroidManifest.xml && echo "✓ Manifest found"
test -f export/sketchware-project/build.gradle && echo "✓ build.gradle found"
test -f export/sketchware-project/settings.gradle && echo "✓ settings.gradle found"
test -d export/sketchware-project/src/main/java && echo "✓ Java source found"
test -d export/sketchware-project/src/main/res && echo "✓ Resources found"
```

### Testing Import di Sketchware

```
Setelah import di Sketchware:

✓ Project muncul di list
✓ Bisa di-open tanpa error
✓ Source code bisa dibuka
✓ Resources visible
✓ Layouts bisa di-edit
✓ Build bisa di-run
✓ Test di emulator/device

Checklist Test:
□ Project list - Moba-Engine muncul
□ Open project - Tidak ada error dialog
□ Source code - File .java visible
□ Resources - Image/sound assets loaded
□ Visual editor - XML layouts renders
□ Build project - Compiles without error
□ Run on device - APK install & launch success
□ Functionality - Game logic works properly
```

---

## 🚀 Advanced Export Options

### Export dengan Optimization

```bash
# 1. Export dengan minification & obfuscation
npm run export:sketchware -- \
  --minify=true \
  --obfuscate=true \
  --strip-debug=true

# 2. Export dengan asset optimization
npm run export:sketchware -- \
  --compress-images=true \
  --compress-level=9 \
  --remove-unused-resources=true

# 3. Export dengan specific features
npm run export:sketchware -- \
  --include-permissions=INTERNET,CAMERA,MICROPHONE \
  --min-sdk=21 \
  --target-sdk=33

# 4. Export multiple formats
npm run export:project -- --formats=zip,apk,aab
```

### Incremental Export

```bash
# Export hanya file yang berubah
npm run export:sketchware -- \
  --incremental=true \
  --base-version=1.0.0

# Useful untuk update project existing di Sketchware
```

### Batch Export

```bash
# Create batch export script
cat > batch-export.sh << 'EOF'
#!/bin/bash

# Export v1
npm run export:sketchware -- --version=1.0.0 --output=exports/v1/

# Export v2
npm run export:sketchware -- --version=1.0.1 --output=exports/v2/

# Export v3
npm run export:sketchware -- --version=1.0.2 --output=exports/v3/

# List exports
ls -lh exports/*/
EOF

# Run batch export
chmod +x batch-export.sh
./batch-export.sh
```

---

## 🔧 Troubleshooting Lanjutan

### Issue 1: Export Process Hang/Freeze

**Gejala:**
```
npm run export:sketchware
# Proses stuck di "Compiling..." atau "Packaging..."
# Tidak ada progress selama 10+ menit
```

**Solusi:**

```bash
# 1. Kill proses
Ctrl+C (Mac/Linux)
Ctrl+Break (Windows)

# 2. Clear cache
npm cache clean --force
rm -rf dist build node_modules/.cache

# 3. Re-run dengan verbose
npm run export:sketchware -- --verbose --debug

# 4. Check disk space
df -h  # macOS/Linux
diskpart  # Windows

# 5. Try dengan smaller project size
npm run export:sketchware -- --exclude-tests --exclude-docs

# 6. Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run export:sketchware
```

### Issue 2: Corrupt ZIP Archive

**Gejala:**
```
Error: Invalid or corrupt zip file
Error: End of central directory record signature not found
```

**Solusi:**

```bash
# 1. Re-export fresh
rm export/moba-engine-sketchware-v1.zip
npm run export:sketchware

# 2. Verify zip integrity
unzip -t export/moba-engine-sketchware-v1.zip

# 3. If corrupted, try without compression
npm run export:sketchware -- --compression=none

# 4. Use alternative compression tool
zip -r -X export/moba-engine-sketchware-v1.zip export/sketchware-project/

# 5. Verify after compression
unzip -l export/moba-engine-sketchware-v1.zip | head -20
```

### Issue 3: File Permission Errors saat Import

**Gejala:**
```
Permission denied
Cannot read file
Access denied
```

**Solusi:**

```bash
# 1. Fix permissions pada export folder
chmod -R 755 export/sketchware-project/

# 2. Fix pada ZIP file
unzip export/moba-engine-sketchware-v1.zip -d /tmp/extracted/
chmod -R 755 /tmp/extracted/sketchware-project/
zip -r export/moba-engine-sketchware-v1-fixed.zip /tmp/extracted/sketchware-project/

# 3. Re-transfer ke device
adb push export/moba-engine-sketchware-v1-fixed.zip /sdcard/Download/

# 4. Re-import di Sketchware
```

### Issue 4: Missing Dependencies saat Build

**Gejala:**
```
Gradle build error
Cannot resolve symbol
Library not found
```

**Solusi:**

```bash
# 1. Update Gradle wrapper
./gradlew wrapper --gradle-version=7.6.1

# 2. Regenerate Gradle cache
rm -rf ~/.gradle/caches
./gradlew clean

# 3. Update dependencies
npm install --save-dev gradle@latest

# 4. Full rebuild
./gradlew clean build

# 5. Force re-export dengan dependencies fix
npm run export:sketchware -- \
  --fetch-latest-deps=true \
  --update-gradle=true
```

### Issue 5: APK Installation Failed

**Gejala:**
```
adb: failed to install app-release.apk: Failure [INSTALL_FAILED_INVALID_APK]
```

**Solusi:**

```bash
# 1. Check APK signature
jarsigner -verify -verbose -certs dist/app-release.apk

# 2. Re-sign APK
jarsigner -sigalg MD5withRSA -digestalg SHA1 \
  -keystore ~/.android/debug.keystore \
  -storepass android -keypass android \
  dist/app-release.apk androiddebugkey

# 3. Re-align
zipalign -v 4 dist/app-release.apk dist/app-release-aligned.apk

# 4. Uninstall old version first
adb uninstall com.mobaengine.game

# 5. Install fresh
adb install dist/app-release-aligned.apk
```

---

## 📊 Monitoring & Logging

### Export Log Analysis

```bash
# 1. View export log
cat export-log.txt

# 2. Filter errors
grep -i "error\|warning" export-log.txt

# 3. Check timing
grep -i "time\|duration" export-log.txt

# 4. Save detailed log
npm run export:sketchware -- \
  --verbose \
  --log-file=export-detailed.log

# 5. Analyze log
less export-detailed.log
```

### Performance Monitoring

```bash
# Monitor export performance
npm run export:sketchware -- --benchmark=true

# Output akan menunjukkan:
# Time breakdown:
# - Compilation: 5.2s
# - Packaging: 3.1s
# - Optimization: 2.4s
# - Total: 10.7s
```

---

## 💾 Backup & Recovery

### Backup Before Export

```bash
# 1. Create backup of current state
git tag -a v1.0.0-backup -m "Backup before export"
git push origin v1.0.0-backup

# 2. Create local backup
cp -r . ~/Backups/Moba-Engine-backup-$(date +%Y%m%d)/

# 3. Backup export artifacts
mkdir -p backups/exports
cp -r export/ backups/exports/v1.0.0/
tar -czf backups/exports-v1.0.0.tar.gz backups/exports/v1.0.0/
```

### Recovery Procedure

```bash
# Jika export gagal dan ingin restore:

# 1. Check backup
ls -la ~/Backups/

# 2. Restore dari backup
cp -r ~/Backups/Moba-Engine-backup-20260701/* .

# 3. Verify restored state
git status
npm list

# 4. Re-run export
npm run export:sketchware
```

---

## 📈 Optimization Tips

### Untuk Ukuran File Lebih Kecil

```bash
# 1. Remove development dependencies dari export
npm run export:sketchware -- --production-only=true

# 2. Minify assets
npm run export:sketchware -- --minify-assets=true

# 3. Remove source maps
npm run build -- --sourcemap=false
npm run export:sketchware

# 4. Compress media files
imagemin export/sketchware-project/src/main/res/drawable/* --out-dir=export/sketchware-project/src/main/res/drawable/

# Hasil size akan lebih kecil:
# Before: 5.2MB
# After: 2.8MB (46% reduction)
```

### Untuk Build Speed Lebih Cepat

```bash
# 1. Enable parallel build
export GRADLE_OPTS="-Dorg.gradle.parallel=true"

# 2. Use cached builds
npm run export:sketchware -- --incremental=true

# 3. Reduce output verbosity
npm run export:sketchware 2>/dev/null

# Hasil speed akan lebih cepat:
# Full build: 45s
# Incremental: 8s
```

---

**Selamat menggunakan Ekspor & Impor Moba-Engine! 🎉**

*Last Updated: 2026-07-01*  
*Version: 1.0.0*
