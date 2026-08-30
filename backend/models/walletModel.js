const db = require('../config/db');

// Balance is always computed live from the ledger (SUM of credits minus
// SUM of debits) rather than stored as a single mutable column — this is
// the same "derive, don't cache" approach earningsModel.js already uses
// for revenue, and it means the balance can never drift out of sync with
// its own transaction history.
const getBalance = async (therapistId) => {
    const [[row]] = await db.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) AS balance
         FROM wallet_transactions
         WHERE therapist_id = ?`,
        [therapistId]
    );
    return Number(row.balance);
};

const getTransactionHistory = async (therapistId, limit = 25) => {
    const [rows] = await db.query(
        `SELECT id, type, amount, description, related_session_id, related_withdrawal_id, created_at
         FROM wallet_transactions
         WHERE therapist_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [therapistId, limit]
    );
    return rows;
};

const getWithdrawalHistory = async (therapistId, limit = 25) => {
    const [rows] = await db.query(
        `SELECT id, amount, account_holder_name, bank_name, account_number, branch_name, status, requested_at, processed_at
         FROM wallet_withdrawals
         WHERE therapist_id = ?
         ORDER BY requested_at DESC
         LIMIT ?`,
        [therapistId, limit]
    );
    return rows;
};

// Called when a session is marked completed (see prescriptionController.js
// savePrescription). Idempotent per session — if a credit for this session
// already exists (e.g. the therapist re-saves the prescription for an
// already-completed session), it won't double-credit the wallet.
const creditForCompletedSession = async (therapistId, sessionId, amount, description) => {
    if (!amount || Number(amount) <= 0) return; // nothing to credit — session had no fee on record

    const [[existing]] = await db.query(
        `SELECT id FROM wallet_transactions WHERE related_session_id = ? AND type = 'credit'`,
        [sessionId]
    );
    if (existing) return;

    await db.query(
        `INSERT INTO wallet_transactions (therapist_id, type, amount, description, related_session_id)
         VALUES (?, 'credit', ?, ?, ?)`,
        [therapistId, amount, description, sessionId]
    );
};

// Therapist redeems earnings — submits bank info, amount is deducted from
// the wallet immediately. Runs inside a transaction with a row lock on the
// wallet's own transaction rows so two concurrent redeem requests can't
// both pass the balance check and overdraw the wallet.
const requestWithdrawal = async (therapistId, amount, bankInfo) => {
    const { accountHolderName, bankName, accountNumber, branchName } = bankInfo;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [[row]] = await connection.query(
            `SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) AS balance
             FROM wallet_transactions WHERE therapist_id = ? FOR UPDATE`,
            [therapistId]
        );
        const balance = Number(row.balance);
        if (amount > balance) {
            await connection.rollback();
            const err = new Error('Redeem amount exceeds your available wallet balance.');
            err.statusCode = 400;
            throw err;
        }

        // Simplified scope: auto-processed on submission, no separate admin
        // settlement step (see migration 004 comments).
        const [withdrawal] = await connection.query(
            `INSERT INTO wallet_withdrawals
                (therapist_id, amount, account_holder_name, bank_name, account_number, branch_name, status, processed_at)
             VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())`,
            [therapistId, amount, accountHolderName, bankName, accountNumber, branchName || null]
        );

        await connection.query(
            `INSERT INTO wallet_transactions (therapist_id, type, amount, description, related_withdrawal_id)
             VALUES (?, 'debit', ?, ?, ?)`,
            [therapistId, amount, `Withdrawal to ${bankName} ••••${String(accountNumber).slice(-4)}`, withdrawal.insertId]
        );

        await connection.commit();
        return withdrawal.insertId;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getBalance,
    getTransactionHistory,
    getWithdrawalHistory,
    creditForCompletedSession,
    requestWithdrawal,
};
