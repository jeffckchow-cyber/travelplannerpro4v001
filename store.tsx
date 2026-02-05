
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip, AppState, Activity, Stay, TransportDetail } from './types';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  query 
} from "firebase/firestore";

interface TripContextType {
  state: AppState;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addTrip: (trip: any) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setActiveTrip: (id: string | null) => void;
  addActivity: (tripId: string, dayIndex: number, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (tripId: string, dayIndex: number, activity: Activity) => void;
  deleteActivity: (tripId: string, dayIndex: number, activityId: string) => void;
  addStay: (tripId: string, stay: Omit<Stay, 'id'>) => void;
  updateStay: (tripId: string, stay: Stay) => void;
  deleteStay: (tripId: string, stayId: string) => void;
  addTransport: (tripId: string, transport: Omit<TransportDetail, 'id'>) => void;
  updateTransport: (tripId: string, transport: TransportDetail) => void;
  deleteTransport: (tripId: string, transportId: string) => void;
  updateNotes: (tripId: string, notes: string) => void;
  updateChecklist: (tripId: string, itemId: string, completed: boolean) => void;
  addChecklistItem: (tripId: string, item: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const INITIAL_TRIPS: Trip[] = [
  {
    id: 'preview-trip',
    title: 'US Trip 2026',
    startDate: '2026-05-19',
    endDate: '2026-05-26',
    status: 'planning',
    coverImage: 'https://images.unsplash.com/photo-1508433957232-31d15fe4a3ba?auto=format&fit=crop&w=1200&q=80',
    bannerPosition: 50,
    budget: { total: 5000 },
    notes: 'Exciting US road trip!',
    stays: [],
    transports: [],
    checklist: [],
    dailyItinerary: Array.from({ length: 8 }, (_, i) => {
      const date = new Date('2026-05-19');
      date.setDate(date.getDate() + i);
      return { day: i + 1, date: date.toISOString().split('T')[0], activities: [] };
    })
  }
];

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({ trips: INITIAL_TRIPS, activeTripId: null });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        const saved = localStorage.getItem('us_travel_planner_v7');
        if (saved) setState(JSON.parse(saved));
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/trips`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => doc.data() as Trip);
      setState(prev => ({ 
        ...prev, 
        trips: tripsData.length > 0 ? tripsData : INITIAL_TRIPS 
      }));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('us_travel_planner_v7', JSON.stringify(state));
    }
  }, [state, user]);

  const syncTrip = async (trip: Trip) => {
    if (user) {
      await setDoc(doc(db, `users/${user.uid}/trips`, trip.id), trip);
    } else {
      setState(prev => ({
        ...prev,
        trips: prev.trips.map(t => t.id === trip.id ? trip : t)
      }));
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setState({ trips: INITIAL_TRIPS, activeTripId: null });
  };

  const addTrip = useCallback(async (data: any) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const dailyItinerary = Array.from({ length: diffDays }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { day: i + 1, date: date.toISOString().split('T')[0], activities: [] };
    });

    const newTrip: Trip = { ...data, id: crypto.randomUUID(), status: 'planning', budget: { total: 2000 }, checklist: [], stays: [], transports: [], notes: '', dailyItinerary };
    
    if (user) {
      await setDoc(doc(db, `users/${user.uid}/trips`, newTrip.id), newTrip);
    } else {
      setState(prev => ({ ...prev, trips: [...prev.trips, newTrip] }));
    }
  }, [user]);

  const updateTrip = useCallback(async (tripId: string, updates: Partial<Trip>) => {
    const oldTrip = state.trips.find(t => t.id === tripId);
    if (!oldTrip) return;
    const newTrip = { ...oldTrip, ...updates };

    if (updates.startDate !== undefined || updates.endDate !== undefined) {
      const s = new Date(newTrip.startDate);
      const e = new Date(newTrip.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const daysCount = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
        const existingActivities = new Map();
        oldTrip.dailyItinerary.forEach(d => existingActivities.set(d.date, d.activities));
        newTrip.dailyItinerary = Array.from({ length: daysCount }, (_, i) => {
          const d = new Date(s);
          d.setDate(s.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          return { day: i + 1, date: dateStr, activities: existingActivities.get(dateStr) || [] };
        });
      }
    }
    await syncTrip(newTrip);
  }, [state.trips, user]);

  const deleteTrip = useCallback(async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, `users/${user.uid}/trips`, id));
    } else {
      setState(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id), activeTripId: prev.activeTripId === id ? null : prev.activeTripId }));
    }
  }, [user]);

  const setActiveTrip = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, activeTripId: id }));
  }, []);

  const addActivity = useCallback(async (tripId: string, dayIndex: number, activity: Omit<Activity, 'id'>) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    const newDaily = [...trip.dailyItinerary];
    newDaily[dayIndex].activities.push({ ...activity, id: crypto.randomUUID() });
    await syncTrip({ ...trip, dailyItinerary: newDaily });
  }, [state.trips, user]);

  const updateActivity = useCallback(async (tripId: string, dayIndex: number, activity: Activity) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    const newDaily = [...trip.dailyItinerary];
    newDaily[dayIndex].activities = newDaily[dayIndex].activities.map(a => a.id === activity.id ? activity : a);
    await syncTrip({ ...trip, dailyItinerary: newDaily });
  }, [state.trips, user]);

  const deleteActivity = useCallback(async (tripId: string, dayIndex: number, activityId: string) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    const newDaily = [...trip.dailyItinerary];
    newDaily[dayIndex].activities = newDaily[dayIndex].activities.filter(act => act.id !== activityId);
    await syncTrip({ ...trip, dailyItinerary: newDaily });
  }, [state.trips, user]);

  const addStay = useCallback(async (tripId: string, stay: Omit<Stay, 'id'>) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, stays: [...trip.stays, { ...stay, id: crypto.randomUUID() }] });
  }, [state.trips, user]);

  const updateStay = useCallback(async (tripId: string, stay: Stay) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, stays: trip.stays.map(s => s.id === stay.id ? stay : s) });
  }, [state.trips, user]);

  const deleteStay = useCallback(async (tripId: string, stayId: string) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, stays: trip.stays.filter(s => s.id !== stayId) });
  }, [state.trips, user]);

  const addTransport = useCallback(async (tripId: string, transport: Omit<TransportDetail, 'id'>) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, transports: [...trip.transports, { ...transport, id: crypto.randomUUID() }] });
  }, [state.trips, user]);

  const updateTransport = useCallback(async (tripId: string, transport: TransportDetail) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, transports: trip.transports.map(t => t.id === transport.id ? transport : t) });
  }, [state.trips, user]);

  const deleteTransport = useCallback(async (tripId: string, transportId: string) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, transports: trip.transports.filter(t => t.id !== transportId) });
  }, [state.trips, user]);

  const updateNotes = useCallback(async (tripId: string, notes: string) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, notes });
  }, [state.trips, user]);

  const updateChecklist = useCallback(async (tripId: string, itemId: string, completed: boolean) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, checklist: trip.checklist.map(item => item.id === itemId ? { ...item, completed } : item) });
  }, [state.trips, user]);

  const addChecklistItem = useCallback(async (tripId: string, item: string) => {
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;
    await syncTrip({ ...trip, checklist: [...trip.checklist, { id: crypto.randomUUID(), item, completed: false }] });
  }, [state.trips, user]);

  return (
    <TripContext.Provider value={{
      state, user, login, logout, addTrip, updateTrip, deleteTrip, setActiveTrip, addActivity, updateActivity, deleteActivity, 
      addStay, updateStay, deleteStay, addTransport, updateTransport, deleteTransport, updateNotes, updateChecklist, addChecklistItem
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrips must be used within TripProvider');
  return context;
};
