# Admin API Endpoints

This document describes the admin API endpoints available in the Create Studio admin portal.

## Authentication

All admin API endpoints require authentication. The middleware checks for a valid admin session using `getUserSession(event)`. If the session is invalid or missing, a 401 Unauthorized error is returned.

## Endpoints

### Dashboard

#### GET /api/admin/dashboard/stats

Returns dashboard metrics for the admin portal.

**Authentication**: Required

**Response**:
```json
{
  "totalUsers": 1234,
  "totalSites": 567,
  "totalSubscriptions": 89,
  "newUsersLast7Days": 45,
  "newUsersLast30Days": 123,
  "verifiedSites": 456,
  "unverifiedSites": 111,
  "mrr": 890
}
```

**Metrics**:
- `totalUsers`: Total count of all users
- `totalSites`: Total count of all sites
- `totalSubscriptions`: Total count of all subscriptions
- `newUsersLast7Days`: Users created in the last 7 days
- `newUsersLast30Days`: Users created in the last 30 days
- `verifiedSites`: Sites with verified SiteUsers entries
- `unverifiedSites`: Sites without verification
- `mrr`: Monthly Recurring Revenue (active pro subscriptions × $10)

---

### Users

#### GET /api/admin/users

Returns a paginated list of users with search and filtering capabilities.

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 20, max: 100): Number of items per page
- `search` (string, optional): Search term for email, firstname, or lastname
- `filter` (string, optional): Filter type
  - `verified`: Only users with verified email
  - `has_sites`: Only users with at least one site

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "validEmail": true,
      "mediavine_publisher": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-20T14:45:00Z",
      "sitesCount": 3,
      "hasActiveSubscription": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "totalPages": 62
  }
}
```

**Examples**:
- `/api/admin/users?page=2&limit=50` - Get page 2 with 50 items
- `/api/admin/users?search=john` - Search for "john" in email/name
- `/api/admin/users?filter=verified` - Only verified users
- `/api/admin/users?search=example.com&filter=has_sites` - Combined filters

---

#### GET /api/admin/users/[id]

Returns detailed information about a specific user.

**Authentication**: Required

**Parameters**:
- `id` (number): User ID

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "avatar": "https://...",
  "validEmail": true,
  "mediavine_publisher": false,
  "marketing_opt_in": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-20T14:45:00Z",
  "sites": [
    {
      "id": 10,
      "name": "My Recipe Site",
      "url": "https://example.com",
      "createdAt": "2025-01-16T09:00:00Z",
      "verifiedAt": "2025-01-16T10:15:00Z",
      "role": "owner",
      "isVerified": true,
      "versions": {
        "create": "4.0.0",
        "wordpress": "6.4.2"
      },
      "subscription": {
        "siteId": 10,
        "status": "active",
        "tier": "pro",
        "current_period_start": "2025-01-01T00:00:00Z",
        "current_period_end": "2025-02-01T00:00:00Z",
        "cancel_at_period_end": false
      }
    }
  ],
  "auditLogSummary": {
    "totalActions": 5,
    "lastAction": {
      "action": "update",
      "timestamp": "2025-01-25T11:30:00Z"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid user ID format
- `404 Not Found`: User does not exist

---

### Audit Logs

#### GET /api/admin/audit-logs

Returns a paginated list of audit logs with filtering capabilities.

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 20, max: 100): Number of items per page
- `admin_id` (number, optional): Filter by admin user ID
- `action` (string, optional): Filter by action type (e.g., "create", "update", "delete")
- `entity_type` (string, optional): Filter by entity type (e.g., "user", "site", "subscription")
- `date_from` (string ISO date, optional): Filter logs from this date
- `date_to` (string ISO date, optional): Filter logs until this date

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "admin_id": 5,
      "adminName": "Jane Admin",
      "adminEmail": "jane@createstudio.com",
      "action": "update",
      "entity_type": "user",
      "entity_id": 123,
      "changes": {
        "before": { "validEmail": false },
        "after": { "validEmail": true }
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "createdAt": "2025-01-25T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5678,
    "totalPages": 284
  },
  "filters": {
    "admin_id": 5,
    "action": "update",
    "entity_type": "user",
    "date_from": "2025-01-01",
    "date_to": "2025-01-31"
  }
}
```

**Examples**:
- `/api/admin/audit-logs?admin_id=5` - All actions by admin 5
- `/api/admin/audit-logs?action=delete` - All delete actions
- `/api/admin/audit-logs?entity_type=subscription` - All subscription-related actions
- `/api/admin/audit-logs?date_from=2025-01-01&date_to=2025-01-31` - January logs
- `/api/admin/audit-logs?admin_id=5&action=update&entity_type=user` - Combined filters

**Notes**:
- Logs are ordered by `createdAt` DESC (most recent first)
- The `changes` field is automatically parsed from JSON string to object
- Admin name is joined from the `admins` table

---

## Error Handling

All endpoints use consistent error responses:

**401 Unauthorized**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": "Invalid user ID"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

**500 Internal Server Error**:
```json
{
  "statusCode": 500,
  "message": "Failed to fetch users"
}
```

---

## Database Schema

These endpoints query the following tables:

- `users`: User accounts
- `sites`: WordPress sites
- `siteUsers`: Many-to-many pivot table for site verification
- `subscriptions`: Site subscriptions
- `admins`: Admin user accounts
- `auditLogs`: Admin action audit trail

For detailed schema information, see `/packages/app/server/db/schema.ts`.
