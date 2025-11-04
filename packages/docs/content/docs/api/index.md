---
title: API Reference
description: Server API endpoints documentation
---

# API Reference

Documentation for Create Studio server API endpoints.

## Available Endpoints

### Nutrition API

Calculate recipe nutrition using API Ninjas Nutrition API.

- **Endpoint**: `POST /api/v1/nutrition/recipe`
- **Authentication**: Required (JWT)
- **Rate Limit**: 15 requests per 5 minutes

[View Nutrition API Documentation →](/docs/api/nutrition)

## Authentication

All API endpoints require authentication via JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

## Base URL

### Development
```
http://localhost:3000
```

### Production
```
https://your-domain.com
```

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

Most endpoints implement rate limiting to prevent abuse:

- Limits are tracked per user (based on email from JWT)
- Rate limit windows are typically 5 minutes
- When exceeded, returns `429` status code

## Content Type

All POST/PUT requests should include:

```http
Content-Type: application/json
```

## CORS

API endpoints support CORS for cross-origin requests from authorized domains.
