import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RootRedirect } from "@/components/common/RootRedirect";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PersonalAuth from "./pages/PersonalAuth";
import PersonalArea from "./pages/PersonalArea";
import PersonalStudents from "./pages/PersonalStudents";
import PersonalStudentDetail from "./pages/PersonalStudentDetail";
import SharedWorkout from "./pages/SharedWorkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="nexfit-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/personal-login" element={<PersonalAuth />} />
                <Route
                  path="/app" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/personal-area" 
                  element={
                    <ProtectedRoute>
                      <PersonalArea />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/personal-students" 
                  element={
                    <ProtectedRoute>
                      <PersonalStudents />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/personal-students/:studentId" 
                  element={
                    <ProtectedRoute>
                      <PersonalStudentDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/shared/:token" element={<SharedWorkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
