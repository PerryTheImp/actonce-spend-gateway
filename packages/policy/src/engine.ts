import { type SpendRequest, type SpendDecision, type PolicyConfig } from '@actonce/types';

export interface PolicyEvaluationResult {
  decision: SpendDecision;
  policyMatched: string;
  policyReason: string;
}

export function evaluatePolicy(request: SpendRequest, policy: PolicyConfig): PolicyEvaluationResult {
  const { amount, currency, merchant, category, timestamp } = request;

  // Step 1: Default mode for unknown agent/task
  if (policy.default_mode === 'block') {
    return { decision: 'REJECTED', policyMatched: 'default_block', policyReason: 'Default policy is to block all requests' };
  }

  // Step 2: Blocked merchant check
  if (policy.blocked_merchants.length > 0 && policy.blocked_merchants.includes(merchant)) {
    return { decision: 'REJECTED', policyMatched: 'blocked_merchant', policyReason: `Merchant ${merchant} is blocked` };
  }

  // Step 3: Blocked category check
  if (category && policy.blocked_categories.length > 0 && policy.blocked_categories.includes(category)) {
    return { decision: 'REJECTED', policyMatched: 'blocked_category', policyReason: `Category ${category} is blocked` };
  }

  // Step 4: Max single purchase limit
  if (amount > policy.max_single_purchase) {
    return { decision: 'REJECTED', policyMatched: 'max_single_purchase_exceeded', policyReason: `Amount ${amount} exceeds max single purchase limit of ${policy.max_single_purchase}` };
  }

  // Step 5: Allowed merchants (if list exists, merchant must be in it)
  if (policy.allowed_merchants.length > 0 && !policy.allowed_merchants.includes(merchant)) {
    return { decision: 'REJECTED', policyMatched: 'merchant_not_allowed', policyReason: `Merchant ${merchant} is not in the allowed merchants list` };
  }

  // Step 6: Require human approval above threshold
  if (amount > policy.require_human_approval_above) {
    return { decision: 'REQUIRES_APPROVAL', policyMatched: 'amount_above_threshold', policyReason: `Amount ${amount} exceeds auto-approval limit of ${policy.require_human_approval_above}` };
  }

  // Step 7: Always require approval for categories
  if (category && policy.always_require_approval_for.includes(category)) {
    return { decision: 'REQUIRES_APPROVAL', policyMatched: 'category_requires_approval', policyReason: `Category ${category} always requires human approval` };
  }

  // Step 8: Duplicate check (handled by dedupe module, skip here)

  // Step 9: Time window check (handled by dedupe/daily limits)

  // Step 10: Allowed hours check
  const hourCheck = checkAllowedHours(timestamp || new Date(), policy);
  if (!hourCheck.allowed) {
    return { decision: 'REQUIRES_APPROVAL', policyMatched: 'outside_allowed_hours', policyReason: `Current time is outside allowed hours (${policy.allowed_hours.start} - ${policy.allowed_hours.end} ${policy.timezone})` };
  }

  // Step 11: All clear
  return { decision: 'APPROVED', policyMatched: 'all_checks_passed', policyReason: 'All policy checks passed' };
}

function checkAllowedHours(now: Date, policy: PolicyConfig): { allowed: boolean } {
  const [startHour, startMin] = policy.allowed_hours.start.split(':').map(Number);
  const [endHour, endMin] = policy.allowed_hours.end.split(':').map(Number);

  // Get current hour/minute in the policy timezone
  const timeInZone = new Intl.DateTimeFormat('en-GB', {
    timeZone: policy.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  const [currentHour, currentMin] = timeInZone.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    return { allowed: currentMinutes >= startMinutes && currentMinutes <= endMinutes };
  } else {
    // Overnight window (e.g., 20:00 - 08:00)
    return { allowed: currentMinutes >= startMinutes || currentMinutes <= endMinutes };
  }
}
