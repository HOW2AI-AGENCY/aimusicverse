# Telegram Bot Monitoring & Alerts

## Overview

The Telegram bot includes a comprehensive monitoring system that tracks:
- **Delivery Rate**: Success/failure rate for messages, audio, photos
- **Error Rate**: Failed operations with error details
- **Response Time**: Average API call latency
- **Rate Limiting**: Blocked requests due to spam protection

## Metrics Database

All metrics are stored in `telegram_bot_metrics` table:

```sql
telegram_bot_metrics (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),  -- 'message_sent', 'audio_failed', etc.
  success BOOLEAN,
  user_id UUID,
  telegram_chat_id BIGINT,
  error_message TEXT,
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP
)
```

## Event Types

| Event Type | Description |
|------------|-------------|
| `message_sent` | Text message delivered successfully |
| `message_failed` | Text message delivery failed |
| `audio_sent` | Audio file delivered successfully |
| `audio_failed` | Audio file delivery failed |
| `photo_sent` | Photo delivered successfully |
| `photo_failed` | Photo delivery failed |
| `callback_processed` | Callback query handled |
| `callback_failed` | Callback query error |
| `notification_sent` | Push notification delivered |
| `notification_failed` | Push notification failed |
| `inline_query_processed` | Inline query handled |
| `rate_limited` | Request blocked by rate limiter |

## API Endpoints

### Health Check
```
GET /telegram-bot/health
```

### Metrics Dashboard
```
GET /telegram-bot/metrics?period=24%20hours
```

Response:
```json
{
  "metrics": {
    "total_events": 1250,
    "successful_events": 1200,
    "failed_events": 50,
    "success_rate": 96.00,
    "avg_response_time_ms": 342.50,
    "events_by_type": {
      "message_sent": 800,
      "audio_sent": 350,
      "message_failed": 30,
      "audio_failed": 20
    }
  },
  "alerts": {
    "shouldAlert": false,
    "metrics": {
      "successRate": 96.00,
      "errorCount": 50,
      "avgResponseTime": 342.50
    }
  },
  "timestamp": "2025-12-05T12:00:00.000Z"
}
```

## Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 10% | Warning alert |
| Error Count | > 50/hour | Warning alert |
| Avg Response Time | > 5000ms | Performance alert |

## Database Function

Get aggregated metrics for any time period:

```sql
SELECT * FROM get_telegram_bot_metrics('24 hours'::interval);
SELECT * FROM get_telegram_bot_metrics('1 hour'::interval);
SELECT * FROM get_telegram_bot_metrics('7 days'::interval);
```

## Implementation Details

### Buffered Writes
Metrics are buffered in memory and flushed:
- When buffer reaches 10 events
- On any error (immediate flush)
- After 5 seconds of inactivity
- At the end of each request

### Performance Impact
- ~1ms overhead per tracked operation
- Batch inserts minimize database load
- Async processing doesn't block main flow

## Querying Metrics

### Get hourly error rate
```sql
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE success = false) as errors,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE success = false)::numeric / COUNT(*) * 100, 2) as error_rate
FROM telegram_bot_metrics
WHERE created_at >= now() - interval '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour DESC;
```

### Get slowest operations
```sql
SELECT 
  event_type,
  AVG(response_time_ms) as avg_time,
  MAX(response_time_ms) as max_time,
  COUNT(*) as count
FROM telegram_bot_metrics
WHERE created_at >= now() - interval '24 hours'
GROUP BY event_type
ORDER BY avg_time DESC;
```

### Get most common errors
```sql
SELECT 
  error_message,
  COUNT(*) as count
FROM telegram_bot_metrics
WHERE success = false
  AND created_at >= now() - interval '24 hours'
GROUP BY error_message
ORDER BY count DESC
LIMIT 10;
```
