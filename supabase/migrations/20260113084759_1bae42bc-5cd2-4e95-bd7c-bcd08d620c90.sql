-- Пометить старые pending транзакции как expired (без updated_at)
UPDATE stars_transactions
SET status = 'expired',
    error_message = 'Transaction expired (older than 24h)'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours';