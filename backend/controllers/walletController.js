const WalletModel = require('../models/walletModel');
const NotificationModel = require('../models/notificationModel');

// GET /api/wallet/my
const getMyWallet = async (req, res) => {
    try {
        const therapistId = req.user.id;
        const [balance, transactions, withdrawals] = await Promise.all([
            WalletModel.getBalance(therapistId),
            WalletModel.getTransactionHistory(therapistId),
            WalletModel.getWithdrawalHistory(therapistId),
        ]);
        res.status(200).json({ success: true, data: { balance, transactions, withdrawals } });
    } catch (err) {
        console.error('Get wallet error:', err);
        res.status(500).json({ message: 'Server error fetching wallet.' });
    }
};

// POST /api/wallet/redeem
// Body: { amount, accountHolderName, bankName, accountNumber, branchName }
const redeem = async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { amount, accountHolderName, bankName, accountNumber, branchName } = req.body;

        const numericAmount = Number(amount);
        if (!numericAmount || numericAmount <= 0) {
            return res.status(400).json({ message: 'Enter a valid amount to redeem.' });
        }
        if (!accountHolderName?.trim() || !bankName?.trim() || !accountNumber?.trim()) {
            return res.status(400).json({ message: 'Account holder name, bank name, and account number are required.' });
        }

        const withdrawalId = await WalletModel.requestWithdrawal(therapistId, numericAmount, {
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            branchName: branchName?.trim() || null,
        });

        // Trigger in-app notification for the therapist
        try {
            const last4 = String(accountNumber).trim().slice(-4);
            await NotificationModel.createNotification(
                therapistId,
                `Your withdrawal of ৳${numericAmount.toLocaleString()} to ${bankName.trim()} (••••${last4}) was processed successfully.`,
                'wallet_withdrawal'
            );
        } catch (notifErr) {
            console.error('Failed to create withdrawal notification:', notifErr);
        }

        const balance = await WalletModel.getBalance(therapistId);
        res.status(200).json({ message: 'Redeemed successfully.', withdrawalId, balance });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error('Redeem wallet error:', err);
        res.status(500).json({ message: 'Server error processing your redeem request.' });
    }
};

module.exports = { getMyWallet, redeem };
