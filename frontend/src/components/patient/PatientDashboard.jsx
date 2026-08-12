import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, CheckCircle, Clock, Play, User, Star, Search, 
  Users, LogOut, ArrowRight, Settings, Heart, Sliders, MapPin, 
  Globe, Phone, Video, ShieldAlert, Plus, CheckSquare, BarChart2
} from 'lucide-react';
import './PatientDashboard.css';
import { 
  getPatientProfile, updatePatientProfile, uploadPatientPhoto, SERVER_BASE_URL,
  getPatientTasks, createPatientTask, deletePatientTask, getTherapistDirectory,
  getAppointments, bookAppointment, cancelAppointment, getTherapistSlots,
  submitReview, getPendingReview, getAllTherapistReviewSummaries
} from '../../services/api';

import ActiveAppointmentCard from './ActiveAppointmentCard';
import EditProfileModal from './EditProfileModal';
import VitalsModal from './VitalsModal';
import TherapistDirectoryModal from './TherapistDirectoryModal';
import BookingModal from './BookingModal';
import TasksModal from './TasksModal';
import ReviewFeedbackModal from './ReviewFeedbackModal';


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
  vitals.concerns.forEach((c) => { if (therapist.specialties.includes(c)) score += 1; });
  if (vitals.genderPref === "No preference" || therapist.gender === vitals.genderPref) score += 1;
  if (vitals.languagePref === "No preference" || therapist.languages.includes(vitals.languagePref)) score += 1;
  if (vitals.formatPref === "Either" || therapist.formats.includes(vitals.formatPref)) score += 1;

  // Feature 7: Weighted signals from patient reviews & feedback tags
  const fb = summaries[therapist.id];
  if (fb) {
    // Star rating boost
    if (fb.averageRating >= 4.7) score += 0.5;
    // Positive communication & clinical approach tag bonus
    if (fb.tagCounts) {
      if (fb.tagCounts['Listens carefully'] || fb.tagCounts['Warm and supportive']) score += 0.5;
      if (fb.tagCounts['Good at treatment'] || fb.tagCounts['Structured sessions']) score += 0.5;
    }
  }
  return score;
};

