const GroupSessionModel = require('../models/groupSessionModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');

// ===== Therapist endpoints =====

const proposeSession = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { title, description, max_participants, start_time } = req.body;

        if (!title || !max_participants || !start_time) {
            return res.status(400).json({
                message: 'title, max_participants, and start_time are required.'
            });
        }

        const sessionId = await GroupSessionModel.proposeSession(
            therapistId, title, description || '', max_participants, start_time
        );

        res.status(201).json({
            success: true,
            message: 'Group session proposal submitted. Awaiting admin approval.',
            sessionId
        });
    } catch (err) {
        console.error('Propose session error:', err);
        res.status(500).json({ message: 'Server error while proposing session.' });
    }
};

const myProposals = async (req, res) => {
    try {
        const rows = await GroupSessionModel.getSessionsByTherapist(req.user.id);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get my proposals error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const enrolledPatients = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await GroupSessionModel.getEnrolledPatients(id, req.user.id);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get enrolled patients error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAttendance = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { attended } = req.body;

        const affected = await GroupSessionModel.markAttendance(
            enrollmentId, req.user.id, !!attended
        );

        if (affected === 0) {
            return res.status(404).json({
                message: 'Enrollment not found or you do not own this session.'
            });
        }

        res.status(200).json({ message: 'Attendance updated.' });
    } catch (err) {
        console.error('Mark attendance error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const writeNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        if (!notes || !notes.trim()) {
            return res.status(400).json({ message: 'Notes cannot be empty.' });
        }

        const affected = await GroupSessionModel.writeSessionNotes(id, req.user.id, notes);

        if (affected === 0) {
            return res.status(404).json({
                message: 'Session not found or you do not own this session.'
            });
        }

        res.status(200).json({ message: 'Session notes saved and marked completed.' });
    } catch (err) {
        console.error('Write notes error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== Admin endpoints =====
// NOTE: Your admin dashboard currently calls a separate raw-SQL Express
// router (the one with `router.get('/groups/proposals', ...)`) instead of
// these controller functions below. These are kept here for completeness /
// in case you consolidate later, but they are not currently wired to any
// route that's actively used by AdminGroupApprovals.jsx.

const pendingProposals = async (req, res) => {
    try {
        const rows = await GroupSessionModel.getPendingProposals();
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get pending proposals error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const allProposals = async (req, res) => {
    try {
        const rows = await GroupSessionModel.getAllProposals();
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get all proposals error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const approveProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await GroupSessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({ message: 'Proposal not found.' });
        }

        await GroupSessionModel.setProposalStatus(id, 'approved');

        await NotificationModel.createNotification(
            session.therapist_id,
            `Your group session "${session.topic}" has been approved and is now visible to patients.`,
            'group_session_update'
        );

        res.status(200).json({ message: 'Proposal approved.' });
    } catch (err) {
        console.error('Approve proposal error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const rejectProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await GroupSessionModel.getSessionById(id);

        if (!session) {
            return res.status(404).json({ message: 'Proposal not found.' });
        }

        await GroupSessionModel.setProposalStatus(id, 'rejected');

        await NotificationModel.createNotification(
            session.therapist_id,
            `Your group session proposal "${session.topic}" was not approved.`,
            'group_session_update'
        );

        res.status(200).json({ message: 'Proposal rejected.' });
    } catch (err) {
        console.error('Reject proposal error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== Patient endpoints =====

const openSessions = async (req, res) => {
    try {
        const rows = await GroupSessionModel.getOpenSessions();
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get open sessions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const joinSession = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { id } = req.params;

        const session = await GroupSessionModel.getSessionById(id);
        if (!session || session.status !== 'approved') {
            return res.status(400).json({ message: 'This session is not open for joining.' });
        }

        const currentCount = await GroupSessionModel.countEnrolled(id);
        if (currentCount >= session.capacity) {
            return res.status(400).json({ message: 'This session is already full.' });
        }

        await GroupSessionModel.requestToJoin(id, patientId);

        const patient = await UserModel.findById(patientId);
        await NotificationModel.createNotification(
            session.therapist_id,
            `${patient?.display_name || 'A patient'} requested to join "${session.topic}".`,
            'group_session_join'
        );

        res.status(201).json({ message: 'Join request sent successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'You have already requested to join this session.' });
        }
        console.error('Join session error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const myEnrollments = async (req, res) => {
    try {
        const rows = await GroupSessionModel.getPatientEnrollments(req.user.id);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('Get my enrollments error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    proposeSession,
    myProposals,
    enrolledPatients,
    markAttendance,
    writeNotes,
    pendingProposals,
    allProposals,
    approveProposal,
    rejectProposal,
    openSessions,
    joinSession,
    myEnrollments
};