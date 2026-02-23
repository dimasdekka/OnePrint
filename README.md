# OnePrint - Self-Service Printing Kiosk

OnePrint is a web-based self-service printing solution that allows users to scan a QR code from a kiosk, upload documents via their smartphone, and pay using Midtrans (QRIS/E-Wallet) to automatically trigger a print job.

## 🚀 Features

- **Kiosk Mode**: Dedicated display with split layout (Instructions + Dynamic QR Code).
- **Mobile Handover**: Scan QR to transfer session to smartphone.
- **File Upload**: Support for PDF and Images.
- **Payment Integration**: Midtrans Snap (Sandbox) for secure payments.
- **Real-time Status**: Socket.io for live updates between Kiosk and Phone.
- **Persistent Data**: MySQL Database (via Docker) + Prisma ORM.

## 🛠️ Prerequisites

- **Node.js** (v18 or higher)
- **Docker Desktop** (for MySQL Database)
- **Midtrans Account** (Sandbox Keys)

## 📂 Project Structure

- `client/`: Frontend application (Next.js 16, Tailwind CSS).
- `server/`: Backend API (Express.js, Socket.io, Prisma, MySQL).

---

## ⚡ Quick Start Guide

### 1. Database Setup (Docker)

Make sure Docker Desktop is running.

```bash
# In the root project folder
docker-compose up -d
```

This starts a MySQL container on port 3306.

### 2. Backend Setup

configure the environment variables:
Create `server/.env`:

```env
PORT=3001
MIDTRANS_SERVER_KEY=SB-Mid-server-GwUP_WGbJPXsDzsNEBRs8Izh
MIDTRANS_CLIENT_KEY=SB-Mid-client-61XuGAwQ8Vg5Dx9u
DATABASE_URL="mysql://oneprint:oneprintpassword@localhost:3306/oneprint"
```

Install dependencies and start server:

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm start
```

_Server runs on: `http://localhost:3001`_

### 3. Frontend Setup

Configure environment variables:
Create `client/.env.local`:

```env
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-61XuGAwQ8Vg5Dx9u
```

Install dependencies and start client:

```bash
cd client
npm install
npm run dev
```

_Client runs on: `http://localhost:3000`_

---

## 📖 Usage Flow

1.  **Open Kiosk**: access `http://localhost:3000/kiosk` on the monitor/tablet.
2.  **Scan QR**: Use your phone to scan the QR code displayed.
3.  **Upload**: On your phone, select a file to print.
4.  **Pay**: Click "Pay Now" and complete the transaction (Use **Gopay** or **Test Card** in Sandbox).
5.  **Print**: Watch the Kiosk screen update to "Processing" -> "Printing" -> "Finished".
