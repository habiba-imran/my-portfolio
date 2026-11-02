// All admission/accounting mutations run atomically in Redis. These are global
// maximum-session-time reservations, not per-visitor attempts or billing data.
export const BUDGET_TTL_SECONDS = 26 * 60 * 60;

export const RESERVE_VOICE_SESSION = `
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[9]) then return 'BUSY' end
if redis.call('ZCARD', KEYS[2]) >= 1 then return 'ONE_ACTIVE' end
local used = tonumber(redis.call('HGET', KEYS[4], 'used') or '0')
local reserved = tonumber(redis.call('HGET', KEYS[4], 'reserved') or '0')
local seconds = tonumber(ARGV[10])
if used + reserved + seconds > tonumber(ARGV[11]) then return 'BUDGET' end
redis.call('HINCRBY', KEYS[4], 'reserved', seconds)
redis.call('EXPIRE', KEYS[4], ARGV[8])
redis.call('ZADD', KEYS[1], ARGV[2], ARGV[4])
redis.call('ZADD', KEYS[2], ARGV[2], ARGV[4])
redis.call('HSET', KEYS[3], 'room', ARGV[5], 'identity', ARGV[6], 'controlHash', ARGV[7],
  'ipKey', KEYS[2], 'hardExpiry', ARGV[3], 'budgetKey', KEYS[4],
  'budgetSeconds', seconds, 'usageState', 'reserved')
return 'OK'
`;

export const COMMIT_VOICE_BUDGET = `
if redis.call('HGET', KEYS[1], 'usageState') ~= 'reserved' then return 0 end
local budget = redis.call('HGET', KEYS[1], 'budgetKey')
local seconds = tonumber(redis.call('HGET', KEYS[1], 'budgetSeconds') or '0')
if not budget or redis.call('EXISTS', budget) == 0 then return 0 end
redis.call('HINCRBY', budget, 'reserved', -seconds)
redis.call('HINCRBY', budget, 'used', seconds)
redis.call('HSET', KEYS[1], 'usageState', 'committed')
return 1
`;

const REFUND = `
local budget = redis.call('HGET', KEYS[2], 'budgetKey')
local state = redis.call('HGET', KEYS[2], 'usageState')
local seconds = tonumber(redis.call('HGET', KEYS[2], 'budgetSeconds') or '0')
if budget and redis.call('EXISTS', budget) == 1 then
  if state == 'reserved' then redis.call('HINCRBY', budget, 'reserved', -seconds) end
  if state == 'committed' and ARGV[2] == 'failed' then redis.call('HINCRBY', budget, 'used', -seconds) end
end
`;

// An ambiguous dispatch failure refunds the visitor's unused allocation, while
// retaining both concurrency locks until room cleanup is positively confirmed.
export const REFUND_FAILED_VOICE_BUDGET = `
${REFUND}
if state then redis.call('HSET', KEYS[2], 'usageState', 'failed') end
return 1
`;

export const RELEASE_VOICE_RESERVATION = `
${REFUND}
local ipKey = redis.call('HGET', KEYS[2], 'ipKey')
redis.call('ZREM', KEYS[1], ARGV[1])
if ipKey then
  redis.call('ZREM', ipKey, ARGV[1])
  if redis.call('ZCARD', ipKey) == 0 then redis.call('DEL', ipKey) end
end
redis.call('DEL', KEYS[2])
return 1
`;
