import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export const OWNER_DISCORD_ID = "1079074717799030824";

export interface SecurityCheckParams {
  userId: string;
  userName?: string;
  ip?: string;
  fingerprint?: string;
  walletAddress?: string;
}

export type SecurityViolation = 'SCAMMER' | 'ALT';

export interface SecurityCheckResult {
  isBlocked: boolean;
  violation?: SecurityViolation; // 'SCAMMER' => "You Scammed!", 'ALT' => "You Alted!"
  reason?: string;
  matchedScammerId?: string;
  matchedAccountName?: string;
  detectionType?: 'HWID_FINGERPRINT' | 'WALLET_REUSE' | 'DIRECT_SCAMMER';
}

/**
 * Enterprise Anti-Alt Detection Engine
 * 1. Direct Scammer status check -> violation: 'SCAMMER'
 * 2. Scammer wallet reuse or scammer HWID match -> violation: 'SCAMMER'
 * 3. Non-scammer HWID alt match (user has another legitimate account) -> violation: 'ALT'
 */
export async function verifyUserSecurity(params: SecurityCheckParams): Promise<SecurityCheckResult> {
  const { userId, userName, fingerprint, walletAddress } = params;

  // 0. OWNER IMMUNITY: The owner (and test accounts run by the owner) is immune to alt checks
  const isOwner = userId === OWNER_DISCORD_ID || userName?.toLowerCase() === 'sotarium';
  if (isOwner) {
    return { isBlocked: false };
  }

  // 1. Direct Scammer Check: Is this user ID already marked as scammer?
  const { data: directScammer } = await supabase
    .from('loan_requests')
    .select('id, user_name, status')
    .eq('user_id', userId)
    .eq('status', 'scammer')
    .limit(1);

  if (directScammer && directScammer.length > 0) {
    return {
      isBlocked: true,
      violation: 'SCAMMER',
      detectionType: 'DIRECT_SCAMMER',
      reason: 'Your account is flagged for an unresolved default/scam.',
      matchedAccountName: directScammer[0].user_name,
    };
  }

  // 2. Fetch all known scammer records and their tagged security footprints
  const { data: scammerRecords } = await supabase
    .from('loan_requests')
    .select('id, user_id, user_name, reason, notes, status')
    .eq('status', 'scammer');

  const scammers = scammerRecords || [];

  // Check 3: Wallet Address Clustering & Reuse against Scammers
  if (walletAddress && walletAddress.trim()) {
    const cleanAddy = walletAddress.trim().toLowerCase();

    for (const scammer of scammers) {
      const scamReason = (scammer.reason || '').toLowerCase();
      const scamNotes = (scammer.notes || '').toLowerCase();

      if (scamReason.includes(cleanAddy) || scamNotes.includes(cleanAddy)) {
        return {
          isBlocked: true,
          violation: 'SCAMMER',
          detectionType: 'WALLET_REUSE',
          reason: 'This receiving crypto address is linked to an account flagged for loan default.',
          matchedScammerId: scammer.user_id,
          matchedAccountName: scammer.user_name,
        };
      }
    }
  }

  // Check 4: Deep HWID / Browser Fingerprint Matching
  if (fingerprint && fingerprint.trim() && fingerprint !== 'server_env') {
    const cleanFp = fingerprint.trim();

    // 4a. Check if this HWID was used by a SCAMMER
    for (const scammer of scammers) {
      const scamNotes = scammer.notes || '';
      if (scamNotes.includes(`[HWID:${cleanFp}]`)) {
        return {
          isBlocked: true,
          violation: 'SCAMMER',
          detectionType: 'HWID_FINGERPRINT',
          reason: 'Device hardware profile matches a flagged scammer account.',
          matchedScammerId: scammer.user_id,
          matchedAccountName: scammer.user_name,
        };
      }
    }

    // 4b. Check if this HWID belongs to ANY OTHER registered user in `users` table or `loan_requests`
    // (Ignore owner account so testing or using owner device doesn't trigger alt detection)
    const { data: dbUsers } = await supabase
      .from('users')
      .select('id, username, role')
      .neq('id', userId)
      .neq('id', OWNER_DISCORD_ID);

    if (dbUsers) {
      for (const u of dbUsers) {
        if (u.username?.toLowerCase() === 'sotarium') continue;
        const uRole = u.role || '';
        if (uRole.includes(`[HWID:${cleanFp}]`)) {
          // If the matching account is a scammer or has scammer status, treat as scammer
          return {
            isBlocked: true,
            violation: 'ALT',
            detectionType: 'HWID_FINGERPRINT',
            reason: 'You already have another account registered on this device.',
            matchedAccountName: u.username,
          };
        }
      }
    }

    // 4c. Check if this HWID belongs to another NON-SCAMMER account (Historical loans)
    const { data: allUsersLoans } = await supabase
      .from('loan_requests')
      .select('user_id, user_name, notes')
      .neq('user_id', userId)
      .neq('user_id', OWNER_DISCORD_ID)
      .neq('status', 'scammer');

    if (allUsersLoans) {
      for (const loan of allUsersLoans) {
        if (loan.user_name?.toLowerCase() === 'sotarium') continue;
        const notes = loan.notes || '';
        if (notes.includes(`[HWID:${cleanFp}]`)) {
          return {
            isBlocked: true,
            violation: 'ALT',
            detectionType: 'HWID_FINGERPRINT',
            reason: 'You already have another account associated with this device.',
            matchedAccountName: loan.user_name,
          };
        }
      }
    }
  }

  return { isBlocked: false };
}
