import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import ChildHome from "./screens/ChildHome";
import LessonScreen from "./screens/LessonScreen";
import SimulacroScreen from "./screens/SimulacroScreen";
import SessionSummary from "./screens/SessionSummary";
import ParentPinScreen from "./screens/ParentPinScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import ReviewSession from "./screens/ReviewSession";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import TopicsScreen from "./screens/TopicsScreen";
import AppShell from "./components/AppShell";
import { loadProgress } from "./storage/localProgress";

const AcademyScreen = lazy(() => import("./screens/AcademyScreen"));
const SkillMapScreen = lazy(() => import("./screens/SkillMapScreen"));
const ProgressScreen = lazy(() => import("./screens/ProgressScreen"));
const ParentDashboard = lazy(() => import("./screens/ParentDashboard"));

function RequireOnboarding({ children }: { children: ReactNode }) {
  const done = loadProgress().parent.onboardingDone;
  if (!done) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="screen-enter">Cargando...</div>}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route
            path="/"
            element={
              <RequireOnboarding>
                <ChildHome />
              </RequireOnboarding>
            }
          />
          <Route
            path="/topics"
            element={
              <RequireOnboarding>
                <TopicsScreen />
              </RequireOnboarding>
            }
          />
          <Route
            path="/academy"
            element={
              <RequireOnboarding>
                <AcademyScreen />
              </RequireOnboarding>
            }
          />
          <Route
            path="/skills"
            element={
              <RequireOnboarding>
                <SkillMapScreen />
              </RequireOnboarding>
            }
          />
          <Route
            path="/progress"
            element={
              <RequireOnboarding>
                <ProgressScreen />
              </RequireOnboarding>
            }
          />
          <Route path="/simulacro/:type" element={<SimulacroScreen />} />
          <Route path="/lesson/:topicId" element={<LessonScreen />} />
          <Route path="/summary/:sessionId" element={<SessionSummary />} />
          <Route path="/review" element={<ReviewSession />} />
          <Route path="/parent" element={<ParentPinScreen />} />
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
