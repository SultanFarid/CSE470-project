-- ============================================================================
-- Migration 004: Prescription Follow-Up + Therapist Wallet
--
-- Run once against the existing database:
--   mysql -u <user> -p smart_therapy_db < backend/migrations/004_followup_and_wallet.sql
--
-- What this enables:
--   1. A therapist can recommend a follow-up date/notes when writing a
--      prescription (Feature 12 extension). The patient can accept or
--      decline it from their dashboard; accepting notifies the therapist
--      (reuses the existing `notifications` table/model — no new table
--      needed for that part).
--   2. A real wallet for therapists, computed as a ledger (credits/debits)
--      rather than a single cached balance column — this avoids balance
--      drift bugs and mirrors how `earningsModel.js` already computes
--      revenue live from `sessions`. A session completing credits the
--      wallet; a withdrawal request debits it.
--   3. `wallet_withdrawals` stores the bank info the therapist submits to
--      redeem earnings. To keep scope reasonable for this project, a
--      withdrawal is auto-processed the moment it's requested (no separate
--      admin settlement step) — status is kept as a column so that could be
--      changed later without a schema migration.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Defensive fix: real bookings (BookingModal -> appointmentController ->
--    AppointmentModel.create) never set `sessions.fee`, so every
--    patient-booked session has fee = NULL and silently contributes $0 to
--    earnings. This backfills existing NULL fees from the therapist's
--    current listed consultation fee so historical data isn't stuck at $0.
--    (The application-level fix — snapshotting the fee at booking time — is
--    in backend/models/appointmentModel.js.)
-- ----------------------------------------------------------------------------
UPDATE `sessions` s
JOIN `therapist_profiles` tp ON tp.user_id = s.therapist_id
SET s.fee = tp.consultation_fee
WHERE s.fee IS NULL AND tp.consultation_fee IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 1. Follow-up fields on prescriptions.
-- ----------------------------------------------------------------------------
ALTER TABLE `prescriptions`
    ADD COLUMN IF NOT EXISTS `follow_up_recommended` tinyint(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS `follow_up_date` date DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `follow_up_notes` text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `follow_up_status` enum('none','proposed','accepted','declined') NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS `follow_up_responded_at` timestamp NULL DEFAULT NULL;

-- ----------------------------------------------------------------------------
-- 2. Wallet ledger — every credit (session completed) and debit (withdrawal)
--    for a therapist. Balance = SUM(credit) - SUM(debit), computed live.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `therapist_id` int(11) NOT NULL,
  `type` enum('credit','debit') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `related_session_id` int(11) DEFAULT NULL,
  `related_withdrawal_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_wallet_tx_therapist` (`therapist_id`),
  KEY `idx_wallet_tx_session` (`related_session_id`),
  CONSTRAINT `fk_wtx_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wtx_session` FOREIGN KEY (`related_session_id`) REFERENCES `sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------------------------------------------------------
-- 3. Withdrawal requests — the bank info the therapist submits to redeem.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_withdrawals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `therapist_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `account_holder_name` varchar(150) NOT NULL,
  `bank_name` varchar(150) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `branch_name` varchar(150) DEFAULT NULL,
  `status` enum('pending','completed','rejected') NOT NULL DEFAULT 'completed',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_withdrawals_therapist` (`therapist_id`),
  CONSTRAINT `fk_wd_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `wallet_transactions`
    ADD CONSTRAINT IF NOT EXISTS `fk_wtx_withdrawal` FOREIGN KEY (`related_withdrawal_id`) REFERENCES `wallet_withdrawals` (`id`) ON DELETE SET NULL;
