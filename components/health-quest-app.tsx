"use client"

import type React from "react"

import { useState, useEffect, useReducer, useRef } from "react"
import {
  Cloud,
  Thermometer,
  AlertTriangle,
  Award,
  User,
  MapPin,
  Shield,
  Check,
  Info,
  Zap,
  Heart,
  Trophy,
  Star,
  Hospital,
  Calendar,
  Clock,
  Layers,
  Navigation,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Satellite,
  MapIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

// Types
type RiskZone = {
  id: string
  type: "pollution" | "heat" | "mosquito" | "safe"
  name: string
  description: string
  position: { top: string; left: string }
  hpImpact: number
  icon: JSX.Element
  color: string
  satelliteData?: {
    source: "Copernicus" | "Galileo" | "EGNOS"
    reading: string
    timestamp: string
  }
}

type Quest = {
  id: number
  title: string
  description: string
  reward: {
    xp: number
    badge?: string
  }
  progress: number
  icon: JSX.Element
  difficulty: "Easy" | "Medium" | "Hard"
  timeLeft: string
  riskAreas: string[]
  lore: string
  type: "personal" | "community"
  isActive: boolean
  isCompleted: boolean
  objective: {
    type: "avoid" | "visit" | "maintain"
    target: string
    count: number
    current: number
  }
}

type UserStats = {
  level: number
  xp: number
  xpToNextLevel: number
  hp: number
  maxHp: number
  questsCompleted: number
  hpSaved: number
  riskAreasAvoided: number
  communityQuestsCompleted: number
  badges: string[]
  unlockedLore: string[]
}

type Hospital = {
  id: string
  name: string
  position: { lat: number; lng: number }
  address: string
  distance: number
  travelTime: number
  availableDoctors: number
  specialties: string[]
  waitTime: string
  satelliteData: {
    source: "Copernicus" | "Galileo" | "EGNOS"
    accuracy: string
  }
}

type Doctor = {
  id: string
  name: string
  specialty: string
  hospitalId: string
  hospitalName: string
  avatar: string
  rating: number
  availableSlots: {
    date: string
    times: string[]
  }[]
  experience: string
  about: string
}

type SymptomCheckerState = {
  symptoms: string[]
  assessment: "low" | "medium" | "high" | null
  recommendation: string
  suggestedSpecialties: string[]
}

type GameState = {
  user: UserStats
  quests: Quest[]
  activeRiskZone: RiskZone | null
  notifications: string[]
  position: { x: number; y: number }
  isMoving: boolean
  showTutorial: boolean
  tutorialStep: number
  mapMode: "adventure" | "satellite"
  selectedHospital: Hospital | null
  symptomChecker: SymptomCheckerState
  nearbyHospitals: Hospital[]
  availableDoctors: Doctor[]
  selectedDoctor: Doctor | null
}

type GameAction =
  | { type: "MOVE_PLAYER"; payload: { x: number; y: number } }
  | { type: "ENTER_RISK_ZONE"; payload: RiskZone }
  | { type: "EXIT_RISK_ZONE" }
  | { type: "UPDATE_HP"; payload: number }
  | { type: "ACTIVATE_QUEST"; payload: number }
  | { type: "UPDATE_QUEST_PROGRESS"; payload: { id: number; progress: number } }
  | { type: "COMPLETE_QUEST"; payload: number }
  | { type: "ADD_XP"; payload: number }
  | { type: "LEVEL_UP" }
  | { type: "ADD_NOTIFICATION"; payload: string }
  | { type: "CLEAR_NOTIFICATION"; payload: number }
  | { type: "NEXT_TUTORIAL_STEP" }
  | { type: "COMPLETE_TUTORIAL" }
  | { type: "TOGGLE_MAP_MODE" }
  | { type: "SELECT_HOSPITAL"; payload: Hospital | null }
  | { type: "ADD_SYMPTOM"; payload: string }
  | { type: "REMOVE_SYMPTOM"; payload: string }
  | {
      type: "SET_ASSESSMENT"
      payload: { assessment: "low" | "medium" | "high"; recommendation: string; specialties: string[] }
    }
  | { type: "CLEAR_SYMPTOMS" }
  | { type: "LOAD_DOCTORS"; payload: Doctor[] }
  | { type: "SELECT_DOCTOR"; payload: Doctor | null }
  | { type: "BOOK_APPOINTMENT"; payload: { doctorId: string; date: string; time: string } }

// Initial state
const initialRiskZones: RiskZone[] = [
  {
    id: "pollution-1",
    type: "pollution",
    name: "Smog Zone",
    description: "High pollution area with reduced visibility and air quality",
    position: { top: "30%", left: "40%" },
    hpImpact: -5,
    icon: <Cloud className="h-6 w-6" />,
    color: "red",
    satelliteData: {
      source: "Copernicus",
      reading: "PM2.5: 85μg/m³ (Unhealthy)",
      timestamp: "Updated 15 min ago",
    },
  },
  {
    id: "heat-1",
    type: "heat",
    name: "Heat Zone",
    description: "Extreme temperature area with high UV exposure",
    position: { top: "50%", left: "70%" },
    hpImpact: -3,
    icon: <Thermometer className="h-6 w-6" />,
    color: "amber",
    satelliteData: {
      source: "Galileo",
      reading: "Temperature: 38°C, UV Index: Very High",
      timestamp: "Updated 5 min ago",
    },
  },
  {
    id: "mosquito-1",
    type: "mosquito",
    name: "Mosquito Zone",
    description: "High risk area for mosquito-borne diseases",
    position: { top: "65%", left: "30%" },
    hpImpact: -2,
    icon: <AlertTriangle className="h-6 w-6" />,
    color: "purple",
    satelliteData: {
      source: "EGNOS",
      reading: "Standing water detected, humidity: 85%",
      timestamp: "Updated 30 min ago",
    },
  },
  {
    id: "safe-1",
    type: "safe",
    name: "Safe Zone",
    description: "Protected area with clean air and moderate temperature",
    position: { top: "20%", left: "20%" },
    hpImpact: 2,
    icon: <Shield className="h-6 w-6" />,
    color: "emerald",
    satelliteData: {
      source: "Copernicus",
      reading: "Air Quality: Good, Temperature: 22°C",
      timestamp: "Updated 10 min ago",
    },
  },
]

const initialQuests: Quest[] = [
  {
    id: 1,
    title: "Dodge the Smog Monster",
    description: "Stay out of pollution zones for 2 minutes",
    reward: {
      xp: 50,
      badge: "Clean Air",
    },
    progress: 0,
    icon: <Cloud className="h-5 w-5" />,
    difficulty: "Medium",
    timeLeft: "4 hours",
    riskAreas: ["Downtown", "Industrial Zone"],
    lore: "The Smog Monster weakens lungs with polluted air. It's most active during rush hour and hot afternoons.",
    type: "personal",
    isActive: false,
    isCompleted: false,
    objective: {
      type: "avoid",
      target: "pollution",
      count: 100,
      current: 0,
    },
  },
  {
    id: 2,
    title: "Mosquito-Free Zone",
    description: "Avoid high-risk areas for mosquito-borne diseases",
    reward: {
      xp: 75,
      badge: "Bug Slayer",
    },
    progress: 0,
    icon: <AlertTriangle className="h-5 w-5" />,
    difficulty: "Hard",
    timeLeft: "2 days",
    riskAreas: ["Park", "Riverside"],
    lore: "Mosquito swarms carry tiny health debuffs that can stack over time. They're most active at dawn and dusk near standing water.",
    type: "personal",
    isActive: false,
    isCompleted: false,
    objective: {
      type: "avoid",
      target: "mosquito",
      count: 120,
      current: 0,
    },
  },
  {
    id: 3,
    title: "Heat Wave Warrior",
    description: "Stay cool during extreme temperature alerts",
    reward: {
      xp: 40,
      badge: "Cool Head",
    },
    progress: 0,
    icon: <Thermometer className="h-5 w-5" />,
    difficulty: "Easy",
    timeLeft: "Today",
    riskAreas: ["Open Areas", "Concrete Jungle"],
    lore: "The Heat Wave Dragon drains HP rapidly when you're exposed. Seek shelter in cool buildings to recover.",
    type: "personal",
    isActive: false,
    isCompleted: false,
    objective: {
      type: "avoid",
      target: "heat",
      count: 80,
      current: 0,
    },
  },
  {
    id: 4,
    title: "Clear the City's Air",
    description: "Join forces with other players to reduce exposure to air pollution",
    reward: {
      xp: 100,
      badge: "City Badge",
    },
    progress: 45,
    icon: <Cloud className="h-5 w-5" />,
    difficulty: "Medium",
    timeLeft: "5 days",
    riskAreas: ["Downtown", "Industrial Zone"],
    lore: "When citizens work together, even the mighty Smog Monster retreats. Community action creates lasting change.",
    type: "community",
    isActive: true,
    isCompleted: false,
    objective: {
      type: "avoid",
      target: "pollution",
      count: 500,
      current: 225,
    },
  },
]

const initialUserStats: UserStats = {
  level: 7,
  xp: 650,
  xpToNextLevel: 1000,
  hp: 85,
  maxHp: 100,
  questsCompleted: 24,
  hpSaved: 1250,
  riskAreasAvoided: 37,
  communityQuestsCompleted: 5,
  badges: ["Clean Air", "Bug Slayer", "Heat Wave", "Explorer", "First Aid"],
  unlockedLore: ["The Smog Monster", "Mosquito Swarms", "Heat Wave Dragon"],
}

const initialHospitals: Hospital[] = [
  {
    id: "hosp-1",
    name: "City General Hospital",
    position: { lat: 35.6895, lng: 139.6917 },
    address: "123 Main Street, Downtown",
    distance: 2.3,
    travelTime: 15,
    availableDoctors: 8,
    specialties: ["General Medicine", "Emergency", "Cardiology", "Pediatrics"],
    waitTime: "~25 minutes",
    satelliteData: {
      source: "Galileo",
      accuracy: "±2m",
    },
  },
  {
    id: "hosp-2",
    name: "Riverside Medical Center",
    position: { lat: 35.6935, lng: 139.7035 },
    address: "456 River Road, Eastside",
    distance: 4.1,
    travelTime: 22,
    availableDoctors: 5,
    specialties: ["General Medicine", "Orthopedics", "Neurology"],
    waitTime: "~10 minutes",
    satelliteData: {
      source: "EGNOS",
      accuracy: "±3m",
    },
  },
  {
    id: "hosp-3",
    name: "Westside Health Clinic",
    position: { lat: 35.6845, lng: 139.6837 },
    address: "789 West Avenue, Westside",
    distance: 1.8,
    travelTime: 12,
    availableDoctors: 3,
    specialties: ["General Medicine", "Dermatology", "Psychology"],
    waitTime: "~5 minutes",
    satelliteData: {
      source: "Copernicus",
      accuracy: "±5m",
    },
  },
]

const initialDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Johnson",
    specialty: "General Medicine",
    hospitalId: "hosp-1",
    hospitalName: "City General Hospital",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.8,
    availableSlots: [
      {
        date: "Today",
        times: ["14:30", "15:45", "16:30"],
      },
      {
        date: "Tomorrow",
        times: ["09:15", "11:00", "14:00", "16:15"],
      },
    ],
    experience: "12 years",
    about: "Specializes in preventive care and chronic disease management.",
  },
  {
    id: "doc-2",
    name: "Dr. Michael Chen",
    specialty: "Cardiology",
    hospitalId: "hosp-1",
    hospitalName: "City General Hospital",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.9,
    availableSlots: [
      {
        date: "Today",
        times: ["15:00"],
      },
      {
        date: "Tomorrow",
        times: ["10:30", "13:45", "15:30"],
      },
    ],
    experience: "15 years",
    about: "Expert in heart conditions and cardiovascular health.",
  },
  {
    id: "doc-3",
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrics",
    hospitalId: "hosp-1",
    hospitalName: "City General Hospital",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.7,
    availableSlots: [
      {
        date: "Today",
        times: ["14:00", "16:00"],
      },
      {
        date: "Tomorrow",
        times: ["09:00", "10:30", "11:45", "14:30"],
      },
    ],
    experience: "8 years",
    about: "Dedicated to children's health and development.",
  },
  {
    id: "doc-4",
    name: "Dr. James Wilson",
    specialty: "Emergency Medicine",
    hospitalId: "hosp-1",
    hospitalName: "City General Hospital",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.6,
    availableSlots: [
      {
        date: "Today",
        times: ["13:00", "17:30"],
      },
      {
        date: "Tomorrow",
        times: ["08:30", "12:15", "16:45"],
      },
    ],
    experience: "10 years",
    about: "Experienced in handling all types of medical emergencies.",
  },
  {
    id: "doc-5",
    name: "Dr. Lisa Park",
    specialty: "Dermatology",
    hospitalId: "hosp-3",
    hospitalName: "Westside Health Clinic",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.9,
    availableSlots: [
      {
        date: "Today",
        times: ["15:15"],
      },
      {
        date: "Tomorrow",
        times: ["10:00", "11:30", "14:45"],
      },
    ],
    experience: "9 years",
    about: "Specializes in skin conditions and treatments.",
  },
  {
    id: "doc-6",
    name: "Dr. Robert Taylor",
    specialty: "Orthopedics",
    hospitalId: "hosp-2",
    hospitalName: "Riverside Medical Center",
    avatar: "/placeholder.svg?height=80&width=80",
    rating: 4.7,
    availableSlots: [
      {
        date: "Today",
        times: ["14:00", "16:30"],
      },
      {
        date: "Tomorrow",
        times: ["09:30", "11:15", "15:00"],
      },
    ],
    experience: "14 years",
    about: "Expert in bone and joint conditions and sports injuries.",
  },
]

