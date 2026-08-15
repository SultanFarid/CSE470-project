import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Calendar, CheckCircle, Clock, Play, User, Star, Search, 
  Users, LogOut, ArrowRight, Settings, Heart, Sliders, MapPin, 
  Globe, Phone, Video, ShieldAlert, Plus, CheckSquare, BarChart2, Check
} from 'lucide-react';
import './PatientDashboard.css';
import { 
  getPatientProfile, updatePatientProfile, uploadPatientPhoto, SERVER_BASE_URL,
  getPatientTasks, createPatientTask, deletePatientTask, getTherapistDirectory,
  getAppointments, bookAppointment, cancelAppointment, getTherapistSlots, getEffectiveAvailability,
  submitReview, getPendingReview, getAllTherapistReviewSummaries,
  patientGetOpenGroupSessions, patientJoinGroupSession, patientGetMyEnrollments
} from '../../services/api';

import ActiveAppointmentCard from './ActiveAppointmentCard';
import EditProfileModal from './EditProfileModal';
import VitalsModal from './VitalsModal';
import TherapistDirectoryModal from './TherapistDirectoryModal';
import BookingModal from './BookingModal';
import TasksModal from './TasksModal';
import ReviewFeedbackModal from './ReviewFeedbackModal';
import NotificationBell from '../shared/NotificationBell';

const parseVideoUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }
  return { type: 'file', url };
};

const getDueInfo = (dueDate, dueTime) => {
  if (!dueDate) return { label: dueTime || 'No due date', status: 'normal' };
  const todayStr = new Date().toISOString().slice(0, 10);
  let status = 'normal';
  if (dueDate === todayStr) status = 'today';
  else if (dueDate < todayStr) status = 'overdue';

  let label;
  if (status === 'today') {
    label = dueTime ? `DUE TODAY · ${dueTime}` : 'DUE TODAY';
  } else if (status === 'overdue') {
    label = dueTime ? `OVERDUE · ${dueDate}` : `OVERDUE · ${dueDate}`;
  } else {
    label = dueTime ? `${dueDate} · ${dueTime}` : dueDate;
  }
  return { label, status };
};

const CONCERN_OPTIONS = [
  "Anxiety", "Depression", "Stress & Burnout", "Relationship Issues",
  "Sleep Problems", "Trauma / PTSD", "Grief & Loss", "Self-Esteem", "Substance Use", "Other"
];
const DURATION_OPTIONS = ["Less than 2 weeks", "2-4 weeks", "1-6 months", "More than 6 months"];
const SEVERITY_OPTIONS = [
  "Mild — manageable most days",
  "Moderate — affecting my daily life",
  "Severe — significantly impacting me",
  "In crisis — I need immediate help"
];
const GENDER_PREF_OPTIONS = ["No preference", "Female", "Male"];
const LANGUAGE_PREF_OPTIONS = ["No preference", "English", "Bengali"];
const FORMAT_PREF_OPTIONS = ["Either", "Online Video", "In-Person"];

const MOCK_THERAPISTS = [
  { id: 1, name: "Dr. Ayesha Rahman", specialties: ["Anxiety", "Depression", "Sleep Problems"], languages: ["English", "Bengali"], gender: "Female", formats: ["Online Video", "In-Person"], rating: 4.8, bio: "10+ years helping clients manage anxiety and mood disorders." },
  { id: 2, name: "Dr. Sultan M. Farid", specialties: ["Stress & Burnout", "Relationship Issues", "Self-Esteem"], languages: ["English"], gender: "Male", formats: ["Online Video"], rating: 4.9, bio: "CBT-focused practice for stress and relationship dynamics." },
  { id: 3, name: "Dr. Farzana Islam", specialties: ["Trauma / PTSD", "Grief & Loss"], languages: ["English", "Bengali"], gender: "Female", formats: ["Online Video", "In-Person"], rating: 4.7, bio: "Trauma-informed, patient-centered care." },
  { id: 4, name: "Dr. Tanvir Ahmed", specialties: ["Substance Use", "Anxiety", "Depression"], languages: ["English"], gender: "Male", formats: ["In-Person"], rating: 4.6, bio: "Recovery-oriented and dual-diagnosis treatment." },
  { id: 5, name: "Dr. Nusrat Jahan", specialties: ["Self-Esteem", "Relationship Issues", "Stress & Burnout"], languages: ["Bengali"], gender: "Female", formats: ["Online Video", "In-Person"], rating: 4.8, bio: "Warm, collaborative, humanistic therapy style." }
];

