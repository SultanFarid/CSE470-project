const express = require('express');
const router = express.Router();
const db = require('../config/db'); // আপনার ডাটাবেজ কানেকশনের সঠিক পাথ

// GET: /api/admin/groups/proposals
router.get('/groups/proposals', async (req, res) => {
  try {
    const { status } = req.query;

    // u.name এর জায়গায় u.display_name ব্যবহার করা হয়েছে
    let sql = `
      SELECT 
        gs.id,
        gs.topic AS title,
        gs.description,
        gs.capacity AS max_participants,
        gs.scheduled_at AS start_time,
        gs.status,
        gs.created_at,
        COALESCE(u.display_name, 'Therapist') AS therapist_name
      FROM group_sessions gs
      LEFT JOIN users u ON gs.therapist_id = u.id
    `;

    const queryParams = [];

    // status প্যারামিটার থাকলে এবং তা 'all' না হলে ফিল্টার করবে
    if (status && status !== 'all'&& status.trim() !== '') {
      sql += ` WHERE gs.status = ?`;
      queryParams.push(status);
    }

    sql += ` ORDER BY gs.created_at DESC`;

    const [rows] = await db.query(sql, queryParams);

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Fetch Proposals Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve Route: /api/admin/groups/proposals/:id/approve
router.patch('/groups/proposals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE group_sessions SET status = 'approved' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Group session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Group session proposal approved successfully!"
    });
  } catch (error) {
    console.error("Approve Proposal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reject Route: /api/admin/groups/proposals/:id/reject
router.patch('/groups/proposals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `UPDATE group_sessions SET status = 'rejected' WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Group session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Group session proposal rejected successfully!"
    });
  } catch (error) {
    console.error("Reject Proposal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;