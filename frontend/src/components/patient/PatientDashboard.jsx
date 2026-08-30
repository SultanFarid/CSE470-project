import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Calendar, CheckCircle, Clock, Play, User, Star, Search, 
  Users, LogOut, ArrowRight, Settings, Heart, Sliders, MapPin, 
  Globe, Phone, Video, ShieldAlert, Plus, CheckSquare, BarChart2, Check, FileText
} from 'lucide-react';
import './PatientDashboard.css';
import { 
  getPatientProfile, updatePatientProfile, uploadPatientPhoto, SERVER_BASE_URL,
  getPatientTasks, createPatientTask, deletePatientTask, getTherapistDirectory,
  getAppointments, bookAppointment, cancelAppointment, getTherapistSlots, getEffectiveAvailability, getAiMatchmaker,
  submitReview, getPendingReview, getAllTherapistReviewSummaries,
  patientGetOpenGroupSessions, patientJoinGroupSession, patientGetMyEnrollments,
  saveVitals, completeTask, getMyStreak, getPendingCarePlan, acceptCarePlan,
  getPendingFollowUp
} from '../../services/api';

import ActiveAppointmentCard from './ActiveAppointmentCard';
import EditProfileModal from './EditProfileModal';
import VitalsModal from './VitalsModal';
import TherapistDirectoryModal from './TherapistDirectoryModal';
import BookingModal from './BookingModal';
import TasksModal from './TasksModal';
import ReviewFeedbackModal from './ReviewFeedbackModal';
import NotificationBell from '../shared/NotificationBell';
import CarePlanPromptCard from './CarePlanPromptCard';
import FollowUpPromptCard from './FollowUpPromptCard';
import TherapyProgressCard from './TherapyProgressCard';
import TherapyRoadmapCard from './TherapyRoadmapCard';

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
  { id: 1, name: "Dr. Ayesha Rahman", specialties: ["Anxiety", "Depression", "Sleep Problems"], languages: ["English", "Bengali"], gender: "Female", formats: ["Online Video", "In-Person"], session_type: "both", consultation_fee: 1500, rating: 4.8, bio: "10+ years helping clients manage anxiety and mood disorders." },
  { id: 2, name: "Dr. Sultan M. Farid", specialties: ["Stress & Burnout", "Relationship Issues", "Self-Esteem"], languages: ["English"], gender: "Male", formats: ["Online Video"], session_type: "online", consultation_fee: 1500, rating: 4.9, bio: "CBT-focused practice for stress and relationship dynamics." },
  { id: 3, name: "Dr. Farzana Islam", specialties: ["Trauma / PTSD", "Grief & Loss"], languages: ["English", "Bengali"], gender: "Female", formats: ["Online Video", "In-Person"], session_type: "both", consultation_fee: 1500, rating: 4.7, bio: "Trauma-informed, patient-centered care." },
  { id: 4, name: "Dr. Tanvir Ahmed", specialties: ["Substance Use", "Anxiety", "Depression"], languages: ["English"], gender: "Male", formats: ["In-Person"], session_type: "in-person", consultation_fee: 1500, rating: 4.6, bio: "Recovery-oriented and dual-diagnosis treatment." },
  { id: 5, name: "Dr. Nusrat Jahan", specialties: ["Self-Esteem", "Relationship Issues", "Stress & Burnout"], languages: ["Bengali", "English"], gender: "Female", formats: ["Online Video", "In-Person"], session_type: "both", consultation_fee: 1500, rating: 4.8, bio: "Warm, collaborative, humanistic therapy style." }
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
    id: '',
    name: '',
    email: '',
    location: '',
    language: '',
    contact: '',
    therapist: '',
    profile_photo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [groupJoinRequested, setGroupJoinRequested] = useState(false);

  // Feature 6b: Real streak counter
  const [streak, setStreak] = useState(0);

  // Feature 6a: Care plan opt-in prompt
  const [pendingCarePlan, setPendingCarePlan] = useState(null);
  const [carePlanDismissed, setCarePlanDismissed] = useState(false);
  const [pendingFollowUp, setPendingFollowUp] = useState(null);
  const [followUpNotice, setFollowUpNotice] = useState('');

  // Group Sessions State
  const [groupSessions, setGroupSessions] = useState([]);
  const [enrolledSessionIds, setEnrolledSessionIds] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);

  // Feature 7: Review & Feedback State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTherapist, setReviewTherapist] = useState(null);
  const [reviewAppointmentId, setReviewAppointmentId] = useState(null);
  const [pendingReview, setPendingReview] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Profile Dropdown State
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  // Progress Tracking State
  const [progressStats, setProgressStats] = useState({
    tasksCompletedToday: 0,
    totalTasksToday: 0,
    weeklyFullCompletions: 0,
    completedAllToday: false
  });

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState(null);
  const getLocalDateString = (daysOffset = 0) => {
    const d = new Date();
    if (daysOffset) d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [bookingForm, setBookingForm] = useState({
    date: getLocalDateString(1),
    timeSlot: '',
    sessionType: 'online'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDayAvailability, setSelectedDayAvailability] = useState(null);
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
      therapist_id: 2,
      therapist_name: "Yasar Mostafa",
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
            id: data.id || data.patient_id || data.email || 'patient',
            name: data.name || data.display_name || '',
            email: data.email || '',
            location: data.location || '',
            language: data.preferred_language || data.language || '',
            contact: data.contact_number || data.contact || '',
            therapist: data.assigned_therapist || '',
            profile_photo_url: data.profile_photo_url || ''
          });
        }

        // Feature 7: check for a real completed-but-unreviewed session
        try {
          const pendingRes = await getPendingReview();
          setPendingReview(pendingRes && pendingRes.hasPending ? pendingRes.review : null);
        } catch (pendingErr) {
          setPendingReview(null);
        }

        // Feature 6b: Load the real streak counter
        try {
          const s = await getMyStreak();
          setStreak(typeof s === 'number' ? s : 0);
        } catch {
          setStreak(0);
        }

        // Feature 6a: Check if there is a pending care plan to prompt
        try {
          const cp = await getPendingCarePlan();
          setPendingCarePlan(cp || null);
        } catch {
          setPendingCarePlan(null);
        }

        // Feature 12 extension: Check if there is a pending follow-up to respond to
        try {
          const fu = await getPendingFollowUp();
          setPendingFollowUp(fu || null);
        } catch {
          setPendingFollowUp(null);
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
        if (Array.isArray(data)) {
          setAppointments(data);
        } else {
          setAppointments([]);
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

  useEffect(() => {
    if (!patientUser?.id || tasksLoading) return;
    
    const today = new Date().toISOString().slice(0,10);
    const getWeekStart = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
      return new Date(date.setDate(diff)).toISOString().slice(0,10);
    };
    const thisWeek = getWeekStart(new Date());
    
    const storageKey = `therapy_progress_${patientUser.id}`;
    let stats = null;
    try {
      stats = JSON.parse(localStorage.getItem(storageKey));
    } catch(e) {}
    
    if (!stats) {
      stats = {
        lastUpdatedDate: today,
        weekStartDate: thisWeek,
        tasksCompletedToday: 0,
        totalTasksToday: checklistItems.length,
        weeklyFullCompletions: 0,
        completedAllToday: false
      };
    } else if (stats.lastUpdatedDate !== today) {
      let newWeekly = stats.weeklyFullCompletions || 0;
      if (stats.weekStartDate !== thisWeek) {
         newWeekly = 0;
      }
      stats = {
        lastUpdatedDate: today,
        weekStartDate: thisWeek,
        tasksCompletedToday: 0,
        totalTasksToday: checklistItems.length,
        weeklyFullCompletions: newWeekly,
        completedAllToday: false
      };
    } else {
      const currentTotal = stats.tasksCompletedToday + checklistItems.length;
      if (currentTotal > stats.totalTasksToday) {
         stats.totalTasksToday = currentTotal;
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(stats));
    setProgressStats(stats);
  }, [patientUser, checklistItems.length, tasksLoading]);

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

  const displayOrPlaceholder = (value, placeholder = 'Not set yet') => (value ? value : placeholder);

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
    
    const updateProgressOnComplete = () => {
      if (!patientUser?.id) return;
      const storageKey = `therapy_progress_${patientUser.id}`;
      let stats = null;
      try { stats = JSON.parse(localStorage.getItem(storageKey)); } catch(e){}
      if (stats) {
        stats.tasksCompletedToday += 1;
        if (stats.tasksCompletedToday >= stats.totalTasksToday && stats.totalTasksToday > 0) {
          if (!stats.completedAllToday) {
            stats.weeklyFullCompletions += 1;
            stats.completedAllToday = true;
          }
        }
        localStorage.setItem(storageKey, JSON.stringify(stats));
        setProgressStats(stats);
      }
    };

    if (isMock) {
      setChecklistItems(prev => prev.filter(item => item.id !== id));
      updateProgressOnComplete();
      return;
    }
    
    try {
      await completeTask(id);
      setChecklistItems(prev => prev.filter(item => item.id !== id));
      updateProgressOnComplete();
      
      // Refresh streak after completing a task
      try {
        const s = await getMyStreak();
        setStreak(typeof s === 'number' ? s : 0);
      } catch { /* streak refresh is non-critical */ }
    } catch (err) {
      // Remove optimistically even on error
      setChecklistItems(prev => prev.filter(item => item.id !== id));
      updateProgressOnComplete();
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
    if (vitalsStep < TOTAL_VITALS_QUESTION_STEPS) {
      setVitalsStep(prev => prev + 1);
    }
  };

  const goVitalsBack = () => {
    if (vitalsStep > 0) setVitalsStep(prev => prev - 1);
  };

  const runAiMatchmaker = async () => {
    saveVitals(vitalsData).catch(() => {});

    try {
      const topMatches = await getAiMatchmaker(vitalsData);
      if (Array.isArray(topMatches) && topMatches.length > 0) {
        setAiMatches(topMatches);
      } else {
        throw new Error("No matches returned");
      }
    } catch (err) {
      console.error("Matchmaker API failed, using fallback:", err);
      let pool = MOCK_THERAPISTS;
      try {
        const dbTherapists = await getTherapistDirectory();
        if (Array.isArray(dbTherapists) && dbTherapists.length > 0) {
          pool = dbTherapists;
        }
      } catch (e) {}

      const scored = pool.map(t => {
        const score = scoreTherapist(t, vitalsData, reviewSummaries);
        const maxPossible = (vitalsData.concerns.length || 1) + 3;
        const matchPct = Math.min(99, Math.max(70, Math.round((score / maxPossible) * 100)));
        return { ...t, matchScore: score, matchPct };
      });
      scored.sort((a, b) => b.matchScore - a.matchScore);
      setAiMatches(scored.slice(0, 3));
    }
    setVitalsStep(7);
  };

  const handleFindWithAI = () => {
    runAiMatchmaker();
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
      if (Array.isArray(data)) {
        setDirectoryTherapists(data);
      } else {
        setDirectoryTherapists([]);
      }
    } catch (err) {
      console.error('Failed to load therapist directory:', err);
      setDirectoryError(err.response?.data?.message || 'Unable to load therapists. Please check your connection.');
      setDirectoryTherapists([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const handleClearDirectoryFilters = () => {
    setDirectorySearch('');
    setDirectorySpecialtyFilter('All');
    setDirectoryFormatFilter('All');
  };

  const handleRetryDirectory = () => {
    openDirectoryModal();
  };

  const closeDirectoryModal = () => setShowDirectoryModal(false);

  const directorySpecialtyOptions = useMemo(() => {
    const specs = new Set();
    (directoryTherapists || []).forEach(t => {
      (t.specialties || []).forEach(s => {
        if (s && s.trim()) specs.add(s.trim());
      });
    });
    return ['All', ...Array.from(specs).sort((a, b) => a.localeCompare(b))];
  }, [directoryTherapists]);

  const directoryFormatOptions = ['All', 'Online Video', 'In-Person', 'Online & In-Person'];

  const filteredDirectoryTherapists = directoryTherapists.filter(t => {
    const q = directorySearch ? directorySearch.trim().toLowerCase() : '';
    const nameMatch = !q ||
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.bio && t.bio.toLowerCase().includes(q)) ||
      (t.biography && t.biography.toLowerCase().includes(q)) ||
      (Array.isArray(t.specialties) && t.specialties.some(s => s.toLowerCase().includes(q))) ||
      (Array.isArray(t.languages) && t.languages.some(l => l.toLowerCase().includes(q)));

    const specFilter = directorySpecialtyFilter ? directorySpecialtyFilter.trim().toLowerCase() : 'all';
    const specMatch = specFilter === 'all' || (
      Array.isArray(t.specialties) && t.specialties.some(s => s.trim().toLowerCase() === specFilter || s.trim().toLowerCase().includes(specFilter))
    );

    // Internal language requirement: only display therapists who speak English
    const langMatch = Array.isArray(t.languages) && t.languages.some(l => l.trim().toLowerCase() === 'english');

    let formatMatch = true;
    if (directoryFormatFilter === 'Online Video') {
      formatMatch = t.session_type === 'online' || t.session_type === 'both' || (t.formats && t.formats.includes('Online Video'));
    } else if (directoryFormatFilter === 'In-Person') {
      formatMatch = t.session_type === 'in-person' || t.session_type === 'both' || (t.formats && t.formats.includes('In-Person'));
    } else if (directoryFormatFilter === 'Online & In-Person') {
      formatMatch = t.session_type === 'both' || (t.formats && t.formats.includes('Online Video') && t.formats.includes('In-Person'));
    }

    return nameMatch && specMatch && langMatch && formatMatch;
  });

  const openBookingModal = async (therapist) => {
    setSelectedTherapistForBooking(therapist);
    const initialDate = getLocalDateString(1);
    const initialFormat = therapist.session_type === 'in-person' ? 'in-person' : 'online';
    setBookingForm({
      date: initialDate,
      timeSlot: '',
      sessionType: initialFormat
    });
    setBookingError('');
    setBookingSuccess('');
    setShowBookingModal(true);
    fetchBookedSlots(therapist.id, initialDate);
    fetchAvailableSlots(therapist.id, initialDate);
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
  const fetchAvailableSlots = async (therapistId, date) => {
    setSlotsLoading(true);
    try {
      const data = await getEffectiveAvailability(therapistId, date);
      const dayData = (data.days || []).find(d => d.date === date);
      setSelectedDayAvailability(dayData || null);
      const slots = (dayData?.slots || []).map(s => s.label || formatSlotLabel(s.start_time, s.end_time));
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Failed to load therapist availability', err);
      setSelectedDayAvailability(null);
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
    const bookingData = {
      therapist_id: selectedTherapistForBooking.id,
      appointment_date: bookingForm.date,
      time_slot: bookingForm.timeSlot,
      session_type: bookingForm.sessionType
    };
    try {
      const result = await bookAppointment(bookingData);
      setBookingSuccess('Appointment confirmed successfully!');

      // Immediately mark slot as booked in modal
      setBookedSlots(prev => [...prev, bookingForm.timeSlot]);

      // Re-fetch appointments from backend
      try {
        const updatedAppointments = await getAppointments();
        if (Array.isArray(updatedAppointments)) {
          setAppointments(updatedAppointments);
        }
      } catch (e) {
        const newAppt = {
          id: result.appointmentId || Date.now(),
          therapist_id: selectedTherapistForBooking.id,
          therapist_name: selectedTherapistForBooking.name,
          therapist_specialties: Array.isArray(selectedTherapistForBooking.specialties) ? selectedTherapistForBooking.specialties.join(', ') : selectedTherapistForBooking.specialties,
          session_type: bookingForm.sessionType,
          appointment_date: bookingForm.date,
          time_slot: bookingForm.timeSlot,
          status: 'confirmed',
          profile_photo_url: selectedTherapistForBooking.profile_photo_url || ''
        };
        setAppointments(prev => [newAppt, ...prev]);
      }

      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess('');
        setBookingForm(prev => ({ ...prev, timeSlot: '' }));
      }, 1500);
    } catch (err) {
      const keys = Object.keys(selectedTherapistForBooking || {}).join(',');
      setBookingError(`Failed: ${err.response?.data?.message || 'Error'} (Payload: ${JSON.stringify(bookingData)}) (Therapist keys: ${keys})`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await cancelAppointment(appointmentId);
      const data = await getAppointments();
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
      setCancelNotification("Appointment canceled successfully.");
      setTimeout(() => setCancelNotification(null), 5000);
    } catch (err) {
      setCancelNotification(err.response?.data?.message || "Could not cancel this appointment.");
      setTimeout(() => setCancelNotification(null), 5000);
    }
  };

  const openReviewModal = (appt) => {
    setReviewTherapist({
      id: appt.therapist_id,
      name: appt.therapist_name,
      specialties: appt.therapist_specialties
    });
    setReviewAppointmentId(appt.id);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (reviewPayload) => {
    await submitReview(reviewPayload);
    setPendingReview(null);
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
          <div className="user-profile-tile-wrapper" ref={profileDropdownRef} style={{ position: 'relative' }}>
            <div className="user-profile-tile" onClick={() => setShowProfileDropdown(!showProfileDropdown)} style={{ cursor: 'pointer' }}>
              <div className="avatar-circle-sm">
                {patientUser.profile_photo_url ? (
                  <img src={getPhotoUrl(patientUser.profile_photo_url)} alt={patientUser.name} className="avatar-photo" />
                ) : (
                  getInitials(patientUser.name)
                )}
              </div>
              <span className="profile-name-text">{patientUser.name}</span>
            </div>
            {showProfileDropdown && (
              <div className="profile-dropdown-card dashboard-card" style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '320px',
                zIndex: 1000,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="profile-snapshot-tile" style={{ marginBottom: '16px' }}>
                  <div className="avatar-circle-lg">
                    {patientUser.profile_photo_url ? (
                      <img src={getPhotoUrl(patientUser.profile_photo_url)} alt={patientUser.name} className="avatar-photo" />
                    ) : (
                      getInitials(patientUser.name)
                    )}
                  </div>
                  <div className="profile-snapshot-meta">
                    <h3 className="profile-snapshot-name" style={{ fontSize: '16px' }}>{patientUser.name}</h3>
                    <p className="profile-snapshot-role" style={{ fontSize: '13px' }}>Registered Patient Account</p>
                  </div>
                </div>
                <div className="profile-data-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div className="profile-data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="data-field-label" style={{ fontSize: '12px' }}><MapPin size={12} /> LOCATION:</span>
                    <span className="data-field-value" style={{ fontSize: '13px', fontWeight: '500' }}>{displayOrPlaceholder(patientUser.location)}</span>
                  </div>
                  <div className="profile-data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="data-field-label" style={{ fontSize: '12px' }}><Globe size={12} /> LANGUAGE:</span>
                    <span className="data-field-value" style={{ fontSize: '13px', fontWeight: '500' }}>{displayOrPlaceholder(patientUser.language)}</span>
                  </div>
                  <div className="profile-data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="data-field-label" style={{ fontSize: '12px' }}><Phone size={12} /> CONTACT:</span>
                    <span className="data-field-value" style={{ fontSize: '13px', fontWeight: '500' }}>{displayOrPlaceholder(patientUser.contact)}</span>
                  </div>
                  <div className="profile-data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="data-field-label" style={{ fontSize: '12px' }}><Video size={12} /> THERAPIST:</span>
                    <span className="data-field-value color-link-blue" style={{ fontSize: '13px', fontWeight: '500' }}>{displayOrPlaceholder(patientUser.therapist, 'No therapist assigned yet')}</span>
                  </div>
                </div>
                <button className="edit-profile-action-btn" onClick={() => {
                  setShowProfileDropdown(false);
                  openEditModal();
                }} style={{ width: '100%', justifyContent: 'center' }}>
                  <Settings size={16} /><span>Edit Profile Info</span>
                </button>
              </div>
            )}
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
            <div className="menu-item" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
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
            <div className="menu-item" onClick={() => navigate('/patient/prescriptions')} style={{ cursor: 'pointer' }}>
              <FileText size={18} /><span>My Prescriptions</span>
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
                <p className="banner-subtitle">
                  {streak > 0
                    ? `You're on a ${streak}-day care plan streak! Keep up the great progress.`
                    : 'Complete your daily tasks to start building your care streak!'}
                </p>
              </div>
              <div className="banner-right">
                {streak > 0 && (
                  <div className="streak-pill">★ {streak}-Day Streak</div>
                )}
                <div className="reminder-pill">
                  <Clock size={14} /><span>Next: Tomorrow 10:00 AM</span>
                </div>
              </div>
            </section>

            {/* Feature 12 extension: Follow-Up accept/decline prompt */}
            {pendingFollowUp && (
              <FollowUpPromptCard
                pendingFollowUp={pendingFollowUp}
                onResolved={(accepted) => {
                  setFollowUpNotice(accepted ? 'Follow-up accepted — your therapist has been notified.' : 'Follow-up declined.');
                  setPendingFollowUp(null);
                  setTimeout(() => setFollowUpNotice(''), 5000);
                }}
              />
            )}
            {followUpNotice && (
              <div className="followup-notice-banner">✓ {followUpNotice}</div>
            )}

            {/* Feature 7: Post-Session Review & Feedback Banner — Global Notification */}
            {pendingReview ? (
              <section className="dashboard-card span-12 feedback-alert-box" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="feedback-text-content">
                  <h4 className="feedback-alert-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} className="inline-icon warning" />
                    Pending Review: Past Session with {pendingReview.therapist_name}
                  </h4>
                  <p className="feedback-alert-subtitle" style={{ margin: 0, marginTop: '4px' }}>Please rate your experience from your last session to help our AI Matchmaker guide others.</p>
                </div>
                <div className="feedback-action-row" style={{ marginTop: 0 }}>
                  <button
                    className="rate-stars-btn"
                    onClick={() => openReviewModal && openReviewModal({
                      id: pendingReview.appointment_id,
                      therapist_id: pendingReview.therapist_id,
                      therapist_name: pendingReview.therapist_name,
                      therapist_specialties: pendingReview.therapist_specialties
                    })}
                  >
                    ★ Rate 1-5 Stars
                  </button>
                  <span
                    className="feedback-tags-label"
                    onClick={() => openReviewModal && openReviewModal({
                      id: pendingReview.appointment_id,
                      therapist_id: pendingReview.therapist_id,
                      therapist_name: pendingReview.therapist_name,
                      therapist_specialties: pendingReview.therapist_specialties
                    })}
                    style={{ cursor: 'pointer', marginLeft: '12px' }}
                  >
                    + Add Tags (#Communication, #Approach)
                  </span>
                </div>
              </section>
            ) : reviewSubmitted ? (
              <section className="dashboard-card span-12 feedback-alert-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 24px' }}>
                <div className="feedback-text-content">
                  <h4 className="feedback-alert-title" style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <CheckCircle size={18} color="#16a34a" /> Review Submitted{reviewTherapist?.name ? ` for ${reviewTherapist.name}` : ''}
                  </h4>
                  <p className="feedback-alert-subtitle" style={{ color: '#166534', margin: 0, marginTop: '4px', fontSize: '13px' }}>
                    Thank you! Your ratings and structured tags have updated our AI Matchmaker weighted signals.
                  </p>
                </div>
              </section>
            ) : null}

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
              pendingReview={pendingReview}
              reviewSubmitted={reviewSubmitted}
              lastReviewedTherapist={reviewTherapist}
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

              {/* Feature 6a: Care Plan Opt-In Prompt Card */}
              {pendingCarePlan && !carePlanDismissed && (
                <CarePlanPromptCard
                  pendingCarePlan={pendingCarePlan}
                  onAccepted={(newItems) => {
                    const formatted = newItems.map(item => ({
                      id: item.id,
                      text: item.title,
                      videoUrl: item.youtube_url || null,
                      dueDate: null,
                      dueTime: null,
                    }));
                    setChecklistItems(prev => [...formatted, ...prev]);
                    setPendingCarePlan(null);
                  }}
                  onDismiss={() => setCarePlanDismissed(true)}
                />
              )}

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

            {/* THERAPY ROADMAP SIDEBAR */}
            <TherapyRoadmapCard stats={progressStats} patientUser={patientUser} appointments={appointments} streak={streak} />

            {/* G. MY PROGRESS & JOURNEY */}
            <TherapyProgressCard stats={progressStats} patientUser={patientUser} appointments={appointments} streak={streak} />
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
        directoryFormatFilter={directoryFormatFilter}
        setDirectoryFormatFilter={setDirectoryFormatFilter}
        directoryFormatOptions={directoryFormatOptions}
        directoryLoading={directoryLoading}
        directoryError={directoryError}
        handleClearFilters={handleClearDirectoryFilters}
        handleRetryDirectory={handleRetryDirectory}
        filteredDirectoryTherapists={filteredDirectoryTherapists}
        totalTherapistsCount={directoryTherapists.length}
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
        selectedDayAvailability={selectedDayAvailability}
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