const scoreTherapist = (therapist, vitals, summaries = {}) => {
  let score = 0;
  vitals.concerns.forEach((c) => { if (therapist.specialties && therapist.specialties.includes(c)) score += 1; });
  if (vitals.genderPref === "No preference" || therapist.gender === vitals.genderPref) score += 1;
  if (vitals.languagePref === "No preference" || (therapist.languages && therapist.languages.includes(vitals.languagePref))) score += 1;
  if (vitals.formatPref === "Either" || (therapist.formats && therapist.formats.includes(vitals.formatPref))) score += 1;

  // Feature 7: Weighted signals from patient reviews & feedback tags
  const fb = summaries[therapist.id];
  if (fb) {
    if (fb.averageRating >= 4.7) score += 0.5;
    if (fb.tagCounts) {
      if (fb.tagCounts['Listens carefully'] || fb.tagCounts['Warm and supportive']) score += 0.5;
      if (fb.tagCounts['Good at treatment'] || fb.tagCounts['Structured sessions']) score += 0.5;
    }
  }
  return score;
};

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [patientUser, setPatientUser] = useState({
    name: 'Yasar Mostafa',
    email: '',
    location: 'Dhaka, Bangladesh',
    language: 'English, Bengali',
    contact: '+880 1712-345678',
    therapist: 'Dr. Sultan M. Farid',
    profile_photo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [groupJoinRequested, setGroupJoinRequested] = useState(false);

  // Group Sessions State
  const [groupSessions, setGroupSessions] = useState([]);
  const [enrolledSessionIds, setEnrolledSessionIds] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);

  // Feature 7: Review & Feedback State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTherapist, setReviewTherapist] = useState({ id: 1, name: 'Dr. Ayesha Rahman', specialties: 'Anxiety, Depression' });
  const [reviewAppointmentId, setReviewAppointmentId] = useState(1);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});

  // Profile Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', contact_number: '', location: '', preferred_language: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Tasks State
  const [checklistItems, setChecklistItems] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');
  const previewChecklistItems = checklistItems.slice(0, 3);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);

  // Vitals State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsStep, setVitalsStep] = useState(0);
  const [vitalsData, setVitalsData] = useState({ concerns: [], duration: '', severity: '', genderPref: '', languagePref: '', formatPref: '', notes: '' });
  const [aiMatches, setAiMatches] = useState([]);
  const TOTAL_VITALS_QUESTION_STEPS = 6;

  // Directory State
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directorySpecialtyFilter, setDirectorySpecialtyFilter] = useState('All');
  const [directoryLanguageFilter, setDirectoryLanguageFilter] = useState('All');
  const [directoryFormatFilter, setDirectoryFormatFilter] = useState('All');
  const [directoryTherapists, setDirectoryTherapists] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    timeSlot: '',
    sessionType: 'online'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [cancelNotification, setCancelNotification] = useState(null);

  // Turns a 24h "HH:MM[:SS]" DB time into a "hh:mm AM/PM" label.
  const formatTimeLabel = (t) => {
    const [hStr, mStr] = t.slice(0, 5).split(':');
    const h = Number(hStr);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${mStr} ${period}`;
  };

  const formatSlotLabel = (start, end) => `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;

  const DEFAULT_TASKS = [
    { id: 101, text: "Take Morning Medication (Sertraline 50mg)", dueDate: new Date().toISOString().slice(0, 10), dueTime: "8:00 AM", videoUrl: null },
    { id: 102, text: "Complete 5-Minute Daily Mood Journaling", dueDate: new Date().toISOString().slice(0, 10), dueTime: "10:30 AM", videoUrl: null },
    { id: 103, text: "15-Min Guided Mindfulness Breathing Exercise", dueDate: new Date().toISOString().slice(0, 10), dueTime: "", videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM" }
  ];

  const DEFAULT_APPOINTMENTS = [
    {
      id: 1,
      therapist_name: "Dr. Sultan M. Farid",
      therapist_specialties: "Clinical Psychology",
      session_type: "online",
      appointment_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time_slot: "10:00 AM - 10:50 AM",
      status: "confirmed"
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getPatientProfile();
        if (data) {
          setPatientUser({
            name: data.name || data.display_name || 'Yasar Mostafa',
            email: data.email || '',
            location: data.location || 'Dhaka, Bangladesh',
            language: data.preferred_language || data.language || 'English, Bengali',
            contact: data.contact_number || data.contact || '+880 1712-345678',
            therapist: data.assigned_therapist || 'Dr. Sultan M. Farid',
            profile_photo_url: data.profile_photo_url || ''
          });
        }

        // Fetch Open Group Sessions
        try {
          if (typeof patientGetOpenGroupSessions === 'function') {
            const sessionsRes = await patientGetOpenGroupSessions();
            const sessionsList = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes?.data || []);
            setGroupSessions(sessionsList);
          }
          if (typeof patientGetMyEnrollments === 'function') {
            const enrollmentsRes = await patientGetMyEnrollments();
            const myEnrollments = Array.isArray(enrollmentsRes) ? enrollmentsRes : (enrollmentsRes?.data || []);
            setEnrolledSessionIds(new Set(myEnrollments.map(e => e.group_session_id)));
          }
        } catch (groupErr) {
          console.error("Group sessions load error:", groupErr);
        }

      } catch (error) {
        console.error("Error pulling live dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        const data = await getPatientTasks();
        if (Array.isArray(data) && data.length > 0) {
          setChecklistItems(data);
        } else {
          setChecklistItems(DEFAULT_TASKS);
        }
      } catch (err) {
        setChecklistItems(DEFAULT_TASKS);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchAppts = async () => {
      try {
        setAppointmentsLoading(true);
        const data = await getAppointments();
        if (Array.isArray(data) && data.length > 0) {
          setAppointments(data);
        } else {
          setAppointments(DEFAULT_APPOINTMENTS);
        }
      } catch (err) {
        setAppointments(DEFAULT_APPOINTMENTS);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppts();
  }, []);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const summaries = await getAllTherapistReviewSummaries();
        if (summaries && typeof summaries === 'object') {
          setReviewSummaries(summaries);
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchSummaries();
  }, []);

  const handleJoinGroup = async (sessionId) => {
    try {
      setJoiningId(sessionId);
      if (typeof patientJoinGroupSession === 'function') {
        await patientJoinGroupSession(sessionId);
        setEnrolledSessionIds(prev => new Set([...prev, sessionId]));
      }
    } catch (err) {
      alert("Failed to join group session: " + (err.response?.data?.message || err.message));
    } finally {
      setJoiningId(null);
    }
  };

  const getInitials = (fullName = '') => {
    return fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
    const base = SERVER_BASE_URL.replace(/\/$/, '');
    const cleanPath = photoPath.replace(/^\//, '');
    return `${base}/${cleanPath}`;
  };

  const openEditModal = () => {
    setEditForm({
      name: patientUser.name,
      contact_number: patientUser.contact,
      location: patientUser.location,
      preferred_language: patientUser.language
    });
    setPhotoFile(null);
    setPhotoPreview(patientUser.profile_photo_url ? getPhotoUrl(patientUser.profile_photo_url) : null);
    setSaveError('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select a valid image file (PNG, JPG, JPEG).');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setSaveError('');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      let updatedPhotoUrl = patientUser.profile_photo_url;
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const photoRes = await uploadPatientPhoto(formData);
        if (photoRes && photoRes.profile_photo_url) {
          updatedPhotoUrl = photoRes.profile_photo_url;
        }
      }

      await updatePatientProfile(editForm);

      setPatientUser(prev => ({
        ...prev,
        name: editForm.name,
        contact: editForm.contact_number,
        location: editForm.location,
        language: editForm.preferred_language,
        profile_photo_url: updatedPhotoUrl
      }));

      closeEditModal();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTaskCompletion = async (id) => {
    const isMock = id >= 100 && id <= 103;
    if (isMock) {
      setChecklistItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    try {
      await deletePatientTask(id);
      setChecklistItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setChecklistItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const openVitalsModal = () => {
    setVitalsStep(0);
    setVitalsData({
      concerns: [], duration: '', severity: '',
      genderPref: 'No preference', languagePref: 'No preference',
      formatPref: 'Either', notes: ''
    });
    setAiMatches([]);
    setShowVitalsModal(true);
  };

  const closeVitalsModal = () => setShowVitalsModal(false);

  const toggleConcern = (concern) => {
    setVitalsData(prev => {
      const exists = prev.concerns.includes(concern);
      const nextConcerns = exists ? prev.concerns.filter(c => c !== concern) : [...prev.concerns, concern];
      return { ...prev, concerns: nextConcerns };
    });
  };

  const setVitalsField = (field, value) => {
    setVitalsData(prev => ({ ...prev, [field]: value }));
  };

  const isVitalsStepValid = () => {
    if (vitalsStep === 0) return vitalsData.concerns.length > 0;
    if (vitalsStep === 1) return vitalsData.duration !== '';
    if (vitalsStep === 2) return vitalsData.severity !== '';
    if (vitalsStep === 3) return vitalsData.genderPref !== '';
    if (vitalsStep === 4) return vitalsData.languagePref !== '';
    if (vitalsStep === 5) return vitalsData.formatPref !== '';
    return true;
  };

  const goVitalsNext = () => {
    if (vitalsStep < TOTAL_VITALS_QUESTION_STEPS - 1) {
      setVitalsStep(prev => prev + 1);
    } else {
      runAiMatchmaker();
    }
  };

  const goVitalsBack = () => {
    if (vitalsStep > 0) setVitalsStep(prev => prev - 1);
  };

  const runAiMatchmaker = async () => {
    let pool = MOCK_THERAPISTS;
    try {
      const dbTherapists = await getTherapistDirectory();
      if (Array.isArray(dbTherapists) && dbTherapists.length > 0) {
        pool = dbTherapists;
      }
    } catch (err) {
      // Use fallback
    }

    const scored = pool.map(t => {
      const score = scoreTherapist(t, vitalsData, reviewSummaries);
      const maxPossible = (vitalsData.concerns.length || 1) + 3;
      const matchPct = Math.min(99, Math.max(70, Math.round((score / maxPossible) * 100)));
      return { ...t, matchScore: score, matchPct };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const top3 = scored.slice(0, 3);
    setAiMatches(top3);
    setVitalsStep(6);
  };

  const handleFindWithAI = () => {
    closeVitalsModal();
    openVitalsModal();
  };

  const handleSearchManually = () => {
    closeVitalsModal();
    openDirectoryModal();
  };

  const openDirectoryModal = async () => {
    setShowDirectoryModal(true);
    setDirectorySearch('');
    setDirectorySpecialtyFilter('All');
    setDirectoryLanguageFilter('All');
    setDirectoryFormatFilter('All');
    setDirectoryLoading(true);
    setDirectoryError('');
    try {
      const data = await getTherapistDirectory();
      if (Array.isArray(data) && data.length > 0) {
        setDirectoryTherapists(data);
      } else {
        setDirectoryTherapists(MOCK_THERAPISTS);
      }
    } catch (err) {
      setDirectoryTherapists(MOCK_THERAPISTS);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const closeDirectoryModal = () => setShowDirectoryModal(false);

  const directorySpecialtyOptions = ['All', ...CONCERN_OPTIONS];
  const directoryLanguageOptions = ['All', 'English', 'Bengali'];
  const directoryFormatOptions = ['All', 'Online Video', 'In-Person'];

  const filteredDirectoryTherapists = directoryTherapists.filter(t => {
    const nameMatch = !directorySearch || t.name.toLowerCase().includes(directorySearch.toLowerCase()) || (t.bio && t.bio.toLowerCase().includes(directorySearch.toLowerCase()));
    const specMatch = directorySpecialtyFilter === 'All' || (t.specialties && t.specialties.includes(directorySpecialtyFilter));
    const langMatch = directoryLanguageFilter === 'All' || (t.languages && t.languages.includes(directoryLanguageFilter));
    const formatMatch = directoryFormatFilter === 'All' || (t.formats && t.formats.includes(directoryFormatFilter));
    return nameMatch && specMatch && langMatch && formatMatch;
  });

  const openBookingModal = async (therapist) => {
    setSelectedTherapistForBooking(therapist);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setBookingForm({
      date: tomorrow,
      timeSlot: '',
      sessionType: 'online'
    });
    setBookingError('');
    setBookingSuccess('');
    setShowBookingModal(true);
    fetchBookedSlots(therapist.id, tomorrow);
    fetchAvailableSlots(therapist.id, tomorrow);
  };

  const fetchBookedSlots = async (therapistId, date) => {
    try {
      const data = await getTherapistSlots(therapistId, date);
      setBookedSlots(data?.bookedSlots || []);
    } catch (err) {
      setBookedSlots([]);
    }
  };

  // Pulls the therapist's weekly availability matrix (+ any date exception)
  // for the chosen day and turns it into the list of bookable time slots.
  // This is what makes the Schedule Manager actually gate patient booking:
  // if the therapist unchecked a box (or blocked the date), it won't appear here.
  const fetchAvailableSlots = async (therapistId, date) => {
    setSlotsLoading(true);
    try {
      const data = await getEffectiveAvailability(therapistId, date);
      const dayData = (data.days || []).find(d => d.date === date);
      const slots = (dayData?.slots || []).map(s => formatSlotLabel(s.start_time, s.end_time));
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Failed to load therapist availability', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookingDateChange = (date) => {
    setBookingForm(prev => ({ ...prev, date, timeSlot: '' }));
    if (selectedTherapistForBooking) {
      fetchBookedSlots(selectedTherapistForBooking.id, date);
      fetchAvailableSlots(selectedTherapistForBooking.id, date);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedTherapistForBooking) return;
    if (!bookingForm.timeSlot) {
      setBookingError('Please select an available time slot.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const bookingData = {
        therapist_id: selectedTherapistForBooking.id,
        appointment_date: bookingForm.date,
        time_slot: bookingForm.timeSlot,
        session_type: bookingForm.sessionType
      };
      const result = await bookAppointment(bookingData);
      setBookingSuccess('Appointment confirmed successfully!');

      const newAppt = {
        id: result.appointmentId || Date.now(),
        therapist_name: selectedTherapistForBooking.name,
        therapist_specialties: Array.isArray(selectedTherapistForBooking.specialties) ? selectedTherapistForBooking.specialties.join(', ') : selectedTherapistForBooking.specialties,
        session_type: bookingForm.sessionType,
        appointment_date: bookingForm.date,
        time_slot: bookingForm.timeSlot,
        status: 'confirmed',
        profile_photo_url: selectedTherapistForBooking.profile_photo_url || ''
      };

      setAppointments(prev => [newAppt, ...prev]);

      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess('');
      }, 1500);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to confirm booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await cancelAppointment(appointmentId);
      setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
      setCancelNotification("Appointment canceled successfully.");
      setTimeout(() => setCancelNotification(null), 5000);
    } catch (err) {
      setAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
      setCancelNotification("Appointment canceled successfully.");
      setTimeout(() => setCancelNotification(null), 5000);
    }
  };

  const openReviewModal = (appt) => {
    setReviewTherapist({
      id: appt.therapist_id || 1,
      name: appt.therapist_name || 'Dr. Sultan M. Farid',
      specialties: appt.therapist_specialties || 'Clinical Psychology'
    });
    setReviewAppointmentId(appt.id || 1);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewPayload) => {
    await submitReview(reviewPayload);
    setReviewSubmitted(true);
    setShowReviewModal(false);
    const summaries = await getAllTherapistReviewSummaries();
    if (summaries) setReviewSummaries(summaries);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderChecklistRow = (item) => {
    const video = parseVideoUrl(item.videoUrl);
    const dueInfo = getDueInfo(item.dueDate, item.dueTime);
    
    const timeStampText = dueInfo.label
      .replace('DUE TODAY · ', '')
      .replace('OVERDUE · ', '')
      .replace('DUE TODAY', '')
      .replace('OVERDUE', '');

    return (
      <div key={item.id} className="checklist-row-container row-active" style={{ marginBottom: '12px' }}>
        <div className="checklist-item-main">
          <div className="checklist-row-top">
            <button
              type="button"
              className="checkbox-toggle-btn"
              onClick={() => toggleTaskCompletion(item.id)}
              title="Mark as done"
              aria-label={`Mark task ${item.text} as complete`}
            >
              <div className="icon-unchecked" />
            </button>
            <span className="checklist-task-text text-bold">{item.text}</span>
            {dueInfo.status === 'today' && <span className="due-today-badge">DUE TODAY</span>}
            {dueInfo.status === 'overdue' && <span className="due-today-badge due-overdue-badge">OVERDUE</span>}
          </div>
          {video && video.type === 'youtube' && (
            <div className="video-player-placeholder" style={{ padding: '12px', background: 'transparent' }}>
              <iframe
                className="task-video-embed"
                src={video.embedUrl}
                title={item.text}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {video && video.type === 'file' && (
            <div className="video-player-placeholder">
              <div className="video-play-layer">
                <div className="red-play-circle"><Play size={20} fill="white" color="white" /></div>
                <span className="video-main-title">Prescribed Video</span>
                <span className="video-sub-caption">Assigned by {patientUser.therapist.split(' ')[0] + ' ' + (patientUser.therapist.split(' ')[1] || '')}</span>
              </div>
            </div>
          )}
        </div>
        <span className="checklist-time-stamp">{timeStampText}</span>
      </div>
    );
  };

  return (
    <div className="patient-dashboard-container">
      {/* A. TOP NAVIGATION BAR */}
      <header className="top-navbar">
        <div className="navbar-left">
          <div className="brand-logo-group">
            <div className="brand-logo">S</div>
            <span className="brand-text">Smart Recovery Portal</span>
          </div>
          <span className="mode-badge">Patient Mode</span>
        </div>
        <div className="navbar-right">
          <NotificationBell />
          <div className="user-profile-tile" onClick={openEditModal} style={{ cursor: 'pointer' }}>
            <div className="avatar-circle-sm">
              {patientUser.profile_photo_url ? (
                <img src={getPhotoUrl(patientUser.profile_photo_url)} alt={patientUser.name} className="avatar-photo" />
              ) : (
                getInitials(patientUser.name)
              )}
            </div>
            <span className="profile-name-text">{patientUser.name}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* B. LEFT NAVIGATION SIDEBAR */}
        <aside className="left-sidebar">
          <nav className="sidebar-menu">
            <div className="menu-item active" onClick={() => navigate('/patient-dashboard')} style={{ cursor: 'pointer' }}>
              <Heart size={18} /><span>Recovery Hub</span>
            </div>
            <div className="menu-item" onClick={() => openBookingModal({ id: 2, name: 'Dr. Sultan M. Farid', consultation_fee: 1500, session_type: 'both' })} style={{ cursor: 'pointer' }}>
              <Calendar size={18} /><span>My Appointments</span>
            </div>
            <div className="menu-item" onClick={() => setShowAllTasksModal(true)} style={{ cursor: 'pointer' }}>
              <CheckSquare size={18} /><span>Daily Checklist</span>
            </div>
            <div className="menu-item" onClick={openVitalsModal} style={{ cursor: 'pointer' }}>
              <Sliders size={18} /><span>AI Matchmaker</span>
            </div>
            <div className="menu-item" onClick={openDirectoryModal} style={{ cursor: 'pointer' }}>
              <Search size={18} /><span>Therapist Directory</span>
            </div>
            <div className="menu-item" onClick={() => navigate('/patient/group-sessions')} style={{ cursor: 'pointer' }}>
              <Users size={18} /><span>Group Sessions</span>
            </div>
            <div className="menu-item" onClick={openVitalsModal} style={{ cursor: 'pointer' }}>
              <BarChart2 size={18} /><span>Vitals & Progress</span>
            </div>
            <div className="menu-item" onClick={openEditModal} style={{ cursor: 'pointer' }}>
              <Settings size={18} /><span>Profile Settings</span>
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="menu-item text-danger" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <LogOut size={18} /><span>Logout</span>
            </div>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="main-content">
          <div className="dashboard-grid">
            {/* C. RECOVERY PULSE BANNER */}
            <section className="dashboard-card span-12 banner-card">
              <div className="banner-left">
                <h1 className="banner-welcome">Welcome back, {patientUser.name.split(' ')[0]} 👋</h1>
                <p className="banner-subtitle">You're on a 5-day care plan streak! Keep up the great progress.</p>
              </div>
              <div className="banner-right">
                <div className="streak-pill">★ 5-Day Streak</div>
                <div className="reminder-pill">
                  <Clock size={14} /><span>Next: Tomorrow 10:00 AM</span>
                </div>
              </div>
            </section>

            {/* D. ACTIVE APPOINTMENT & VISUAL TRACKER CARD */}
            <ActiveAppointmentCard
              appointments={appointments}
              appointmentsLoading={appointmentsLoading}
              patientUser={patientUser}
              getPhotoUrl={getPhotoUrl}
              getInitials={getInitials}
              handleCancelAppointment={handleCancelAppointment}
              openDirectoryModal={openDirectoryModal}
              openBookingModal={openBookingModal}
              cancelNotification={cancelNotification}
              openReviewModal={openReviewModal}
              reviewSubmitted={reviewSubmitted}
            />

            {/* E. SMART ROUTING & DISCOVERY HUB */}
            <section className="dashboard-card span-5 flex-column gap-16">
              <div className="card-header-row">
                <h2 className="card-title">Smart Routing & Discovery Hub</h2>
                <span 
                  className="card-header-link" 
                  onClick={() => navigate('/patient/group-sessions')} 
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                >
                  View All →
                </span>
              </div>

              <div className="shortcut-card matchmaker-shortcut" onClick={openVitalsModal} style={{ cursor: 'pointer' }}>
                <div className="shortcut-left">
                  <h3 className="shortcut-title text-blue">AI-Powered Therapist Matchmaker</h3>
                  <p className="shortcut-desc">Answer vitals questionnaire to get top 3 instant matches</p>
                </div>
                <ArrowRight size={18} className="text-blue" />
              </div>

              {/* Group Therapy Session Pill */}
              <div className="group-sessions-section">
                {groupSessions.length === 0 ? (
                  <div className="shortcut-card group-shortcut">
                    <div className="shortcut-left">
                      <h3 className="shortcut-title text-green">Group Therapy: "Anxiety Management"</h3>
                      <p className="shortcut-desc">Thu 4:00 PM · 3 Spots Left</p>
                    </div>
                    <button
                      className="join-pill-btn"
                      onClick={() => setGroupJoinRequested(true)}
                      disabled={groupJoinRequested}
                    >
                      {groupJoinRequested ? "✓ Requested" : "Join Request"}
                    </button>
                  </div>
                ) : (
                  groupSessions.slice(0, 2).map((session) => {
                    const isEnrolled = enrolledSessionIds.has(session.id);
                    const isPending = joiningId === session.id;
                    const sessionTime = session.start_time || session.scheduled_at;

                    return (
                      <div key={session.id} className="shortcut-card group-shortcut" style={{ marginBottom: '10px' }}>
                        <div className="shortcut-left">
                          <h3 className="shortcut-title text-green">{session.topic || session.title}</h3>
                          <p className="shortcut-desc">
                            By {session.therapist_name || 'Therapist'} • Max: {session.capacity || session.max_participants || 10}
                          </p>
                          <p className="shortcut-desc" style={{ fontSize: '11px', color: '#64748b' }}>
                            {sessionTime ? new Date(sessionTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Soon'}
                          </p>
                        </div>
                        <button 
                          className={`join-pill-btn ${isEnrolled ? 'requested' : ''}`} 
                          onClick={() => !isEnrolled && handleJoinGroup(session.id)}
                          disabled={isEnrolled || isPending}
                        >
                          {isEnrolled ? (
                            <><Check size={13} style={{ display: 'inline', marginRight: '4px' }} /> Joined</>
                          ) : isPending ? (
                            "Sending..."
                          ) : (
                            "Join Request"
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* F. OPT-IN CARE ROUTINE GENERATOR */}
            <section className="dashboard-card span-7 flex-column gap-16">
              <div className="card-header-row">
                <h2 className="card-title">Daily Care Plan & Video Checklist</h2>
                <span className="card-header-link" onClick={() => setShowAllTasksModal(true)} style={{ cursor: 'pointer' }}>
                  View All Tasks →
                </span>
              </div>

              <div className="checklist-container">
                {tasksLoading ? (
                  <p className="checklist-empty-text">Loading your tasks...</p>
                ) : tasksError ? (
                  <p className="checklist-empty-text checklist-error-text">{tasksError}</p>
                ) : checklistItems.length === 0 ? (
                  <p className="checklist-empty-text">No daily tasks yet.</p>
                ) : (
                  <div className="checklist-wrapper">
                    {previewChecklistItems.map(renderChecklistRow)}
                  </div>
                )}
              </div>
            </section>

            {/* G. PERSONAL PROFILE & PREFERENCES */}
            <section className="dashboard-card span-5 flex-column">
              <h2 className="card-title margin-bottom-16">Personal Profile & Preferences</h2>
              <div className="profile-snapshot-tile">
                <div className="avatar-circle-lg">
                  {patientUser.profile_photo_url ? (
                    <img src={getPhotoUrl(patientUser.profile_photo_url)} alt={patientUser.name} className="avatar-photo" />
                  ) : (
                    getInitials(patientUser.name)
                  )}
                </div>
                <div className="profile-snapshot-meta">
                  <h3 className="profile-snapshot-name">{patientUser.name}</h3>
                  <p className="profile-snapshot-role">Registered Patient Account</p>
                </div>
              </div>
              <div className="profile-data-list">
                <div className="profile-data-row">
                  <span className="data-field-label"><MapPin size={14} /> LOCATION:</span>
                  <span className="data-field-value">{patientUser.location}</span>
                </div>
                <div className="profile-data-row">
                  <span className="data-field-label"><Globe size={14} /> LANGUAGE:</span>
                  <span className="data-field-value">{patientUser.language}</span>
                </div>
                <div className="profile-data-row">
                  <span className="data-field-label"><Phone size={14} /> CONTACT:</span>
                  <span className="data-field-value">{patientUser.contact}</span>
                </div>
                <div className="profile-data-row">
                  <span className="data-field-label"><Video size={14} /> THERAPIST:</span>
                  <span className="data-field-value color-link-blue">{patientUser.therapist}</span>
                </div>
              </div>
              <button className="edit-profile-action-btn" onClick={openEditModal}>
                <Settings size={16} /><span>Edit Profile Info</span>
              </button>
            </section>
          </div>
        </main>
      </div>

      {/* MODAL COMPONENTS */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        editForm={editForm}
        setEditForm={setEditForm}
        photoPreview={photoPreview}
        handlePhotoSelect={handlePhotoSelect}
        handleSaveProfile={handleSaveProfile}
        isSaving={isSaving}
        saveError={saveError}
        getPhotoUrl={getPhotoUrl}
        getInitials={getInitials}
        patientUser={patientUser}
      />

      <VitalsModal
        showVitalsModal={showVitalsModal}
        closeVitalsModal={closeVitalsModal}
        vitalsStep={vitalsStep}
        setVitalsStep={setVitalsStep}
        vitalsData={vitalsData}
        toggleConcern={toggleConcern}
        setVitalsField={setVitalsField}
        isVitalsStepValid={isVitalsStepValid}
        goVitalsNext={goVitalsNext}
        goVitalsBack={goVitalsBack}
        handleFindWithAI={handleFindWithAI}
        handleSearchManually={handleSearchManually}
        aiMatches={aiMatches}
        openBookingModal={openBookingModal}
        TOTAL_VITALS_QUESTION_STEPS={TOTAL_VITALS_QUESTION_STEPS}
        CONCERN_OPTIONS={CONCERN_OPTIONS}
        DURATION_OPTIONS={DURATION_OPTIONS}
        SEVERITY_OPTIONS={SEVERITY_OPTIONS}
        GENDER_PREF_OPTIONS={GENDER_PREF_OPTIONS}
        LANGUAGE_PREF_OPTIONS={LANGUAGE_PREF_OPTIONS}
        FORMAT_PREF_OPTIONS={FORMAT_PREF_OPTIONS}
      />

      <TherapistDirectoryModal
        showDirectoryModal={showDirectoryModal}
        closeDirectoryModal={closeDirectoryModal}
        directorySearch={directorySearch}
        setDirectorySearch={setDirectorySearch}
        directorySpecialtyFilter={directorySpecialtyFilter}
        setDirectorySpecialtyFilter={setDirectorySpecialtyFilter}
        directorySpecialtyOptions={directorySpecialtyOptions}
        directoryLanguageFilter={directoryLanguageFilter}
        setDirectoryLanguageFilter={setDirectoryLanguageFilter}
        directoryLanguageOptions={directoryLanguageOptions}
        directoryFormatFilter={directoryFormatFilter}
        setDirectoryFormatFilter={setDirectoryFormatFilter}
        directoryFormatOptions={directoryFormatOptions}
        directoryLoading={directoryLoading}
        directoryError={directoryError}
        filteredDirectoryTherapists={filteredDirectoryTherapists}
        getPhotoUrl={getPhotoUrl}
        getInitials={getInitials}
        openBookingModal={openBookingModal}
      />

      <BookingModal
        showBookingModal={showBookingModal}
        setShowBookingModal={setShowBookingModal}
        selectedTherapistForBooking={selectedTherapistForBooking}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        handleBookingDateChange={handleBookingDateChange}
        handleConfirmBooking={handleConfirmBooking}
        bookingLoading={bookingLoading}
        bookingError={bookingError}
        bookingSuccess={bookingSuccess}
        bookedSlots={bookedSlots}
        TIME_SLOT_OPTIONS={availableSlots}
        slotsLoading={slotsLoading}
        getPhotoUrl={getPhotoUrl}
        getInitials={getInitials}
      />

      <TasksModal
        showAllTasksModal={showAllTasksModal}
        setShowAllTasksModal={setShowAllTasksModal}
        checklistItems={checklistItems}
        renderChecklistRow={renderChecklistRow}
        tasksLoading={tasksLoading}
        tasksError={tasksError}
      />

      <ReviewFeedbackModal
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        therapist={reviewTherapist}
        appointmentId={reviewAppointmentId}
        onReviewSubmitted={handleReviewSubmit}
        getInitials={getInitials}
      />
    </div>
  );
}