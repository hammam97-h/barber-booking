import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  Users, 
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Loader2,
  Settings,
  ArrowLeft,
  Menu,
  Home
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const statusConfig = {
  pending: { 
    label: 'Pending', 
    icon: AlertCircle, 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle, 
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle, 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
  },
};

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: TrendingUp },
  { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { label: 'Services', href: '/dashboard/services', icon: Scissors },
  { label: 'Work Hours', href: '/dashboard/hours', icon: Clock },
];

function DashboardNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: pendingAppointments, isLoading: pendingLoading } = trpc.appointments.pending.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const { data: upcomingAppointments, isLoading: upcomingLoading } = trpc.appointments.upcoming.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const { data: allAppointments } = trpc.appointments.listAll.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Appointment status updated');
      utils.appointments.pending.invalidate();
      utils.appointments.upcoming.invalidate();
      utils.appointments.listAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // Stats
  const todayAppointments = upcomingAppointments?.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  }) || [];

  const totalPending = pendingAppointments?.length || 0;
  const totalUpcoming = upcomingAppointments?.length || 0;
  const totalCompleted = allAppointments?.filter(apt => apt.status === 'completed').length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold">BarberBook</span>
                </div>
                <DashboardNav currentPath={location} />
              </SheetContent>
            </Sheet>
            
            <Link href="/">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold hidden sm:inline">BarberBook Admin</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">View Site</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] p-4 bg-card/50">
          <DashboardNav currentPath={location} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Appointments</p>
                      <p className="text-3xl font-bold">{todayAppointments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Approval</p>
                      <p className="text-3xl font-bold">{totalPending}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Upcoming</p>
                      <p className="text-3xl font-bold">{totalUpcoming}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-3xl font-bold">{totalCompleted}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Pending Appointments
                </CardTitle>
                <CardDescription>
                  Appointments waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : pendingAppointments?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending appointments
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingAppointments?.map((appointment) => {
                      const appointmentDate = new Date(appointment.appointmentDate);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {appointment.customerName || appointment.user?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.service?.name} • {appointment.service?.durationMinutes} min
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointmentDate.toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric' 
                                })} at {appointmentDate.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-16 sm:ml-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => updateStatus.mutate({ id: appointment.id, status: 'cancelled' })}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ id: appointment.id, status: 'confirmed' })}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No appointments scheduled for today
                  </p>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((appointment) => {
                      const status = statusConfig[appointment.status];
                      const StatusIcon = status.icon;
                      const appointmentDate = new Date(appointment.appointmentDate);
                      
                      return (
                        <div 
                          key={appointment.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-[60px]">
                              <p className="text-lg font-semibold">
                                {appointmentDate.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">
                                {appointment.customerName || appointment.user?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.service?.name}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn("gap-1", status.className)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
