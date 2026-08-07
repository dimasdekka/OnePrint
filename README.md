# OnePrint - Self-Service Printing Kiosk

OnePrint is a web-based self-service printing solution. Users scan a QR code from a kiosk, upload documents from a phone, pay with Midtrans, and the kiosk triggers the print job.

## Features

- Kiosk mode with dynamic QR sessions.
- Mobile handover for upload and payment.
- PDF/image upload support.
- Midtrans Snap payment integration.
- Socket.io real-time status updates.
- MySQL database through Prisma ORM.

## Prerequisites

- Node.js v18 or newer.
- MySQL database (e.g. Laragon / XAMPP / Docker MySQL).
- Midtrans sandbox or production keys.

## Project Structure

- `client/`: Next.js frontend.
- `server/`: Express, Socket.io, Prisma backend.

## Quick Start (Super Simple)

### 1. Setup di Laptop Baru (One-Command / One-Click)
Cukup buka terminal di folder utama proyek lalu jalankan:

```bash
npm run setup
```
*(Atau double-click file **`setup.bat`** di Windows)*

Ini akan otomatis menginstall semua paket dependencies untuk Root, Backend, dan Frontend, serta men-generate Prisma Client.

### 2. Database MySQL (Laragon)
Pastikan Laragon/MySQL aktif, lalu buat database `oneprint`:
```sql
CREATE DATABASE IF NOT EXISTS oneprint;
```
Sync tabel database dengan menjalankan:
```bash
npm run db:push
```

### 3. Jalankan Backend & Frontend Bersamaan
Dari root folder, jalankan:
```bash
npm run dev
```
*(Atau double-click file **`start.bat`** di Windows)*

- **Backend (API & Socket.io)**: `http://localhost:3001`
- **Frontend (Kiosk & Mobile App)**: `http://localhost:3000`

## Usage Flow

1. Open `http://localhost:3000/kiosk` on the kiosk screen.
2. Scan the QR code from a phone.
3. Upload a file.
4. Pay through Midtrans.
5. The kiosk updates from processing to printing to finished.
