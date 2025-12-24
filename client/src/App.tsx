import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import MyAppointments from "./pages/MyAppointments";
import Dashboard from "./pages/Dashboard";
import DashboardAppointments from "./pages/DashboardAppointments";
import DashboardServices from "./pages/DashboardServices";
import DashboardHours from "./pages/DashboardHours";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/book" component={Book} />
      <Route path="/my-appointments" component={MyAppointments} />
      
      {/* Admin Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/appointments" component={DashboardAppointments} />
      <Route path="/dashboard/services" component={DashboardServices} />
      <Route path="/dashboard/hours" component={DashboardHours} />
      
      {/* Fallback Routes */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