const initialSymptomCheckerState: SymptomCheckerState = {
  symptoms: [],
  assessment: null,
  recommendation: "",
  suggestedSpecialties: [],
}

const initialState: GameState = {
  user: initialUserStats,
  quests: initialQuests,
  activeRiskZone: null,
  notifications: [],
  position: { x: 50, y: 45 },
  isMoving: false,
  showTutorial: true,
  tutorialStep: 0,
  mapMode: "adventure",
  selectedHospital: null,
  symptomChecker: initialSymptomCheckerState,
  nearbyHospitals: initialHospitals,
  availableDoctors: [],
  selectedDoctor: null,
}

// Reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE_PLAYER":
      return {
        ...state,
        position: action.payload,
        isMoving: true,
      }

    case "ENTER_RISK_ZONE":
      return {
        ...state,
        activeRiskZone: action.payload,
        notifications: [
          ...state.notifications,
          `Entered ${action.payload.name}: ${action.payload.hpImpact > 0 ? "+" : ""}${action.payload.hpImpact} HP`,
        ],
      }

    case "EXIT_RISK_ZONE":
      return {
        ...state,
        activeRiskZone: null,
      }

    case "UPDATE_HP":
      const newHp = Math.max(0, Math.min(state.user.maxHp, state.user.hp + action.payload))
      return {
        ...state,
        user: {
          ...state.user,
          hp: newHp,
        },
      }

    case "ACTIVATE_QUEST":
      return {
        ...state,
        quests: state.quests.map((quest) => (quest.id === action.payload ? { ...quest, isActive: true } : quest)),
        notifications: [
          ...state.notifications,
          `Quest activated: ${state.quests.find((q) => q.id === action.payload)?.title}`,
        ],
      }

    case "UPDATE_QUEST_PROGRESS":
      const updatedQuests = state.quests.map((quest) =>
        quest.id === action.payload.id
          ? {
              ...quest,
              progress: action.payload.progress,
              objective: {
                ...quest.objective,
                current: Math.floor((action.payload.progress / 100) * quest.objective.count),
              },
            }
          : quest,
      )

      return {
        ...state,
        quests: updatedQuests,
      }

    case "COMPLETE_QUEST":
      const completedQuest = state.quests.find((q) => q.id === action.payload)
      const questsWithCompleted = state.quests.map((quest) =>
        quest.id === action.payload ? { ...quest, isCompleted: true, isActive: false, progress: 100 } : quest,
      )

      let updatedUserStats = { ...state.user }

      if (completedQuest) {
        updatedUserStats = {
          ...updatedUserStats,
          xp: updatedUserStats.xp + completedQuest.reward.xp,
          questsCompleted: updatedUserStats.questsCompleted + 1,
          badges: completedQuest.reward.badge
            ? [...updatedUserStats.badges, completedQuest.reward.badge]
            : updatedUserStats.badges,
          unlockedLore: [...updatedUserStats.unlockedLore, completedQuest.title],
        }

        if (completedQuest.type === "community") {
          updatedUserStats.communityQuestsCompleted += 1
        }
      }

      return {
        ...state,
        quests: questsWithCompleted,
        user: updatedUserStats,
        notifications: [
          ...state.notifications,
          `Quest completed: ${completedQuest?.title}! +${completedQuest?.reward.xp} XP`,
        ],
      }

    case "ADD_XP":
      return {
        ...state,
        user: {
          ...state.user,
          xp: state.user.xp + action.payload,
        },
      }

    case "LEVEL_UP":
      return {
        ...state,
        user: {
          ...state.user,
          level: state.user.level + 1,
          xp: state.user.xp - state.user.xpToNextLevel,
          xpToNextLevel: Math.floor(state.user.xpToNextLevel * 1.5),
          maxHp: state.user.maxHp + 10,
          hp: state.user.maxHp + 10, // Full health on level up
        },
        notifications: [...state.notifications, `Level Up! You are now level ${state.user.level + 1}`],
      }

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }

    case "CLEAR_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((_, i) => i !== action.payload),
      }

    case "NEXT_TUTORIAL_STEP":
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
      }

    case "COMPLETE_TUTORIAL":
      return {
        ...state,
        showTutorial: false,
        tutorialStep: 0,
      }

    case "TOGGLE_MAP_MODE":
      return {
        ...state,
        mapMode: state.mapMode === "adventure" ? "satellite" : "adventure",
      }

    case "SELECT_HOSPITAL":
      return {
        ...state,
        selectedHospital: action.payload,
        availableDoctors: action.payload
          ? initialDoctors.filter((doctor) => doctor.hospitalId === action.payload.id)
          : [],
      }

    case "ADD_SYMPTOM":
      return {
        ...state,
        symptomChecker: {
          ...state.symptomChecker,
          symptoms: [...state.symptomChecker.symptoms, action.payload],
        },
      }

    case "REMOVE_SYMPTOM":
      return {
        ...state,
        symptomChecker: {
          ...state.symptomChecker,
          symptoms: state.symptomChecker.symptoms.filter((s) => s !== action.payload),
        },
      }

    case "SET_ASSESSMENT":
      return {
        ...state,
        symptomChecker: {
          ...state.symptomChecker,
          assessment: action.payload.assessment,
          recommendation: action.payload.recommendation,
          suggestedSpecialties: action.payload.specialties,
        },
      }

    case "CLEAR_SYMPTOMS":
      return {
        ...state,
        symptomChecker: initialSymptomCheckerState,
      }

    case "LOAD_DOCTORS":
      return {
        ...state,
        availableDoctors: action.payload,
      }

    case "SELECT_DOCTOR":
      return {
        ...state,
        selectedDoctor: action.payload,
      }

    case "BOOK_APPOINTMENT":
      // In a real app, this would send the booking to a backend
      return {
        ...state,
        notifications: [
          ...state.notifications,
          `Appointment booked with ${state.availableDoctors.find((d) => d.id === action.payload.doctorId)?.name} on ${action.payload.date} at ${action.payload.time}`,
        ],
      }

    default:
      return state
  }
}

