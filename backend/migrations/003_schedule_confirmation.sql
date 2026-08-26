-- ============================================================================
-- Migration 003: Weekly Schedule Confirmation + Reminder Nudges
--
-- Run once against the existing database:
--   mysql -u <user> -p smart_therapy_db < backend/migrations/003_schedule_confirmation.sql
--
-- What this enables:
--   - Every time a therapist saves their weekly schedule (ScheduleManager),
--     we now stamp `last_confirmed_at`. That stamp is how we know whether
--     they've reconfirmed their schedule recently.
--   - A weekend cron job (see backend/jobs/scheduleConfirmationReminderJob.js)
--     nudges any therapist whose stamp is stale (or missing) to fix next
--     week's schedule, once a day, every day of the weekend, until they do.
-- ============================================================================

ALTER TABLE `therapist_schedule_settings`
    ADD COLUMN IF NOT EXISTS `last_confirmed_at` timestamp NULL DEFAULT NULL
    COMMENT 'Stamped every time the therapist saves ScheduleManager — treated as "I confirm this is my schedule".';