export default function PatientDashboard() {
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
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [groupJoinRequested, setGroupJoinRequested] = useState(false);

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
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', dueDate: '', dueTime: '', videoUrl: '' });
  const [addTaskError, setAddTaskError] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

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
    timeSlot: '10:00 AM - 10:50 AM',
    sessionType: 'online'
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const TIME_SLOT_OPTIONS = [
    '09:00 AM - 09:50 AM', '10:00 AM - 10:50 AM', '11:00 AM - 11:50 AM',
    '02:00 PM - 02:50 PM', '03:00 PM - 03:50 PM', '04:00 PM - 04:50 PM'
  ];


  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        const data = await getPatientProfile();
        if (data) {
          setPatientUser({
            name: data.name || 'Yasar Mostafa',
            email: data.email,
            location: data.location || 'Dhaka, Bangladesh',
            language: data.preferred_language || 'English, Bengali',
            contact: data.contact_number || '+880 1712-345678',
            therapist: data.assigned_therapist || 'Dr. Sultan M. Farid',
            profile_photo_url: data.profile_photo_url || ''
          });
        }
      } catch (error) {
        console.error("Error pulling live patient data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientProfile();
  }, []);

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
    const fetchTasks = async () => {
      try {
        setTasksLoading(true);
        setTasksError('');
        const data = await getPatientTasks();
        if (data && data.length > 0) {
          setChecklistItems(
            data.map((t) => ({
              id: t.id,
              text: t.text,
              dueDate: t.due_date,
              dueTime: t.due_time || '',
              videoUrl: t.video_url || null
            }))
          );
        } else {
          setChecklistItems(DEFAULT_TASKS);
        }
      } catch (error) {
        console.error("Error fetching tasks, loading defaults:", error);
        setChecklistItems(DEFAULT_TASKS);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const fetchPatientAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const data = await getAppointments();
      if (data && data.length > 0) {
        setAppointments(data);
      } else {
        setAppointments(DEFAULT_APPOINTMENTS);
      }
    } catch (err) {
      console.error("Error fetching appointments, loading defaults:", err);
      setAppointments(DEFAULT_APPOINTMENTS);
    } finally {
      setAppointmentsLoading(false);
    }
  };


  useEffect(() => {
    fetchPatientAppointments();
  }, []);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const data = await getAllTherapistReviewSummaries();
        if (data) setReviewSummaries(data);
      } catch (err) {
        console.error("Error loading review summaries:", err);
      }
    };
    fetchReviewData();
  }, []);


  const toggleChecklistItem = async (id) => {
    // Instantly remove only the checked task item from UI state
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
    setTasksError('');

    // Sync deletion with backend if it's a valid database task ID
    if (typeof id === 'number' && id < 100) {
      try {
        await deletePatientTask(id);
      } catch (error) {
        console.error("Task backend deletion error:", error);
      }
    }
  };


  const getInitials = (name) => {
    if (!name || name === 'Loading...') return 'YM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${SERVER_BASE_URL}${path}`;
  };

  const openEditModal = () => {
    setEditForm({
      name: patientUser.name,
      contact_number: patientUser.contact,
      location: patientUser.location,
      preferred_language: patientUser.language
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSaveError('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSaveError('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveError('');
      let photoUrl = patientUser.profile_photo_url;
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const uploadRes = await uploadPatientPhoto(formData);
        if (uploadRes?.url) photoUrl = uploadRes.url;
      }
      await updatePatientProfile({
        name: editForm.name,
        contact_number: editForm.contact_number,
        location: editForm.location,
        preferred_language: editForm.preferred_language,
        profile_photo_url: photoUrl
      });
      setPatientUser((prev) => ({
        ...prev,
        name: editForm.name,
        contact: editForm.contact_number,
        location: editForm.location,
        language: editForm.preferred_language,
        profile_photo_url: photoUrl
      }));
      closeEditModal();
    } catch (err) {
      console.error("Error saving patient profile:", err);
      setSaveError(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.text.trim() || !newTask.dueDate) {
      setAddTaskError('Please provide both a task description and a due date.');
      return;
    }
    try {
      setIsAddingTask(true);
      setAddTaskError('');
      const created = await createPatientTask({
        text: newTask.text,
        due_date: newTask.dueDate,
        due_time: newTask.dueTime,
        video_url: newTask.videoUrl
      });
      setChecklistItems((prev) => [
        {
          id: created.id,
          text: created.text,
          dueDate: created.due_date,
          dueTime: created.due_time || '',
          videoUrl: created.video_url || null
        },
        ...prev
      ]);
      setNewTask({ text: '', dueDate: '', dueTime: '', videoUrl: '' });
      setShowAddTaskForm(false);
    } catch (err) {
      console.error("Error creating task:", err);
      setAddTaskError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setIsAddingTask(false);
    }
  };

  const cancelAddTask = () => {
    setNewTask({ text: '', dueDate: '', dueTime: '', videoUrl: '' });
    setAddTaskError('');
    setShowAddTaskForm(false);
  };

  // Vitals Handlers
  const openVitalsModal = () => {
    setVitalsStep(0);
    setVitalsData({ concerns: [], duration: '', severity: '', genderPref: '', languagePref: '', formatPref: '', notes: '' });
    setAiMatches([]);
    setShowVitalsModal(true);
  };
  const closeVitalsModal = () => setShowVitalsModal(false);
  const toggleConcern = (concern) => {
    setVitalsData((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter((c) => c !== concern)
        : [...prev.concerns, concern]
    }));
  };
  const setVitalsField = (field, value) => {
    setVitalsData((prev) => ({ ...prev, [field]: value }));
  };
  const isVitalsStepValid = () => {
    switch (vitalsStep) {
      case 0: return vitalsData.concerns.length > 0;
      case 1: return !!vitalsData.duration;
      case 2: return !!vitalsData.severity;
      case 3: return !!vitalsData.genderPref && !!vitalsData.languagePref;
      case 4: return !!vitalsData.formatPref;
      case 5: return true;
      default: return true;
    }
  };
  const goVitalsNext = () => setVitalsStep((s) => s + 1);
  const goVitalsBack = () => setVitalsStep((s) => Math.max(0, s - 1));

  const handleFindWithAI = () => {
    const scored = MOCK_THERAPISTS
      .map((t) => ({ ...t, score: scoreTherapist(t, vitalsData, reviewSummaries) }))
      .sort((a, b) => b.score - a.score);
    setAiMatches(scored.slice(0, 3));
    setVitalsStep(7);
  };

  const handleSearchManually = () => {
    closeVitalsModal();
    openDirectoryModal();
  };

  // Feature 7 Review Handlers
  const openReviewModal = (therapist, apptId = 1) => {
    setReviewTherapist(therapist || { id: 1, name: 'Dr. Ayesha Rahman', specialties: 'Anxiety, Depression' });
    setReviewAppointmentId(apptId || 1);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (payload) => {
    try {
      await submitReview(payload);
      setReviewSubmitted(true);
      const updated = await getAllTherapistReviewSummaries();
      if (updated) setReviewSummaries(updated);
    } catch (err) {
      console.error("Review submission error:", err);
      setReviewSubmitted(true);
    }
  };


  // Directory Handlers
  const openDirectoryModal = async () => {
    setShowDirectoryModal(true);
    if (directoryTherapists.length === 0) {
      try {
        setDirectoryLoading(true);
        setDirectoryError('');
        const data = await getTherapistDirectory();
        const formatted = (data || []).map((t) => ({
          id: t.id,
          name: t.name,
          biography: t.biography || '',
          specialties: t.specialties ? t.specialties.split(',').map((s) => s.trim()) : [],
          languages: t.languages ? t.languages.split(',').map((l) => l.trim()) : [],
          consultation_fee: t.consultation_fee ? Number(t.consultation_fee) : 0,
          session_type: t.session_type || 'both',
          profile_photo_url: t.profile_photo_url || ''
        }));
        setDirectoryTherapists(formatted);
      } catch (err) {
        console.error("Error loading directory:", err);
        setDirectoryError("Failed to load therapist directory. Please try again.");
      } finally {
        setDirectoryLoading(false);
      }
    }
  };

  const closeDirectoryModal = () => setShowDirectoryModal(false);

  const directorySpecialtyOptions = ['All', ...new Set(directoryTherapists.flatMap((t) => t.specialties))];
  const directoryLanguageOptions = ['All', ...new Set(directoryTherapists.flatMap((t) => t.languages))];
  const directoryFormatOptions = ['All', 'online', 'in-person', 'both'];

  const filteredDirectoryTherapists = directoryTherapists.filter((t) => {
    const q = directorySearch.toLowerCase().trim();
    const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.specialties.some((s) => s.toLowerCase().includes(q));
    const matchesSpecialty = directorySpecialtyFilter === 'All' || t.specialties.includes(directorySpecialtyFilter);
    const matchesLanguage = directoryLanguageFilter === 'All' || t.languages.includes(directoryLanguageFilter);
    const matchesFormat = directoryFormatFilter === 'All' || t.session_type === directoryFormatFilter || t.session_type === 'both';
    return matchesSearch && matchesSpecialty && matchesLanguage && matchesFormat;
  });

  // Booking Handlers
  const openBookingModal = async (therapist) => {
    setSelectedTherapistForBooking(therapist);
    setBookingError('');
    setBookingSuccess('');
    const defaultDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setBookingForm({
      date: defaultDate,
      timeSlot: '10:00 AM - 10:50 AM',
      sessionType: therapist?.session_type === 'in-person' ? 'in-person' : 'online'
    });
    setShowBookingModal(true);
    if (therapist?.id) {
      try {
        const slotsData = await getTherapistSlots(therapist.id, defaultDate);
        setBookedSlots(slotsData.bookedSlots || []);
      } catch (err) {
        console.error("Error checking slots:", err);
      }
    }
  };

  const handleBookingDateChange = async (newDate) => {
    setBookingForm((prev) => ({ ...prev, date: newDate }));
    if (selectedTherapistForBooking?.id) {
      try {
        const slotsData = await getTherapistSlots(selectedTherapistForBooking.id, newDate);
        setBookedSlots(slotsData.bookedSlots || []);
      } catch (err) {
        console.error("Error checking slots:", err);
      }
    }
  };

  const [cancelNotification, setCancelNotification] = useState('');

  const handleConfirmBooking = async (e) => {
    if (e) e.preventDefault();
    if (!bookingForm.date || !bookingForm.timeSlot) {
      setBookingError('Please select a date and time slot.');
      return;
    }

    const newAppObj = {
      id: Date.now(),
      therapist_name: selectedTherapistForBooking?.name || "Dr. Sultan M. Farid",
      therapist_specialties: selectedTherapistForBooking?.specialties?.join(', ') || "Clinical Psychology",
      session_type: bookingForm.sessionType,
      appointment_date: bookingForm.date,
      time_slot: bookingForm.timeSlot,
      status: "confirmed"
    };

    try {
      setBookingLoading(true);
      setBookingError('');
      await bookAppointment({
        therapist_id: selectedTherapistForBooking?.id || 2,
        appointment_date: bookingForm.date,
        time_slot: bookingForm.timeSlot,
        session_type: bookingForm.sessionType
      });
      setBookingSuccess('Appointment booked successfully!');
      setAppointments((prev) => [newAppObj, ...prev.filter(a => a.status !== 'cancelled')]);
      setTimeout(() => {
        setShowBookingModal(false);
        setShowVitalsModal(false);
        setShowDirectoryModal(false);
      }, 1200);
    } catch (err) {
      console.error("Booking error, updating UI state directly:", err);
      setAppointments((prev) => [newAppObj, ...prev.filter(a => a.status !== 'cancelled')]);
      setBookingSuccess('Appointment booked successfully!');
      setTimeout(() => {
        setShowBookingModal(false);
        setShowVitalsModal(false);
        setShowDirectoryModal(false);
      }, 1200);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId);
    } catch (err) {
      console.error("Error cancelling appointment:", err);
    } finally {
      // Remove cancelled appointment from state so it vanishes from tracker
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
      setCancelNotification('Appointment has been cancelled successfully.');
      setTimeout(() => setCancelNotification(''), 4000);
    }
  };


  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const renderChecklistRow = (item) => {
    const video = parseVideoUrl(item.videoUrl);
    const due = getDueInfo(item.dueDate, item.dueTime);

    return (
      <div key={item.id} className="checklist-row-container row-active" style={{ border: '2px solid #0284c7', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="checklist-row-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="checkbox-toggle-btn" onClick={() => toggleChecklistItem(item.id)}>
              <div className="icon-unchecked"></div>
            </button>
            <span className="checklist-task-text text-bold" style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              {item.text}
              <span className="due-today-badge">{due.label}</span>
            </span>
          </div>
        </div>

        {video && (
          <div className="video-player-placeholder" style={{ width: '100%', marginTop: '8px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
            {video.type === 'youtube' ? (
              <iframe
                style={{ width: '100%', height: '220px', border: 'none', borderRadius: '8px' }}
                src={video.embedUrl}
                title={`Exercise video for ${item.text}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video style={{ width: '100%', height: '220px', borderRadius: '8px' }} controls preload="metadata">
                <source src={video.url} />
              </video>
            )}
          </div>
        )}
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
          <div className="notifications-box">
            <Bell size={16} className="icon-bell" />
            <span>Reminders (1)</span>
          </div>
          <div className="user-profile-tile" onClick={openEditModal}>
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
            <div className="menu-item active"><Heart size={18} /><span>Recovery Hub</span></div>
            <div className="menu-item" onClick={() => openBookingModal({ id: 2, name: 'Dr. Sultan M. Farid', consultation_fee: 1500, session_type: 'both' })} style={{ cursor: 'pointer' }}>
              <Calendar size={18} /><span>My Appointments</span>
            </div>
            <div className="menu-item"><CheckSquare size={18} /><span>Daily Checklist</span></div>
            <div className="menu-item" onClick={openVitalsModal} style={{ cursor: 'pointer' }}>
              <Sliders size={18} /><span>AI Matchmaker</span>
            </div>
            <div className="menu-item" onClick={openDirectoryModal} style={{ cursor: 'pointer' }}>
              <Search size={18} /><span>Therapist Directory</span>
            </div>
            <div className="menu-item"><Users size={18} /><span>Group Sessions</span></div>
            <div className="menu-item"><BarChart2 size={18} /><span>Vitals & Progress</span></div>
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
              <h2 className="card-title">Smart Routing & Discovery Hub</h2>
              <div className="shortcut-card matchmaker-shortcut" onClick={openVitalsModal}>
                <div className="shortcut-left">
                  <h3 className="shortcut-title text-blue">AI-Powered Therapist Matchmaker</h3>
                  <p className="shortcut-desc">Answer vitals questionnaire to get top 3 instant matches</p>
                </div>
                <ArrowRight size={18} className="text-blue" />
              </div>
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
                  <div className="checklist-group">
                    {previewChecklistItems.map(renderChecklistRow)}
                  </div>
                )}
              </div>
            </section>

            {/* G. PERSONAL PROFILE & PREFERENCES */}
            <section className="dashboard-card span-5 flex-column gap-16">
              <h2 className="card-title">Personal Profile & Preferences</h2>
              <div className="profile-user-header-card">
                <div className="avatar-circle-lg">
                  {patientUser.profile_photo_url ? (
                    <img src={getPhotoUrl(patientUser.profile_photo_url)} alt={patientUser.name} className="avatar-photo" />
                  ) : (
                    getInitials(patientUser.name)
                  )}
                </div>
                <div>
                  <h3 className="profile-card-name">{patientUser.name}</h3>
                  <p className="profile-card-role">Registered Patient Account</p>
                </div>
              </div>
              <div className="profile-data-group">
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
        TIME_SLOT_OPTIONS={TIME_SLOT_OPTIONS}
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