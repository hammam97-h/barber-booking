import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User,
  ArrowLeft,
  Plus,
  Loader2,
  CalendarX,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

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

export default function MyAppointments() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: appointments, isLoading } = trpc.appointments.myAppointments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const cancelAppointment = trpc.appointments.cancel.useMutation({
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      utils.appointments.myAppointments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel appointment');
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()} className="block">
              <Button className="w-full" size="lg">
                Sign In to Continue
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingAppointments = appointments?.filter(
    apt => new Date(apt.appointmentDate) >= new Date() && apt.status !== 'cancelled'
  ) || [];
  
  const pastAppointments = appointments?.filter(
    apt => new Date(apt.appointmentDate) < new Date() || apt.status === 'cancelled'
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold ml-4">My Appointments</h1>
          </div>
          <Link href="/book">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Upcoming Appointments */}
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Appointments
                </h2>
                
                {upcomingAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarX className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                      <Link href="/book">
                        <Button>Book an Appointment</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => {
                      const status = statusConfig[appointment.status];
                      const StatusIcon = status.icon;
                      const appointmentDate = new Date(appointment.appointmentDate);
                      const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
                      
                      return (
                        <Card key={appointment.id} className="overflow-hidden">
                          <div className="flex">
                            {/* Date Badge */}
                            <div className="w-24 bg-primary/5 flex flex-col items-center justify-center p-4 border-r">
                              <span className="text-3xl font-bold text-primary">
                                {appointmentDate.getDate()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {appointmentDate.toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {appointmentDate.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold">{appointment.service?.name}</h3>
                                  {appointment.service?.nameAr && (
                                    <p className="text-sm text-muted-foreground">
                                      {appointment.service.nameAr}
                                    </p>
                                  )}
                                </div>
                                <Badge className={cn("gap-1", status.className)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {appointmentDate.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Scissors className="w-4 h-4" />
                                  {appointment.service?.durationMinutes} min
                                </span>
                              </div>
                              
                              {appointment.notes && (
                                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3">
                                  {appointment.notes}
                                </p>
                              )}
                              
                              {canCancel && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                      Cancel Appointment
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel this appointment? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => cancelAppointment.mutate({ id: appointment.id })}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Yes, Cancel
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Past Appointments */}
              {pastAppointments.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Past Appointments
                  </h2>
                  
                  <div className="space-y-3">
                    {pastAppointments.map((appointment) => {
                      const status = statusConfig[appointment.status];
                      const StatusIcon = status.icon;
                      const appointmentDate = new Date(appointment.appointmentDate);
                      
                      return (
                        <Card key={appointment.id} className="opacity-75">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <span className="text-lg font-semibold">
                                    {appointmentDate.getDate()}
                                  </span>
                                  <span className="text-xs text-muted-foreground block">
                                    {appointmentDate.toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium">{appointment.service?.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {appointmentDate.toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Badge className={cn("gap-1", status.className)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
