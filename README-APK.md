# Cara Build & Download APK ZE.io dari GitHub Actions

Project ini sudah disiapkan agar bisa langsung dibungkus menjadi APK Android secara otomatis menggunakan **Capacitor** dan **GitHub Actions** (tanpa perlu install Android Studio di HP atau laptop).

## Konfigurasi yang Sudah Terpasang
- `capacitor.config.ts` (`appId: com.zeio.app`, `appName: ZE.io`, `webDir: dist`, `backgroundColor: #000000`)
- Paket Capacitor di `package.json` (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`) & script `build:apk`
- Workflow otomatis di `.github/workflows/build-apk.yml`

---

## Langkah Upload & Build APK di GitHub

1. **Upload / Push project ke GitHub**:
   - Buat repository baru (atau pakai repo yang sudah ada) di GitHub.
   - Upload seluruh isi project ini (termasuk folder `.github/workflows/build-apk.yml`, `capacitor.config.ts`, dan `package.json`) ke branch `main` atau `master`.

2. **Jalankan Build di Menu Actions**:
   - Buka repository kamu di browser GitHub.
   - Klik tab **Actions** di bagian atas halaman repo.
   - Pilih workflow **Build ZE.io APK** di daftar sebelah kiri.
   - Jika belum berjalan otomatis setelah push, klik tombol **Run workflow** → pilih branch `main` → klik **Run workflow**.

3. **Tunggu Proses Selesai (~3–5 menit)**:
   - GitHub Actions akan otomatis menjalankan:
     - `npm install` & `npm run build`
     - `npx cap add android` & `npx cap sync android`
     - Setup JDK 17 + Android SDK
     - `./gradlew assembleDebug`
   - Tunggu sampai muncul tanda centang hijau (Completed).

4. **Download File `ZE.io.apk`**:
   - Klik hasil run workflow yang sudah bercentang hijau tersebut.
   - Scroll ke bagian paling bawah ke section **Artifacts**.
   - Klik **`ZE.io.apk`** untuk mengunduh file ZIP berisi `ZE.io.apk`.
   - Ekstrak file ZIP tersebut di HP/komputer, lalu install `ZE.io.apk` di HP Android kamu (izinkan *Install dari sumber tidak dikenal* jika diminta).

---

## Build Lokal di PC (Opsional)
Jika ingin sync manual di komputer:
```bash
npm install
npm run build
npx cap add android
npm run build:apk
```
