import { useState, useEffect } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, UserProvider, useUser, getTelegramUser } from "./components/ThemeProvider";
import BottomNav, { ThemeToggle } from "./components/BottomNav";
import SplashScreen from "./components/SplashScreen";
import HomePage from "./pages/HomePage";
import AnimalPage from "./pages/AnimalPage";
import CatchersPage from "./pages/CatchersPage";
import ServicesPage from "./pages/ServicesPage";
import AdsPage from "./pages/AdsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";

/** Inner component that has access to UserContext */
function AppRoutes() {
  const { user, setUser } = useUser();
  const [splashDone, setSplashDone] = useState(false);

  // Ensure we start on the home route — runs once on mount only
  useEffect(() => {
    if (!window.location.hash || window.location.hash === "#" || window.location.hash === "") {
      window.location.replace(window.location.pathname + window.location.search + "#/");
    }
  }, []);

  // Auto-login from Telegram WebApp
  useEffect(() => {
    if (user) return; // already logged in
    const tgUser = getTelegramUser();
    if (tgUser) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      setUser({
        id: tgUser.id,
        name: fullName || "Telegram User",
        phone: tgUser.username ? `@${tgUser.username}` : "",
        role: "guest",
        isSubscribed: false,
        avatarUrl: tgUser.photo_url || null,
        tgUser,
      });
    }
    // MAX auto-login (если пришли из MAX)
    if (!tgUser) {
      import("@/hooks/usePlatform").then(({ platform: plat }) => {
        if (plat === "max") {
          setUser({
            id: 0,
            name: "Пользователь MAX",
            phone: "",
            role: "guest",
            isSubscribed: false,
            avatarUrl: null,
          });
        }
      });
    }

    // Expand TG WebApp
    try { window.Telegram?.WebApp?.expand?.(); } catch {}
    try { window.Telegram?.WebApp?.ready?.(); } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background">
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {/* Global floating theme toggle — top right corner */}
      <div style={{ position: "fixed", top: "0.75rem", right: "0.75rem", zIndex: 999 }}>
        <ThemeToggle />
      </div>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/animal/:id" component={AnimalPage} />
          <Route path="/catchers" component={CatchersPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/ads" component={AdsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/auth" component={AuthPage} />
          {/* Fallback: any unmatched route → home */}
          <Route><Redirect to="/" /></Route>
        </Switch>
        <BottomNav />
      </Router>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserProvider>
          <AppRoutes />
          <Toaster />
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
