import type React from "react"
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/queryClient"
import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"

import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "./context/ThemeContext"
import { SidebarProvider } from "./context/sidebar-context"
import { useSidebar } from "./context/sidebar-context"

import NotFound from "@/pages/not-found"
import Dashboard from "@/pages/Dashboard"
import Clients from "@/pages/Clients"
import Plans from "@/pages/Plans"
import NutritionPlans from "@/pages/NutritionPlans"
import FitnessPlans from "@/pages/FitnessPlans"
import Notes from "@/pages/Notes"
import Payments from "@/pages/Payments"
import Branding from "@/pages/Branding"
import Login from "@/pages/login"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import ClientProfilePage from "./pages/ClientProfilePage"
import HomePage from "./pages/HomePage"
import Navbar from "./components/layout/Navbar"
import { cn } from "@/lib/utils"
import ExerciseLibrary from "./pages/ExcerciseLibrary"
import FitnessCalendar from "./pages/Calendar-excercise"
import SignupPage from "./pages/Signup"
import AllProgramsPage from './pages/programs'
import TrainerProfilePage from "./pages/TrainerProfilePage"
import AuthCallback from "@/components/auth/AuthCallback"
import DatePickerTestPage from "./pages/DatePickerTestPage"

// ProtectedRoute wrapper - now properly protects routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true)
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, show the protected content
  return <>{children}</>
}

// Layout for protected routes (with sidebar and topbar)
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar()

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1">
        <TopBar />
        <main className={cn("p-6 transition-all duration-300 ease-in-out", isExpanded ? "ml-64" : "ml-16")}>
          {children}
        </main>
      </div>
    </div>
  )
}

// Layout for public routes (no sidebar/topbar)
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes - no authentication required */}
                <Route
                  path="/"
                  element={
                    <PublicLayout>
                      <HomePage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicLayout>
                      <Login />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicLayout>
                      <SignupPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/auth/callback"
                  element={<AuthCallback />}
                />

                {/* Protected routes - authentication required */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Dashboard />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Clients />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client/:id"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ClientProfilePage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Plans />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                /> 
                <Route
                  path="/excercise-lib"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <ExerciseLibrary />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fitness-plans"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <FitnessPlans />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fitness-calendar"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <FitnessCalendar />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/date-picker-test"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <DatePickerTestPage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/programs"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <AllProgramsPage />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Notes />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Payments />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/branding"
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout>
                        <Branding />
                      </ProtectedLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trainer-profile"
                  element={
                    <ProtectedRoute>
                      <TrainerProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </TooltipProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
