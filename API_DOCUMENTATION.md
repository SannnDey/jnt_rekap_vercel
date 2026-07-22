# 📡 JNT Rekap - API Documentation

Dokumentasi lengkap untuk semua API endpoints.

## Base URL

```
http://localhost:3000/api
```

## 🟢 Health Check

Check server status

### Request

```http
GET /health
```

### Response

```json
{
  "status": "OK",
  "timestamp": "2024-07-22T10:30:45.123Z",
  "uptime": 1234.567
}
```

---

## 🔵 Rekapan Outgoing Endpoints

### 1. Create Rekapan

Create new rekapan outgoing record.

**Request:**
```http
POST /api/rekapan
Content-Type: application/json

{
  "tanggal": "2024-01-15",
  "waybill": "WB-000001-ABCDE",
  "provinsi": "DKI Jakarta",
  "jenisBarang": "Electronics",
  "jumlahKoli": 5,
  "beratKg": 12.5,
  "ongkir": 50000,
  "asuransi": 10000,
  "packing": 5000,
  "metodePembayaran": "TRANSFER"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rekapan berhasil dibuat",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tanggalRekap": "2024-07-22T10:30:45.123Z",
    "tanggal": "2024-01-15T00:00:00.000Z",
    "waybill": "WB-000001-ABCDE",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 50000,
    "asuransi": 10000,
    "packing": 5000,
    "total": 65000,
    "metodePembayaran": "TRANSFER",
    "createdAt": "2024-07-22T10:30:45.123Z",
    "updatedAt": "2024-07-22T10:30:45.123Z"
  },
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validasi input gagal",
  "error": [
    {
      "path": "waybill",
      "message": "Waybill harus diisi",
      "code": "too_small"
    }
  ],
  "details": null,
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

### 2. Get All Rekapan

Retrieve all rekapan with pagination and filtering.

**Request:**
```http
GET /api/rekapan?page=1&limit=10&search=Jakarta&startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 10 | Items per page (max 100) |
| search | string | - | Search in waybill/provinsi/jenisBarang |
| startDate | date | - | Filter from date (YYYY-MM-DD) |
| endDate | date | - | Filter to date (YYYY-MM-DD) |

**Response (200):**
```json
{
  "success": true,
  "message": "Data rekapan berhasil diambil",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tanggalRekap": "2024-07-22T10:30:45.123Z",
      "tanggal": "2024-01-15T00:00:00.000Z",
      "waybill": "WB-000001-ABCDE",
      "provinsi": "DKI Jakarta",
      "jenisBarang": "Electronics",
      "jumlahKoli": 5,
      "beratKg": 12.5,
      "ongkir": 50000,
      "asuransi": 10000,
      "packing": 5000,
      "total": 65000,
      "metodePembayaran": "TRANSFER",
      "createdAt": "2024-07-22T10:30:45.123Z",
      "updatedAt": "2024-07-22T10:30:45.123Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

### 3. Get Rekapan by ID

Retrieve specific rekapan by UUID.

**Request:**
```http
GET /api/rekapan/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rekapan berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tanggalRekap": "2024-07-22T10:30:45.123Z",
    "tanggal": "2024-01-15T00:00:00.000Z",
    "waybill": "WB-000001-ABCDE",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 50000,
    "asuransi": 10000,
    "packing": 5000,
    "total": 65000,
    "metodePembayaran": "TRANSFER",
    "createdAt": "2024-07-22T10:30:45.123Z",
    "updatedAt": "2024-07-22T10:30:45.123Z"
  },
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Rekapan tidak ditemukan",
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

### 4. Update Rekapan

Update existing rekapan. All fields are optional.

**Request:**
```http
PUT /api/rekapan/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "ongkir": 55000,
  "asuransi": 12000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rekapan berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tanggalRekap": "2024-07-22T10:30:45.123Z",
    "tanggal": "2024-01-15T00:00:00.000Z",
    "waybill": "WB-000001-ABCDE",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 55000,
    "asuransi": 12000,
    "packing": 5000,
    "total": 72000,
    "metodePembayaran": "TRANSFER",
    "createdAt": "2024-07-22T10:30:45.123Z",
    "updatedAt": "2024-07-22T10:31:00.000Z"
  },
  "timestamp": "2024-07-22T10:31:00.000Z"
}
```

