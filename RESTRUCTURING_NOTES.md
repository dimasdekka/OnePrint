# OnePrint Database & Authentication Restructuring

## 📋 Summary Perubahan

Telah dilakukan restructuring lengkap pada database schema dan sistem authentication untuk membuat OnePrint lebih terstruktur dan aman.

---

## 🏗️ Perubahan Database

### Table Baru

#### 1. **User** (Autentikasi Admin)

```sql
- id (UUID, Primary Key)
- username (VARCHAR, UNIQUE)
- password (VARCHAR, bcrypt hash)
- role (VARCHAR, default='admin')
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

Default Admin:

- Username: `admin`
- Password: (bcrypt hash dari password bawaan)

#### 2. **PrinterSettings** (Pricing per Printer)

```sql
- id (UUID, Primary Key)
- printerId (VARCHAR, UNIQUE FK → Printer)
- pricePerPageBw (DECIMAL 10,2, default=1500)
- pricePerPageColor (DECIMAL 10,2, default=3000)
- updatedAt (DATETIME)
```

Default harga:

- B&W: Rp 1.500/halaman
- Color: Rp 3.000/halaman

### Table yang Di-Enhanced

#### Session

```sql
+ userId (VARCHAR FK → User) → Track siapa yang upload
+ colorMode (VARCHAR, default='bw') → bw atau color
+ paperSize (VARCHAR, default='A4') → A4, F4, dll
```

#### Transaction

```sql
+ printerId (VARCHAR FK → Printer) → Track printer mana yang dipakai
+ paymentStatus (VARCHAR, default='pending') → pending, paid, failed, expired
+ paidAt (DATETIME) → Kapan pembayaran dikonfirmasi

(status field masih ada untuk backward compatibility)
```

#### Printer

```sql
+ printerId (VARCHAR, UNIQUE) → System printer ID
+ lastSync (DATETIME) → Last status synchronization time
```

---

## 🔐 Sistem Authentication Baru

### Hirarki Auth

- **Public Routes**: Upload, Payment (tanpa auth)
- **Authenticated Routes**: Session management (dengan auth)
- **Admin Routes**: Printer management, Reports (dengan auth + admin role)

### Endpoints

#### Login (Public)

```bash
POST /api/auth/login
Body: {
  "username": "admin",
  "password": "yourpassword"
}

Response: {
  "success": true,
  "user": {
    "id": "...",
    "username": "admin",
    "role": "admin"
  }
}
```

#### Get Current User

```bash
GET /api/auth/me
Response: User object atau 401 Unauthorized
```

#### Logout

```bash
POST /api/auth/logout
```

#### Manage Users (Admin Only)

```bash
# Create new admin user
POST /api/auth/users
Body: {
  "username": "newadmin",
  "password": "password123"
}

# List all users
GET /api/auth/users