export default function HealthQuestApp() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [activeTab, setActiveTab] = useState("map")
  const [showQuestDetails, setShowQuestDetails] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [showRiskDetails, setShowRiskDetails] = useState(false)
  const [selectedRiskZone, setSelectedRiskZone] = useState<RiskZone | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [showQuestComplete, setShowQuestComplete] = useState(false)
  const [completedQuest, setCompletedQuest] = useState<Quest | null>(null)
  const [showSymptomChecker, setShowSymptomChecker] = useState(false)
  const [symptomInput, setSymptomInput] = useState("")
  const [showHospitalDetails, setShowHospitalDetails] = useState(false)
  const [showDoctorDetails, setShowDoctorDetails] = useState(false)
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false)
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>("")
  const [selectedBookingTime, setSelectedBookingTime] = useState<string>("")
  const [medicalSubTab, setMedicalSubTab] = useState<"hospitals" | "doctors" | "appointments">("hospitals")
  
  const mapRef = useRef<HTMLDivElement>(null)

  // Common symptoms for autocomplete
  const commonSymptoms = [
    "Fever", "Headache", "Cough", "Sore throat", "Fatigue", 
    "Nausea", "Dizziness", "Shortness of breath", "Chest pain",
    "Abdominal pain", "Rash", "Joint pain", "Back pain"
  ]

  // Check for level up
  useEffect(() => {
    if (state.user.xp >= state.user.xpToNextLevel) {
      setShowLevelUp(true)
    }
  }, [state.user.xp, state.user.xpToNextLevel])

  // Process active risk zone effects
  useEffect(() => {
    if (state.activeRiskZone) {
      const interval = setInterval(() => {
        dispatch({ type: "UPDATE_HP", payload: state.activeRiskZone.hpImpact })

        // Update quest progress for active quests
        state.quests.forEach((quest) => {
          if (quest.isActive && !quest.isCompleted) {
            if (
              (quest.objective.type === "avoid" && quest.objective.target !== state.activeRiskZone?.type) ||
              (quest.objective.type === "visit" && quest.objective.target === state.activeRiskZone?.type)
            ) {
              const newCurrent = quest.objective.current + 1
              const newProgress = Math.min(100, Math.floor((newCurrent / quest.objective.count) * 100))

              dispatch({
                type: "UPDATE_QUEST_PROGRESS",
                payload: { id: quest.id, progress: newProgress },
              })

              // Check if quest is completed
              if (newProgress >= 100 && !quest.isCompleted) {
                dispatch({ type: "COMPLETE_QUEST", payload: quest.id })
                setCompletedQuest(quest)
                setShowQuestComplete(true)
              }
            }
          }
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [state.activeRiskZone, state.quests])

  // Display notifications as toasts
  useEffect(() => {
    if (state.notifications.length > 0) {
      const latestNotification = state.notifications[state.notifications.length - 1]

      toast({
        title: "HealthQuest Alert",
        description: latestNotification,
        duration: 3000,
      })

      // Remove the notification after displaying
      setTimeout(() => {
        dispatch({ type: "CLEAR_NOTIFICATION", payload: state.notifications.length - 1 })
      }, 3000)
    }
  }, [state.notifications])

  // Handle map click to move player
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.mapMode === "satellite") return // Disable player movement in satellite mode
    
    const mapContainer = e.currentTarget
    const rect = mapContainer.getBoundingClientRect()

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    dispatch({ type: "MOVE_PLAYER", payload: { x, y } })

    // Check if clicked on a risk zone
    const clickedRiskZone = checkRiskZoneCollision(x, y)
    if (clickedRiskZone) {
      setSelectedRiskZone(clickedRiskZone)
      setShowRiskDetails(true)
    }
  }

  // Check if player is in a risk zone
  const checkRiskZoneCollision = (x: number, y: number) => {
    for (const zone of initialRiskZones) {
      const zoneX = Number.parseInt(zone.position.left)
      const zoneY = Number.parseInt(zone.position.top)

      // Simple circular collision detection
      const distance = Math.sqrt(Math.pow(x - zoneX, 2) + Math.pow(y - zoneY, 2))

      if (distance < 15) {
        // Radius of collision
        return zone
      }
    }
    return null
  }

  // Update risk zone when player moves
  useEffect(() => {
    if (state.isMoving) {
      const riskZone = checkRiskZoneCollision(state.position.x, state.position.y)

      if (riskZone && (!state.activeRiskZone || state.activeRiskZone.id !== riskZone.id)) {
        dispatch({ type: "ENTER_RISK_ZONE", payload: riskZone })
      } else if (!riskZone && state.activeRiskZone) {
        dispatch({ type: "EXIT_RISK_ZONE" })
      }
    }
  }, [state.position, state.isMoving, state.activeRiskZone])

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest)
    setShowQuestDetails(true)
  }

  const activateQuest = (questId: number) => {
    dispatch({ type: "ACTIVATE_QUEST", payload: questId })
    setShowQuestDetails(false)
  }

  const handleLevelUp = () => {
    dispatch({ type: "LEVEL_UP" })
    setShowLevelUp(false)
  }

  const handleQuestComplete = () => {
    setShowQuestComplete(false)
    setCompletedQuest(null)
  }

  const handleNextTutorialStep = () => {
    if (state.tutorialStep < 3) {
      dispatch({ type: "NEXT_TUTORIAL_STEP" })
    } else {
      dispatch({ type: "COMPLETE_TUTORIAL" })
    }
  }

  const handleHospitalClick = (hospital: Hospital) => {
    dispatch({ type: "SELECT_HOSPITAL", payload: hospital })
    setShowHospitalDetails(true)
  }

  const handleDoctorClick = (doctor: Doctor) => {
    dispatch({ type: "SELECT_DOCTOR", payload: doctor })
    setShowDoctorDetails(true)
  }

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !state.symptomChecker.symptoms.includes(symptomInput.trim())) {
      dispatch({ type: "ADD_SYMPTOM", payload: symptomInput.trim() })
      setSymptomInput("")
    }
  }

  const handleRemoveSymptom = (symptom: string) => {
    dispatch({ type: "REMOVE_SYMPTOM", payload: symptom })
  }

  const handleAssessSymptoms = () => {
    // This is a simplified assessment logic for demonstration
    // In a real app, this would use a more sophisticated algorithm or API
    
    const symptoms = state.symptomChecker.symptoms
    let assessment: "low" | "medium" | "high" = "low"
    let recommendation = ""
    let specialties: string[] = []
    
    // High urgency symptoms
    const highUrgencySymptoms = ["Chest pain", "Shortness of breath", "Severe headache", "Unconsciousness", "Seizure"]
    // Medium urgency symptoms
    const mediumUrgencySymptoms = ["Fever", "Persistent cough", "Abdominal pain", "Dizziness", "Vomiting"]
    
    // Check for high urgency symptoms
    if (symptoms.some(s => highUrgencySymptoms.includes(s))) {
      assessment = "high"
      recommendation = "Your symptoms suggest a potentially serious condition that requires immediate medical attention. Please go to the nearest emergency room or call emergency services."
      specialties = ["Emergency Medicine"]
    } 
    // Check for medium urgency symptoms
    else if (symptoms.some(s => mediumUrgencySymptoms.includes(s)) || symptoms.length >= 3) {
      assessment = "medium"
      recommendation = "Your symptoms suggest a condition that may require medical attention. Consider scheduling an appointment with a doctor in the next 24-48 hours."
      
      // Determine specialties based on symptoms
      if (symptoms.includes("Fever") || symptoms.includes("Cough") || symptoms.includes("Sore throat")) {
        specialties.push("General Medicine")
      }
      if (symptoms.includes("Headache") || symptoms.includes("Dizziness")) {
        specialties.push("Neurology")
      }
      if (symptoms.includes("Chest pain") || symptoms.includes("Shortness of breath")) {
        specialties.push("Cardiology")
      }
      if (symptoms.includes("Rash") || symptoms.includes("Skin irritation")) {
        specialties.push("Dermatology")
      }
      if (symptoms.includes("Joint pain") || symptoms.includes("Back pain")) {
        specialties.push("Orthopedics")
      }
      
      if (specialties.length === 0) {
        specialties.push("General Medicine")
      }
    } 
    // Low urgency
    else {
      assessment = "low"
      recommendation = "Your symptoms suggest a minor condition that can likely be managed at home. Rest, stay hydrated, and monitor your symptoms. If they worsen or persist for more than a few days, consider consulting a doctor."
      specialties = ["General Medicine"]
    }
    
    dispatch({ 
      type: "SET_ASSESSMENT", 
      payload: { 
        assessment, 
        recommendation, 
        specialties 
      } 
    })
  }

  const handleBookAppointment = () => {
    if (state.selectedDoctor && selectedBookingDate && selectedBookingTime) {
      dispatch({ 
        type: "BOOK_APPOINTMENT", 
        payload: { 
          doctorId: state.selectedDoctor.id, 
          date: selectedBookingDate, 
          time: selectedBookingTime 
        } 
      })
      setShowBookingConfirmation(true)
    }
  }

  const handleBookingConfirmed = () => {
    setShowBookingConfirmation(false)
    setShowDoctorDetails(false)
    setMedicalSubTab("appointments")
  }

  // Tutorial content
  const tutorialSteps = [
    {
      title: "Welcome to HealthQuest!",
      description: "Navigate the world and avoid health risks to maintain your HP.",
      icon: <MapIcon className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: "Health Points (HP)",
      description: "Your HP decreases in risk zones and regenerates in safe zones.",
      icon: <Heart className="h-8 w-8 text-red-500" />,
    },
    {
      title: "Quests & Challenges",
      description: "Complete quests to earn XP, level up, and unlock badges.",
      icon: <Award className="h-8 w-8 text-amber-500" />,
    },
    {
      title: "Ready to Play?",
      description: "Click on the map to move your character and start your health adventure!",
      icon: <Zap className="h-8 w-8 text-emerald-500" />,
    },
  ]

  return (
    <div className="relative h-[700px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      {/* Top Bar with HP */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-white/90 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-emerald-500">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
            <AvatarFallback className="bg-emerald-100 text-emerald-700">HQ</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium text-gray-500">Level {state.user.level}</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold">HealthHero</p>
              {state.user.badges.length > 0 && (
                <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                  {state.user.badges.length} badges
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium text-gray-500">HP</span>
            <span className="text-sm font-bold">
              {state.user.hp}/{state.user.maxHp}
            </span>
          </div>
          <div className="flex items-center gap-1 w-32">
            <Progress
              value={state.user.hp}
              className="h-2 bg-red-100"
              indicatorClassName={`bg-gradient-to-r ${
                state.user.hp > 70
                  ? "from-emerald-500 to-emerald-500"
                  : state.user.hp > 30
                    ? "from-amber-500 to-amber-500"
                    : "from-red-500 to-red-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="map" className="h-full" onValueChange={setActiveTab}>
        <TabsContent value="map" className="h-full mt-0 data-[state=active]:h-full">
          <div className="relative h-full pt-14 pb-16">
            {/* Map Background */}
            <div 
              ref={mapRef}
              className="absolute inset-0 z-0 bg-emerald-50 cursor-pointer" 
              onClick={handleMapClick}
            >
              {/* Map Mode Toggle */}
              <div className="absolute top-4 right-4 z-30">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Layers className="h-4 w-4" />
                      {state.mapMode === "adventure" ? "Adventure Map" : "Satellite Map"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => dispatch({ type: "TOGGLE_MAP_MODE" })}>
                      {state.mapMode === "adventure" ? (
                        <div className="flex items-center gap-2">
                          <Satellite className="h-4 w-4" />
                          <span>Switch to Satellite Map</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MapIcon className="h-4 w-4" />
                          <span>Switch to Adventure Map</span>
                        </div>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Adventure Map */}
              {state.mapMode === "adventure" && (
                <div className="h-full w-full bg-[url('/placeholder.svg?height=700&width=400')] bg-cover bg-center opacity-50">
                  {/* Risk Icons on Map */}
                  {initialRiskZones.map((zone) => (
                    <TooltipProvider key={zone.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute z-10 ${zone.type === "safe" ? "" : "animate-pulse"}`}
                            style={{ top: zone.position.top, left: zone.position.left }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRiskZone(zone)
                              setShowRiskDetails(true)
                            }}
                          >
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full bg-${zone.color}-100 text-${zone.color}-500 shadow-md cursor-pointer hover:scale-110 transition-transform`}
                            >
                              {zone.icon}
                            </div>
                            {zone.type !== "safe" && (
                              <div
                                className={`mt-1 rounded-md bg-${zone.color}-500 px-1 py-0.5 text-[10px] font-bold text-white`}
                              >
                                {zone.hpImpact > 0 ? "+" : ""}
                                {zone.hpImpact} HP
                              </div>
                            )}
                            {zone.type === "safe" && (
                              <div className="mt-1 rounded-md bg-emerald-500 px-1 py-0.5 text-[10px] font-bold text-white">
                                +2 HP
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm font-medium">{zone.name}</p>
                          <p className="text-xs">{zone.description}</p>
                          {zone.satelliteData && (
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <p className="text-xs font-medium">{zone.satelliteData.source} Data:</p>
                              <p className="text-xs">{zone.satelliteData.reading}</p>
                              <p className="text-[10px] text-gray-500">{zone.satelliteData.timestamp}</p>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}

                  {/* User Avatar on Map */}
                  <div
                    className="absolute z-20 transition-all duration-500 ease-in-out"
                    style={{
                      top: `${state.position.y}%`,
                      left: `${state.position.x}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative">
                      <div className="animate-ping absolute -inset-1 rounded-full bg-emerald-400 opacity-30"></div>
                      <Avatar className="h-12 w-12 border-2 border-emerald-500 shadow-lg">
                        <AvatarImage src="/placeholder.svg?height=48&width=48" alt="Avatar" />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">HQ</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
              )}

              {/* Satellite Map */}
              {state.mapMode === "satellite" && (
                <div className="h-full w-full bg-[url('/placeholder.svg?height=700&width=400')] bg-cover bg-center">
                  <div className="absolute top-4 left-4 z-30 bg-white/80 backdrop-blur-sm p-2 rounded-md text-xs">
                    <div className="flex items-center gap-1">
                      <Satellite className="h-3 w-3 text-blue-500" />
                      <span className="font-medium">Satellite Data Sources:</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>Copernicus: Air Quality, Land Use</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Galileo: Positioning, Navigation</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>EGNOS: Enhanced Accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Markers */}
                  {state.nearbyHospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      className="absolute z-10 cursor-pointer"
                      style={{ 
                        top: `${20 + (hospital.position.lat % 10) * 5}%`, 
                        left: `${30 + (hospital.position.lng % 10) * 5}%` 
                      }}
                      onClick={() => handleHospitalClick(hospital)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500 shadow-md hover:scale-110 transition-transform">
                          <Hospital className="h-6 w-6" />
                        </div>
                        <div className="mt-1 rounded-md bg-white px-1 py-0.5 text-[10px] font-bold text-gray-700 shadow-sm">
                          {hospital.name}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Satellite Data Overlay */}
                  <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
                    {/* Simulated data visualization elements */}
                    <div className="absolute top-[30%] left-[40%] h-16 w-16 rounded-full bg-red-500/20 animate-pulse"></div>
                    <div className="absolute top-[50%] left-[70%] h-20 w-20 rounded-full bg-amber-500/20 animate-pulse"></div>
                    <div className="absolute top-[65%] left-[30%] h-14 w-14 rounded-full bg-purple-500/20 animate-pulse"></div>
                    <div className="absolute top-[20%] left-[20%] h-16 w-16 rounded-full bg-emerald-500/20 animate-pulse"></div>
                  </div>

                  {/* Satellite Info Card */}
                  <div className="absolute bottom-20 right-4 z-30">
                    <Card className="w-64 bg-white/90 backdrop-blur-sm shadow-lg">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Satellite className="h-4 w-4 text-blue-500" />
                          Satellite Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 text-xs">
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium">Copernicus Sentinel-5P:</p>
                            <p>Air Quality Index: Moderate</p>
                            <p>NO₂ Concentration: 45 μg/m³</p>
                          </div>
                          <div>
                            <p className="font-medium">Galileo Positioning:</p>
                            <p>Accuracy: ±1.5m</p>
                            <p>Satellites in view: 9</p>
                          </div>
                          <div>
                            <p className="font-medium">EGNOS Enhancement:</p>
                            <p>Signal Integrity: Good</p>
                            <p>Correction Applied: Yes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Active Quest Notification */}
              {state.quests.some((q) => q.isActive && !q.isCompleted) && state.mapMode === "adventure" && (
                <div className="absolute top-20 right-4 z-30">
                  <Card className="w-48 bg-white/90 backdrop-blur-sm shadow-lg border-emerald-200">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-500" />
                        Active Quest
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {state.quests
                        .filter((q) => q.isActive && !q.isCompleted)
                        .map((quest) => (
                          <div key={quest.id} className="mb-2 last:mb-0">
                            <p className="text-xs font-medium">{quest.title}</p>
                            <div className="flex justify-between items-center text-[10px] mt-1 mb-1">
                              <span>
                                {quest.objective.current}/{quest.objective.count}
                              </span>
                              <span>{quest.progress}%</span>
                            </div>
                            <Progress value={quest.progress} className="h-1.5" />
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* HP Change Alert */}
              {state.activeRiskZone && state.mapMode === "adventure" && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
                  <Badge variant={state.activeRiskZone.hpImpact > 0 ? "outline" : "destructive"} className="shadow-md">
                    {state.activeRiskZone.hpImpact > 0 ? "+" : ""}
                    {state.activeRiskZone.hpImpact} HP! {state.activeRiskZone.name}
                  </Badge>
                </div>
              )}

              {/* Map Instructions */}
              {state.mapMode === "adventure" && (
                <div className="absolute bottom-20 left-4 z-30">
                  <Card className="bg-white/80 backdrop-blur-sm w-auto">
                    <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground">Click anywhere on the map to move</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Symptom Checker Button */}
              <div className="absolute top-20 left-4 z-30">
                <Button 
                  variant="outline" 
                  className="bg-white/90 shadow-md flex items-center gap-2"
                  onClick={() => setShowSymptomChecker(true)}
                >
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  <span>AI Symptom Checker</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quests" className="h-full mt-0 data-[state=active]:h-full">
          <div className="h-full pt-14 pb-16 px-4 overflow-auto">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" />
              Active Quests
            </h2>

            {state.quests.filter((q) => q.isActive && !q.isCompleted && q.type === "personal").length === 0 ? (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>No active quests</AlertTitle>
                <AlertDescription>Select a quest below to start your adventure!</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 mb-6">
                {state.quests
                  .filter((q) => q.isActive && !q.isCompleted && q.type === "personal")
                  .map((quest) => (
                    <Card
                      key={quest.id}
                      className="border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleQuestClick(quest)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base flex items-center gap-2">
                            {quest.icon}
                            {quest.title}
                          </CardTitle>
                          <Badge
                            variant={
                              quest.difficulty === "Easy"
                                ? "outline"
                                : quest.difficulty === "Medium"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {quest.difficulty}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">{quest.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span>
                            Progress: {quest.objective.current}/{quest.objective.count}
                          </span>
                          <span className="font-medium">{quest.progress}%</span>
                        </div>
                        <Progress value={quest.progress} className="h-1.5" />
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex justify-between">
                        <div className="text-xs text-muted-foreground">Time left: {quest.timeLeft}</div>
                        <div className="text-xs font-medium text-emerald-600">+{quest.reward.xp} XP</div>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}

            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Available Quests
            </h2>

            <div className="space-y-3 mb-6">
              {state.quests
                .filter((q) => !q.isActive && !q.isCompleted && q.type === "personal")
                .map((quest) => (
                  <Card
                    key={quest.id}
                    className="border-l-4 border-l-purple-300 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleQuestClick(quest)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base flex items-center gap-2">
                          {quest.icon}
                          {quest.title}
                        </CardTitle>
                        <Badge
                          variant={
                            quest.difficulty === "Easy"
                              ? "outline"
                              : quest.difficulty === "Medium"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {quest.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">{quest.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-3 pt-0 flex justify-between">
                      <div className="text-xs text-muted-foreground">Time left: {quest.timeLeft}</div>
                      <div className="text-xs font-medium text-emerald-600">+{quest.reward.xp} XP</div>
                    </CardFooter>
                  </Card>
                ))}
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Community Quests
            </h2>

            <div className="space-y-3">
              {state.quests
                .filter((q) => q.type === "community" && !q.isCompleted)
                .map((quest) => (
                  <Card
                    key={quest.id}
                    className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleQuestClick(quest)}
                  >
                    <CardHeader className="p-3 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base flex items-center gap-2">
                          {quest.icon}
                          {quest.title}
                        </CardTitle>
                        <Badge className="text-[10px] bg-amber-500">Community</Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span>
                          Community Progress: {quest.objective.current}/{quest.objective.count}
                        </span>
                        <span className="font-medium">{quest.progress}%</span>
                      </div>
                      <Progress
                        value={quest.progress}
                        className="h-1.5 bg-amber-100"
                        indicatorClassName="bg-amber-500"
                      />
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-between">
                      <div className="text-xs text-muted-foreground">Participants: 128</div>
                      <div className="text-xs font-medium text-amber-600">+{quest.reward.xp} XP</div>
                    </CardFooter>
                  </Card>
                ))}
            </div>

            {state.quests.some((q) => q.isCompleted) && (
              <>
                <h2 className="text-lg font-bold mt-6 mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Completed Quests
                </h2>

                <div className="space-y-3">
                  {state.quests
                    .filter((q) => q.isCompleted)
                    .map((quest) => (
                      <Card
                        key={quest.id}
                        className="border-l-4 border-l-gray-300 bg-gray-50 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleQuestClick(quest)}
                      >
                        <CardHeader className="p-3 pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base flex items-center gap-2 text-gray-600">
                              <Check className="h-5 w-5 text-emerald-500" />
                              {quest.title}
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px]">
                              Completed
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-3 pt-0 flex justify-between">
                          <div className="text-xs text-muted-foreground">Reward earned</div>
                          <div className="text-xs font-medium text-emerald-600">+{quest.reward.xp} XP</div>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medical" className="h-full mt-0 data-[state=active]:h-full">
          <div className="h-full pt-14 pb-16 px-4 overflow-hidden flex flex-col">
            {/* Medical Tabs */}
            <div className="border-b mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setMedicalSubTab("hospitals")}
                  className={`pb-2 text-sm font-medium ${
                    medicalSubTab === "hospitals"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Nearby Hospitals
                </button>
                <button
                  onClick={() => setMedicalSubTab("doctors")}
                  className={`pb-2 text-sm font-medium ${
                    medicalSubTab === "doctors"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Available Doctors
                </button>
                <button
                  onClick={() => setMedicalSubTab("appointments")}
                  className={`pb-2 text-sm font-medium ${
                    medicalSubTab === "appointments"
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  My Appointments
                </button>
              </div>
            </div>

            {/* Hospitals Tab */}
            {medicalSubTab === "hospitals" && (
              <div className="overflow-auto flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Hospital className="h-5 w-5 text-red-500" />
                    Nearby Hospitals
                  </h2>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sort" className="text-xs">Sort by:</Label>
                    <Select defaultValue="distance">
                      <SelectTrigger id="sort" className="h-8 text-xs w-32">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="wait">Wait Time</SelectItem>
                        <SelectItem value="doctors">Available Doctors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  {state.nearbyHospitals.map((hospital) => (
                    <Card
                      key={hospital.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleHospitalClick(hospital)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Hospital className="h-5 w-5 text-red-500" />
                            {hospital.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px]">
                            {hospital.distance} km away
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">{hospital.address}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex flex-col items-center p-1 bg-gray-50 rounded">
                            <Clock className="h-3 w-3 text-amber-500 mb-1" />
                            <span className="font-medium">{hospital.travelTime} min</span>
                            <span className="text-[10px] text-gray-500">Travel Time</span>
                          </div>
                          <div className="flex flex-col items-center p-1 bg-gray-50 rounded">
                            <Stethoscope className="h-3 w-3 text-blue-500 mb-1" />
                            <span className="font-medium">{hospital.availableDoctors}</span>
                            <span className="text-[10px] text-gray-500">Doctors</span>
                          </div>
                          <div className="flex flex-col items-center p-1 bg-gray-50 rounded">
                            <Clock className="h-3 w-3 text-emerald-500 mb-1" />
                            <span className="font-medium">{hospital.waitTime}</span>
                            <span className="text-[10px] text-gray-500">Wait Time</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex justify-between items-center">
                        <div className="flex flex-wrap gap-1">
                          {hospital.specialties.slice(0, 2).map((specialty, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {specialty}
                            </Badge>
                          ))}
                          {hospital.specialties.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{hospital.specialties.length - 2} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Satellite className="h-3 w-3" />
                          <span>{hospital.satelliteData.source}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Doctors Tab */}
            {medicalSubTab === "doctors" && (
              <div className="overflow-auto flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    Available Doctors
                  </h2>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="specialty" className="text-xs">Specialty:</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="specialty" className="h-8 text-xs w-40">
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specialties</SelectItem>
                        <SelectItem value="general">General Medicine</SelectItem>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="dermatology">Dermatology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {state.symptomChecker.assessment && state.symptomChecker.suggestedSpecialties.length > 0 && (
                  <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-700">Based on your symptoms</AlertTitle>
                    <AlertDescription className="text-blue-600 text-xs">
                      We recommend doctors specializing in: {state.symptomChecker.suggestedSpecialties.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {initialDoctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleDoctorClick(doctor)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 border border-gray-200">
                            <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                            <AvatarFallback>{doctor.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{doctor.name}</CardTitle>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">{doctor.rating}</span>
                              </div>
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {doctor.specialty} • {doctor.experience} experience
                            </CardDescription>
                            <div className="text-xs text-gray-500 mt-1">{doctor.hospitalName}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="text-xs font-medium mb-1">Next Available</div>
                        <div className="flex flex-wrap gap-1">
                          {doctor.availableSlots[0]?.times.slice(0, 3).map((time, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {doctor.availableSlots[0].date} {time}
                            </Badge>
                          ))}
                          {doctor.availableSlots[0]?.times.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{doctor.availableSlots[0].times.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0 flex justify-between">
                        <div className="text-xs text-gray-500">
                          {doctor.availableSlots[0]?.times.length} slots today
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Book Appointment
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {medicalSubTab === "appointments" && (
              <div className="overflow-auto flex-1">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  My Appointments
                </h2>

                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>No upcoming appointments</AlertTitle>
                  <AlertDescription>
                    Book an appointment with a doctor from the Available Doctors tab.
                  </AlertDescription>
                </Alert>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Recent Health Activity</h3>
                  <Card>
                    <CardContent className="p-3 space-y-3 text-sm">
                      <div className="flex items-start gap-3 pb-3 border-b">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Symptom Check Completed</p>
                          <p className="text-xs text-gray-500">Today, 10:45 AM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pb-3 border-b">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                          <Hospital className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Viewed City General Hospital</p>
                          <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                          <Heart className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Health Quest: Avoided Pollution Zone</p>
                          <p className="text-xs text-gray-500">Today, 9:15 AM</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="h-full mt-0 data-[state=active]:h-full">
          <div className="h-full pt-14 pb-16 px-4 overflow-auto">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-20 w-20 border-4 border-emerald-500 mb-3">
                <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Avatar" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">HQ</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">HealthHero</h2>
              <p className="text-sm text-muted-foreground">Level {state.user.level} Explorer</p>

              <div className="w-full mt-4">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span>
                    XP: {state.user.xp}/{state.user.xpToNextLevel}
                  </span>
                  <span className="font-medium">{Math.floor((state.user.xp / state.user.xpToNextLevel) * 100)}%</span>
                </div>
                <Progress
                  value={Math.floor((state.user.xp / state.user.xpToNextLevel) * 100)}
                  className="h-2"
                  indicatorClassName="bg-amber-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  Achievements
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "Clean Air",
                    "Bug Slayer",
                    "Heat Wave",
                    "Explorer",
                    "First Aid",
                    "Survivor",
                    "Team Player",
                    "Rookie",
                  ].map((badge, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          state.user.badges.includes(badge)
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Award className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] mt-1 text-center">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quests Completed</span>
                      <span className="font-medium">{state.user.questsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Health Points Saved</span>
                      <span className="font-medium">{state.user.hpSaved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Areas Avoided</span>
                      <span className="font-medium">{state.user.riskAreasAvoided}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Community Quests</span>
                      <span className="font-medium">{state.user.communityQuestsCompleted}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Health Lore Unlocked</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-3">
                    {state.user.unlockedLore.includes("The Smog Monster") && (
                      <div className="flex gap-2">
                        <Cloud className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">The Smog Monster</p>
                          <p className="text-xs text-muted-foreground">
                            Weakens lungs with polluted air. Most active during rush hour.
                          </p>
                        </div>
                      </div>
                    )}
                    {state.user.unlockedLore.includes("Mosquito Swarms") && (
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Mosquito Swarms</p>
                          <p className="text-xs text-muted-foreground">
                            Carry tiny health debuffs that stack over time.
                          </p>
                        </div>
                      </div>
                    )}
                    {state.user.unlockedLore.includes("Heat Wave Dragon") && (
                      <div className="flex gap-2">
                        <Thermometer className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Heat Wave Dragon</p>
                          <p className="text-xs text-muted-foreground">
                            Drains HP rapidly when exposed to extreme heat.
                          </p>
                        </div>
                      </div>
                    )}
                    {state.quests
                      .filter((q) => q.isCompleted && !state.user.unlockedLore.includes(q.title))
                      .map((quest) => (
                        <div key={quest.id} className="flex gap-2">
                          {quest.icon}
                          <div>
                            <p className="text-sm font-medium">{quest.title}</p>
                            <p className="text-xs text-muted-foreground">{quest.lore}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t">
          <TabsList className="w-full grid grid-cols-4 h-16">
            <TabsTrigger
              value="map"
              className="flex flex-col items-center justify-center data-[state=active]:bg-emerald-50"
            >
              <MapIcon className="h-5 w-5" />
              <span className="text-xs mt-1">Map</span>
            </TabsTrigger>
            <TabsTrigger
              value="quests"
              className="flex flex-col items-center justify-center data-[state=active]:bg-emerald-50"
            >
              <Award className="h-5 w-5" />
              <span className="text-xs mt-1">Quests</span>
            </TabsTrigger>
            <TabsTrigger
              value="medical"
              className="flex flex-col items-center justify-center data-[state=active]:bg-emerald-50"
            >
              <Hospital className="h-5 w-5" />
              <span className="text-xs mt-1">Medical</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex flex-col items-center justify-center data-[state=active]:bg-emerald-50"
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Quest Details Sheet */}
      <Sheet open={showQuestDetails} onOpenChange={setShowQuestDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedQuest && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    {selectedQuest.icon}
                    {selectedQuest.title}
                  </SheetTitle>
                  {selectedQuest.isCompleted && <Badge className="bg-emerald-500">Completed</Badge>}
                </div>
                <SheetDescription>{selectedQuest.description}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                {!selectedQuest.isCompleted && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Progress</h3>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span>
                        Completion: {selectedQuest.objective.current}/{selectedQuest.objective.count}
                      </span>
                      <span className="font-medium">{selectedQuest.progress}%</span>
                    </div>
                    <Progress value={selectedQuest.progress} className="h-2" />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-1">Quest Details</h3>
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <Badge
                        variant={
                          selectedQuest.difficulty === "Easy"
                            ? "outline"
                            : selectedQuest.difficulty === "Medium"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {selectedQuest.difficulty}
                      </Badge>
                    </div>
                    {!selectedQuest.isCompleted && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time Left</span>
                        <span className="font-medium">{selectedQuest.timeLeft}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reward</span>
                      <span className="font-medium text-emerald-600">
                        +{selectedQuest.reward.xp} XP
                        {selectedQuest.reward.badge && ` + ${selectedQuest.reward.badge} Badge`}
                      </span>
                    </div>
                    {selectedQuest.type === "community" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <Badge className="bg-amber-500">Community</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {!selectedQuest.isCompleted && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Risk Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuest.riskAreas.map((area, i) => (
                        <Badge key={i} variant="outline" className="bg-red-50">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Card className="bg-emerald-50 border-emerald-200">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      Health Lore
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-sm italic">{selectedQuest.lore}</p>
                  </CardContent>
                </Card>

                {!selectedQuest.isActive && !selectedQuest.isCompleted && (
                  <Button className="w-full" onClick={() => activateQuest(selectedQuest.id)}>
                    Start Quest
                  </Button>
                )}

                {selectedQuest.isActive && !selectedQuest.isCompleted && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        dispatch({
                          type: "ACTIVATE_QUEST",
                          payload: selectedQuest.id,
                        })
                        setShowQuestDetails(false)
                      }}
                    >
                      Abandon
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setActiveTab("map")
                        setShowQuestDetails(false)
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Risk Zone Details Sheet */}
      <Sheet open={showRiskDetails} onOpenChange={setShowRiskDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedRiskZone && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2">
                  {selectedRiskZone.icon}
                  {selectedRiskZone.name}
                </SheetTitle>
                <SheetDescription>{selectedRiskZone.description}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <Card className={`bg-${selectedRiskZone.color}-50 border-${selectedRiskZone.color}-200`}>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">Health Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HP Change per Second</span>
                      <Badge
                        variant={selectedRiskZone.hpImpact > 0 ? "outline" : "destructive"}
                        className={
                          selectedRiskZone.hpImpact > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""
                        }
                      >
                        {selectedRiskZone.hpImpact > 0 ? "+" : ""}
                        {selectedRiskZone.hpImpact} HP
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {selectedRiskZone.satelliteData && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Satellite className="h-4 w-4 text-blue-600" />
                        Satellite Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Source</span>
                          <span className="font-medium">{selectedRiskZone.satelliteData.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Reading</span>
                          <span className="font-medium">{selectedRiskZone.satelliteData.reading}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Updated</span>
                          <span className="font-medium">{selectedRiskZone.satelliteData.timestamp}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedRiskZone.type !== "safe" && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">Related Quests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2">
                        {state.quests
                          .filter(
                            (q) =>
                              (q.objective.type === "avoid" && q.objective.target === selectedRiskZone.type) ||
                              (q.objective.type === "visit" && q.objective.target === selectedRiskZone.type),
                          )
                          .map((quest) => (
                            <div key={quest.id} className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {quest.icon}
                                <span className="text-sm">{quest.title}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSelectedQuest(quest)
                                  setShowRiskDetails(false)
                                  setShowQuestDetails(true)
                                }}
                              >
                                View
                              </Button>
                            </div>
                          ))}

                        {state.quests.filter(
                          (q) =>
                            (q.objective.type === "avoid" && q.objective.target === selectedRiskZone.type) ||
                            (q.objective.type === "visit" && q.objective.target === selectedRiskZone.type),
                        ).length === 0 && <p className="text-sm text-muted-foreground">No related quests available</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-emerald-50 border-emerald-200">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-600" />
                      Health Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-sm">
                      {selectedRiskZone.type === "pollution" &&
                        "Stay indoors during high pollution periods. Use air purifiers and wear masks when outside."}
                      {selectedRiskZone.type === "heat" &&
                        "Stay hydrated and seek shade. Avoid outdoor activities during peak heat hours."}
                      {selectedRiskZone.type === "mosquito" &&
                        "Use insect repellent and wear long sleeves. Eliminate standing water around your home."}
                      {selectedRiskZone.type === "safe" &&
                        "This area has good air quality and moderate temperatures. Ideal for outdoor activities."}
                    </p>
                  </CardContent>
                </Card>

                <SheetFooter>
                  <Button
                    onClick={() => {
                      setShowRiskDetails(false)
                      // Move player to this zone
                      const zoneX = Number.parseInt(selectedRiskZone.position.left)
                      const zoneY = Number.parseInt(selectedRiskZone.position.top)
                      dispatch({ type: "MOVE_PLAYER", payload: { x: zoneX, y: zoneY } })
                    }}
                  >
                    Navigate Here
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Hospital Details Sheet */}
      <Sheet open={showHospitalDetails} onOpenChange={setShowHospitalDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {state.selectedHospital && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Hospital className="h-5 w-5 text-red-500" />
                  {state.selectedHospital.name}
                </SheetTitle>
                <SheetDescription>{state.selectedHospital.address}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-50">
                    <CardContent className="p-3 flex flex-col items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="text-sm font-medium">{state.selectedHospital.distance} km</span>
                      <span className="text-xs text-gray-500">Distance</span>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50">
                    <CardContent className="p-3 flex flex-col items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-sm font-medium">{state.selectedHospital.travelTime} min</span>
                      <span className="text-xs text-gray-500">Travel Time</span>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50">
                    <CardContent className="p-3 flex flex-col items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-emerald-500 mb-1" />
                      <span className="text-sm font-medium">{state.selectedHospital.availableDoctors}</span>
                      <span className="text-xs text-gray-500">Doctors</span>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">Available Specialties</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {state.selectedHospital.specialties.map((specialty, i) => (
                        <Badge key={i} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Satellite className="h-4 w-4 text-blue-600" />
                      Satellite Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Source</span>
                        <span className="font-medium">{state.selectedHospital.satelliteData.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Position Accuracy</span>
                        <span className="font-medium">{state.selectedHospital.satelliteData.accuracy}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Doctors ({state.availableDoctors.length})</h3>
                  <div className="space-y-2">
                    {state.availableDoctors.slice(0, 3).map((doctor) => (
                      <div 
                        key={doctor.id} 
                        className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          dispatch({ type: "SELECT_DOCTOR", payload: doctor })
                          setShowHospitalDetails(false)
                          setShowDoctorDetails(true)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                            <AvatarFallback>{doctor.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{doctor.name}</p>
                            <p className="text-xs text-gray-500">{doctor.specialty}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                    {state.availableDoctors.length > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-xs" 
                        onClick={() => {
                          setShowHospitalDetails(false)
                          setActiveTab("medical")
                          setMedicalSubTab("doctors")
                        }}
                      >
                        View all {state.availableDoctors.length} doctors
                      </Button>
                    )}
                  </div>
                </div>

                <SheetFooter className="flex flex-col gap-2 sm:flex-row">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowHospitalDetails(false)
                      setActiveTab("map")
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setShowHospitalDetails(false)
                      setActiveTab("medical")
                      setMedicalSubTab("doctors")
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Doctor Details Sheet */}
      <Sheet open={showDoctorDetails} onOpenChange={setShowDoctorDetails}>
        <SheetContent className="w-full sm:max-w-md">
          {state.selectedDoctor && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-gray-200">
                    <AvatarImage src={state.selectedDoctor.avatar || "/placeholder.svg"} alt={state.selectedDoctor.name} />
                    <AvatarFallback>
                      {state.selectedDoctor.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{state.selectedDoctor.name}</SheetTitle>
                    <SheetDescription>
                      {state.selectedDoctor.specialty} • {state.selectedDoctor.experience} experience
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Hospital className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{state.selectedDoctor.hospitalName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{state.selectedDoctor.rating}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">About</h3>
                  <p className="text-sm text-gray-600">{state.selectedDoctor.about}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Available Appointments</h3>
                  
                  <div className="space-y-3">
                    {state.selectedDoctor.availableSlots.map((slot, i) => (
                      <div key={i}>
                        <h4 className="text-xs font-medium mb-2">{slot.date}</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {slot.times.map((time, j) => (
                            <Button
                              key={j}
                              variant={selectedBookingDate === slot.date && selectedBookingTime === time ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                setSelectedBookingDate(slot.date)
                                setSelectedBookingTime(time)
                              }}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {state.symptomChecker.assessment && (
                  <Alert className={`
                    ${state.symptomChecker.assessment === "low" ? "bg-emerald-50 border-emerald-200" : 
                      state.symptomChecker.assessment === "medium" ? "bg-amber-50 border-amber-200" : 
                      "bg-red-50 border-red-200"}
                  `}>
                    <div className={`
                      ${state.symptomChecker.assessment === "low" ? "text-emerald-500" : 
                        state.symptomChecker.assessment === "medium" ? "text-amber-500" : 
                        "text-red-500"}
                    `}>
                      {state.symptomChecker.assessment === "low" ? <CheckCircle className="h-4 w-4" /> : 
                       state.symptomChecker.assessment === "medium" ? <AlertCircle className="h-4 w-4" /> : 
                       <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <AlertTitle className={`
                      ${state.symptomChecker.assessment === "low" ? "text-emerald-700" : 
                        state.symptomChecker.assessment === "medium" ? "text-amber-700" : 
                        "text-red-700"}
                    `}>
                      Based on your symptom check
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {state.symptomChecker.suggestedSpecialties.includes(state.selectedDoctor.specialty) ? 
                        `This doctor's specialty (${state.selectedDoctor.specialty}) matches your symptoms.` : 
                        `Your symptoms may require a different specialist. Consider a ${state.symptomChecker.suggestedSpecialties[0]} doctor.`}
                    </AlertDescription>
                  </Alert>
                )}

                <SheetFooter>
                  <Button 
                    disabled={!selectedBookingDate || !selectedBookingTime}
                    onClick={handleBookAppointment}
                  >
                    Book Appointment
                  </Button>
                </SheetFooter>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* AI Symptom Checker Dialog */}
      <Dialog open={showSymptomChecker} onOpenChange={setShowSymptomChecker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
              AI Symptom Checker
            </DialogTitle>
            <DialogDescription>
              Describe your symptoms and get an AI-powered health assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!state.symptomChecker.assessment ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Enter your symptoms</Label>
                  <div className="flex gap-2">
                    <Input
                      id="symptoms"
                      placeholder="e.g., Headache, Fever"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      list="common-symptoms"
                    />
                    <datalist id="common-symptoms">
                      {commonSymptoms.map((symptom, i) => (
                        <option key={i} value={symptom} />
                      ))}
                    </datalist>
                    <Button onClick={handleAddSymptom} type="button" size="sm">
                      Add
                    </Button>
                  </div>
                </div>

                {state.symptomChecker.symptoms.length > 0 && (
                  <div>
                    <Label className="text-sm">Your symptoms:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {state.symptomChecker.symptoms.map((symptom, i) => (
                        <Badge key={i} variant="secondary" className="pr-1 flex items-center gap-1">
                          {symptom}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveSymptom(symptom)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => dispatch({ type: "CLEAR_SYMPTOMS" })}
                    disabled={state.symptomChecker.symptoms.length === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleAssessSymptoms}
                    disabled={state.symptomChecker.symptoms.length === 0}
                  >
                    Check Symptoms
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-lg ${
                  state.symptomChecker.assessment === "low" 
                    ? "bg-emerald-50" 
                    : state.symptomChecker.assessment === "medium" 
                      ? "bg-amber-50" 
                      : "bg-red-50"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {state.symptomChecker.assessment === "low" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : state.symptomChecker.assessment === "medium" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <h3 className={`font-bold ${
                      state.symptomChecker.assessment === "low" 
                        ? "text-emerald-700" 
                        : state.symptomChecker.assessment === "medium" 
                          ? "text-amber-700" 
                          : "text-red-700"
                    }`}>
                      {state.symptomChecker.assessment === "low" 
                        ? "You don't have to go to the doctor" 
                        : state.symptomChecker.assessment === "medium" 
                          ? "You can consider seeing a doctor" 
                          : "You need to see a doctor immediately"}
                    </h3>
                  </div>
                  <p className="text-sm mb-3">{state.symptomChecker.recommendation}</p>
                  
                  {state.symptomChecker.suggestedSpecialties.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Suggested specialists:</p>
                      <div className="flex flex-wrap gap-1">
                        {state.symptomChecker.suggestedSpecialties.map((specialty, i) => (
                          <Badge key={i} variant="outline" className={`
                            ${state.symptomChecker.assessment === "low" 
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                              : state.symptomChecker.assessment === "medium" 
                                ? "bg-amber-100 text-amber-700 border-amber-200" 
                                : "bg-red-100 text-red-700 border-red-200"}
                          `}>
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Your symptoms:</p>
                  <div className="flex flex-wrap gap-1">
                    {state.symptomChecker.symptoms.map((symptom, i) => (
                      <Badge key={i} variant="secondary">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => dispatch({ type: "CLEAR_SYMPTOMS" })}
                  >
                    Start Over
                  </Button>
                  {(state.symptomChecker.assessment === "medium" || state.symptomChecker.assessment === "high") && (
                    <Button
                      onClick={() => {
                        setShowSymptomChecker(false)
                        setActiveTab("medical")
                        setMedicalSubTab("doctors")
                      }}
                    >
                      Find a Doctor
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingConfirmation} onOpenChange={setShowBookingConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Appointment Confirmed
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12 border border-emerald-200">
                  <AvatarImage src={state.selectedDoctor?.avatar || "/placeholder.svg"} alt={state.selectedDoctor?.name} />
                  <AvatarFallback>
                    {state.selectedDoctor?.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{state.selectedDoctor?.name}</p>
                  <p className="text-sm text-gray-500">{state.selectedDoctor?.specialty}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{selectedBookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium">{selectedBookingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium">{state.selectedDoctor?.hospitalName}</span>
                </div>
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Appointment details</AlertTitle>
              <AlertDescription className="text-xs">
                Your appointment details have been sent to your email and are available in the Appointments tab.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleBookingConfirmed}>
              View My Appointments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Up Dialog */}
      <Dialog open={showLevelUp} onOpenChange={setShowLevelUp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-amber-500" />
              Level Up!
            </DialogTitle>
            <DialogDescription className="text-center">
              Congratulations! You've reached level {state.user.level + 1}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30"></div>
                <Avatar className="h-24 w-24 border-4 border-amber-500">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Avatar" />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl">
                    {state.user.level + 1}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="text-lg font-bold mb-2">Rewards</h3>
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-md">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    Max HP Increased
                  </span>
                  <span className="font-bold">+10 HP</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded-md">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    New Quests Unlocked
                  </span>
                  <span className="font-bold">+2 Quests</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleLevelUp} className="w-full">
              Continue Adventure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quest Complete Dialog */}
      <Dialog open={showQuestComplete} onOpenChange={setShowQuestComplete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Award className="h-6 w-6 text-emerald-500" />
              Quest Complete!
            </DialogTitle>
            <DialogDescription className="text-center">{completedQuest?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30"></div>
                <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-500">
                  {completedQuest?.icon ? (
                    <div className="h-12 w-12 text-emerald-600">{completedQuest.icon}</div>
                  ) : (
                    <Award className="h-12 w-12 text-emerald-600" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2">Rewards</h3>
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded-md">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    Experience Points
                  </span>
                  <span className="font-bold">+{completedQuest?.reward.xp} XP</span>
                </div>
                {completedQuest?.reward.badge && (
                  <div className="flex justify-between items-center p-2 bg-emerald-50\
