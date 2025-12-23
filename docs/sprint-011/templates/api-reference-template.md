# [API Feature Name] - API Reference

**Version**: 1.0  
**Last Updated**: YYYY-MM-DD  
**Audience**: Developers

---

## 📋 Overview

[Brief description of the API feature, what it does, and what problems it solves]

**Example**: "The Social API provides endpoints for managing user profiles, following relationships, and social interactions within MusicVerse AI."

---

## 🔐 Authentication & Authorization

### Authentication Method
```typescript
// Supabase authentication required
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await supabase.auth.signInWithOAuth({ provider: 'telegram' });
```

### Required Permissions
- **Read**: `authenticated` role
- **Write**: `authenticated` role + RLS policies
- **Admin**: `service_role` or admin flag

---

## 📡 Endpoints / Functions

### Endpoint 1: [Name]

**Purpose**: [What this endpoint does]

#### Request
```typescript
// Method: GET | POST | PUT | DELETE
// Path: /api/v1/[endpoint-path]

interface RequestParams {
  param1: string;  // Description
  param2: number;  // Description
  param3?: boolean; // Optional, description
}

// Example
const response = await fetch('/api/v1/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    param1: 'value',
    param2: 123
  })
});
```

#### Response
```typescript
interface ResponseData {
  success: boolean;
  data: {
    field1: string;
    field2: number;
  };
  error?: string;
}

// Example
{
  "success": true,
  "data": {
    "field1": "example value",
    "field2": 42
  }
}
```

#### Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

### Endpoint 2: [Name]

[Repeat structure for each endpoint]

---

## 🔄 Real-time Subscriptions

### Subscribe to [Event]

**Purpose**: [What this subscription provides]

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';

// Subscribe to channel
const channel: RealtimeChannel = supabase
  .channel('channel-name')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'table_name',
      filter: 'column=eq.value'
    },
    (payload) => {
      console.log('New data:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe when done
await supabase.removeChannel(channel);
```

**Events Available**:
- `INSERT` - New record created
- `UPDATE` - Record updated
- `DELETE` - Record deleted
- `*` - All events

---

## 🛡️ Row Level Security (RLS)

### Policy 1: [Name]

**Purpose**: [What this policy enforces]

```sql
-- Policy definition
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (
    -- Condition
    auth.uid() = user_id
  );
```

**Effect**: [Explain what this policy allows/denies]

---

## ⚠️ Error Handling

### Common Errors

#### Error: `PERMISSION_DENIED`
```json
{
  "error": "PERMISSION_DENIED",
  "message": "You do not have permission to access this resource",
  "code": 403
}
```
**Solution**: Check authentication token and user permissions.

#### Error: `VALIDATION_ERROR`
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input parameters",
  "details": {
    "param1": "Required field missing"
  },
  "code": 400
}
```
**Solution**: Verify all required parameters are provided and valid.

---

## 🚦 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/endpoint1` | 100 requests | per minute |
| `/api/v1/endpoint2` | 10 requests | per minute |
| Real-time channels | 20 channels | per connection |

**Rate limit headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
```

**When rate limited**:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retry_after": 60,
  "code": 429
}
```

---

## 💻 Code Examples

### Example 1: [Use Case]

```typescript
// Complete example showing typical usage
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(/* config */);

async function exampleFunction() {
  try {
    // Step 1: Authenticate
    const { data: authData } = await supabase.auth.signIn(/* ... */);
    
    // Step 2: Make API call
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('column', 'value');
    
    if (error) throw error;
    
    // Step 3: Process data
    console.log('Result:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Example 2: [Use Case]

```typescript
// Another complete example
```

---

## 🧪 Testing

### Using cURL
```bash
# Example cURL command
curl -X POST https://api.musicverse.ai/v1/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "param1": "value",
    "param2": 123
  }'
```

### Using Postman
1. Import collection: [Link to Postman collection]
2. Set environment variables
3. Run requests

---

## 📚 TypeScript Types

```typescript
// Key type definitions
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FollowRelationship {
  follower_id: string;
  followed_id: string;
  created_at: string;
}

// Add all relevant types
```

---

## 🔗 Related Documentation

- [Main API Reference](./README.md)
- [Authentication Guide](./auth.md)
- [Real-time Guide](./realtime.md)
- [Database Schema](../diagrams/schema.md)

---

## 📞 Support

For API questions or issues:
- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Developer Discord**: [Link]
- **Email**: dev@musicverse.ai

---

**Last Updated**: [Date]  
**Version**: 1.0