# Change password
POST /api/auth/password
Body: {
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

---

## 📝 Service Updates

### payment.service.js

✅ **Perubahan:**

- `getPricePerPage(printerId, colorMode)` - Ambil harga dari PrinterSettings
- `calculateAmount(pageCount, copies, colorMode, printerId)` - Hitung harga dinamis
- `createMidtransToken(sessionId, filename, printJobData)` - Support printer dan color mode
- `updateTransactionStatus(orderId, paymentStatus)` - Track pembayaran dengan paidAt

**Impact:** Harga otomatis mengikuti printer settings, bukan hardcoded constant

### session.service.js

✅ **Perubahan:**

- `markSessionUsed(sessionId, fileData, printSettings, userId)` - Track user dan print settings
- `updateSessionSettings(sessionId, settings)` - Update color mode, paper size, copies
- `getSessionsByUser(userId, limit)` - Get sessions per user

**Impact:** Setiap session dapat di-track ke user dan print settings

### printer.service.js

✅ **Perubahan:**

- `addPrinter()` - Auto create PrinterSettings saat printer baru ditambah
- `getReports()` - Include printer name, payment status, user info
- `updatePrinterStatus()` - Update lastSync field

**Impact:** Report lebih informatif dengan detail printer, user, dan status pembayaran

---

## 🛡️ Security Enhancements

### Implemented

```javascript
✅ Password hashing dengan bcrypt
✅ Session management dengan express-session
✅ Authentication middleware (@authRequired)
✅ Admin authorization (@adminRequired)
✅ Protected admin routes (reports, printer management)
```

### Backward Compatible

```javascript
⚠️ Field lama di Transaction (status) tetap ada
⚠️ Query existing code masih berjalan normal
⚠️ Payment dapat menggunakan field lama dan baru
```

---

## 🚀 Implementasi di Client

### Admin Login Page

Ubah dari hardcoded PIN ke backend login:

```typescript
// Sebelum (hardcoded)
if (pin === "1234") {
  localStorage.setItem("admin_auth", "true");
}

// Sesudah (proper auth)
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
});
const { user } = await response.json();
// Store session token / use cookies
```

### Admin Dashboard Setup

```typescript
// Check auth
useEffect(() => {
  fetch("/api/auth/me")
    .then((r) => r.json())
    .then((data) => {
      if (!data.success) logout();
      else setCurrentUser(data.user);
    });
}, []);

// Make authenticated requests
const getReports = async () => {
  const res = await fetch("/api/admin/reports");
  // Automatically include session cookie
};
```

---

## 📊 Report Enhancements

### Fields yang Sekarang Tersedia

```javascript
{
  (id,
    date,
    filename,
    pages,
    copies,
    colorMode, // ← Baru
    paperSize, // ← Baru
    printerName, // ← Baru
    amount,
    paymentStatus, // ← Baru (pending/paid/failed)
    paidAt, // ← Baru (timestamp pembayaran)
    username, // ← Baru (siapa/kiosk)
    status);
}
```

### Query Report by Date Range

```bash
GET /api/admin/reports?from=2024-02-01&to=2024-02-28
```

---

## 🔧 .env Configuration

Tambahkan:

```bash
# Session
SESSION_SECRET=your-secret-key-here

# Auth
NODE_ENV=development  # atau production
```

---

## ✅ Testing Checklist

- [x] Database migration berhasil
- [x] Auth service berjalan tanpa error
- [x] Payment service support printer settings
- [x] Session tracking userId dan settings
- [x] Permission middleware working
- [x] Report include printer & payment info
- [x] Backward compatibility maintained

---

## 📚 File yang Dibuat/Updated

### Service Files

- ✨ `server/src/services/auth.service.js` (NEW)
- 🔄 `server/src/services/payment.service.js`
- 🔄 `server/src/services/session.service.js`
- 🔄 `server/src/services/printer.service.js`

### Controller Files

- ✨ `server/src/controllers/auth.controller.js` (NEW)
- 🔄 `server/src/controllers/admin.controller.js`

### Routes Files

- ✨ `server/src/routes/auth.routes.js` (NEW)
- 🔄 `server/src/routes/admin.routes.js`
- 🔄 `server/src/routes/index.js`

### Middleware

- ✨ `server/src/middleware/auth.js` (NEW)

### Config

- 🔄 `server/src/app.js` (session setup)

### Schema

- 🔄 `server/schema.sql` (updated)
- 🔄 `server/prisma/schema.prisma` (updated)
- ✨ `server/prisma/migrations/001_add_user_and_enhance_tables.sql` (NEW)

---

## 🎯 Next Steps

1. **Frontend Update**: Update admin login page dari PIN ke username/password
2. **Payment Flow**: Pass `colorMode`, `copies`, `printerId` saat generate token
3. **User Tracking**: Assign `userId` ke session saat upload
4. **Printer Price Management**: Admin panel untuk manage printer pricing
5. **Session Persistence**: Handle session timeout & refresh

---

## 🐛 Debugging

### Check Database Status

```bash
docker exec oneprint_db mysql -u oneprint -poneprintpassword oneprint -e "SHOW TABLES; DESC User; DESC PrinterSettings;"
```

### Check Default Admin User

```bash
docker exec oneprint_db mysql -u oneprint -poneprintpassword oneprint -e "SELECT * FROM User;"
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}' \
  -c cookies.txt
```

---

**Date**: February 23, 2026  
**Status**: ✅ Complete & Tested