---

### 5. Delete Rekapan

Delete rekapan record.

**Request:**
```http
DELETE /api/rekapan/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rekapan berhasil dihapus",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tanggalRekap": "2024-07-22T10:30:45.123Z",
    "tanggal": "2024-01-15T00:00:00.000Z",
    "waybill": "WB-000001-ABCDE",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 50000,
    "asuransi": 10000,
    "packing": 5000,
    "total": 65000,
    "metodePembayaran": "TRANSFER",
    "createdAt": "2024-07-22T10:30:45.123Z",
    "updatedAt": "2024-07-22T10:30:45.123Z"
  },
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

### 6. Get Summary

Get statistics and summary data.

**Request:**
```http
GET /api/rekapan/summary?startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date | Filter from date (YYYY-MM-DD) |
| endDate | date | Filter to date (YYYY-MM-DD) |

**Response (200):**
```json
{
  "success": true,
  "message": "Summary data berhasil diambil",
  "data": {
    "totalCount": 50,
    "totalAmount": 3250000,
    "totalKoli": 250,
    "averageWeight": 25.5,
    "byMethod": [
      {
        "method": "TRANSFER",
        "count": 10,
        "total": 650000
      },
      {
        "method": "CASH",
        "count": 8,
        "total": 520000
      },
      {
        "method": "TF_CASH",
        "count": 12,
        "total": 780000
      },
      {
        "method": "PICKUP_ONLINE",
        "count": 15,
        "total": 975000
      },
      {
        "method": "BULANAN",
        "count": 5,
        "total": 325000
      }
    ]
  },
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

## 📝 Request Body Validation

### Valid `metodePembayaran` values:
- `TRANSFER`
- `CASH`
- `TF_CASH`
- `PICKUP_ONLINE`
- `BULANAN`

### Field Validation Rules:

| Field | Type | Rules |
|-------|------|-------|
| tanggal | Date | Required |
| waybill | String | Required, max 100 chars |
| provinsi | String | Required, max 100 chars |
| jenisBarang | String | Required, max 150 chars |
| jumlahKoli | Number | Required, must be > 0 |
| beratKg | Number | Required, must be > 0 |
| ongkir | Number | Required, must be >= 0 |
| asuransi | Number | Optional, must be >= 0 |
| packing | Number | Optional, must be >= 0 |
| metodePembayaran | String | Required, must be valid enum value |

---

## ❌ Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validasi input gagal",
  "error": [
    {
      "path": "beratKg",
      "message": "Berat harus > 0",
      "code": "too_small"
    }
  ],
  "details": null,
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Rekapan tidak ditemukan",
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

### 409 Conflict

```json
{
  "success": false,
  "message": "waybill sudah ada di database",
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error",
  "timestamp": "2024-07-22T10:30:45.123Z"
}
```

---

## 🧪 cURL Examples

### Create
```bash
curl -X POST http://localhost:3000/api/rekapan \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2024-01-15",
    "waybill": "WB-000001-ABC",
    "provinsi": "DKI Jakarta",
    "jenisBarang": "Electronics",
    "jumlahKoli": 5,
    "beratKg": 12.5,
    "ongkir": 50000,
    "asuransi": 10000,
    "packing": 5000,
    "metodePembayaran": "TRANSFER"
  }'
```

### Get All
```bash
curl "http://localhost:3000/api/rekapan?page=1&limit=10&search=Jakarta"
```

### Get by ID
```bash
curl "http://localhost:3000/api/rekapan/550e8400-e29b-41d4-a716-446655440000"
```

### Update
```bash
curl -X PUT http://localhost:3000/api/rekapan/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"ongkir": 55000}'
```

### Delete
```bash
curl -X DELETE http://localhost:3000/api/rekapan/550e8400-e29b-41d4-a716-446655440000
```

### Get Summary
```bash
curl "http://localhost:3000/api/rekapan/summary?startDate=2024-01-01&endDate=2024-01-31"
```

---

## 📚 Data Types

### DateTime Format
All dates are in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### UUID Format
All IDs are UUID v4: `550e8400-e29b-41d4-a716-446655440000`

### Currency
All currency values are in IDR (Indonesian Rupiah) as integers (no decimal)

---

**Last Updated**: July 22, 2024
