import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Scissors, 
  User,
  Check,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

export default function Book() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Booking state
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Queries
  const { data: services } = trpc.services.list.useQuery();
  const { data: workHours } = trpc.workHours.list.useQuery();
  const { data: availableSlots, isLoading: slotsLoading } = trpc.appointments.getAvailableSlots.useQuery(
    { 
      date: selectedDate?.toISOString().split('T')[0] || '', 
      serviceId: selectedService || 0 
    },
    { enabled: !!selectedDate && !!selectedService }
  );
  
  // Mutation
  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to book appointment');
    }
  });

  // Get selected service details
  const selectedServiceData = useMemo(() => 
    services?.find(s => s.id === selectedService),
    [services, selectedService]
  );

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const isDateAvailable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const dayOfWeek = date.getDay();
    const workHour = workHours?.find(w => w.dayOfWeek === dayOfWeek);
    return workHour?.isWorkingDay ?? false;
  };

  const handleDateSelect = (day: number) => {
    if (!isDateAvailable(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmit = () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please complete all required fields');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    createAppointment.mutate({
      serviceId: selectedService,
      appointmentDate: appointmentDate.toISOString(),
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: notes || undefined,
    });
  };

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
              Please sign in to book an appointment
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-4">Book Appointment</h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { step: 1, label: 'Service', done: !!selectedService },
              { step: 2, label: 'Date & Time', done: !!selectedDate && !!selectedTime },
              { step: 3, label: 'Confirm', done: false },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    item.done 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {item.done ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                </div>
                {index < 2 && (
                  <div className={cn(
                    "w-12 h-0.5",
                    item.done ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Service & Calendar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Select Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {services?.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service.id);
                          setSelectedTime(null);
                        }}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          selectedService === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium">{service.name}</div>
                        {service.nameAr && (
                          <div className="text-sm text-muted-foreground">{service.nameAr}</div>
                        )}
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes} min
                          </span>
                          <span className="font-semibold text-primary">${service.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar */}
              {selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Select Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold">
                        {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                      
                      {Array.from({ length: startingDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isAvailable = isDateAvailable(day);
                        const isSelected = selectedDate?.getDate() === day && 
                                          selectedDate?.getMonth() === currentMonth.getMonth() &&
                                          selectedDate?.getFullYear() === currentMonth.getFullYear();
                        
                        return (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            disabled={!isAvailable}
                            className={cn(
                              "aspect-square rounded-lg text-sm font-medium transition-all",
                              isSelected 
                                ? "bg-primary text-primary-foreground" 
                                : isAvailable
                                  ? "hover:bg-primary/10"
                                  : "text-muted-foreground/40 cursor-not-allowed"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Slots */}
              {selectedDate && selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Select Time
                    </CardTitle>
                    <CardDescription>
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : !availableSlots?.isWorkingDay ? (
                      <p className="text-center text-muted-foreground py-8">
                        This day is not a working day
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availableSlots?.slots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={cn(
                              "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                              selectedTime === slot.time
                                ? "bg-primary text-primary-foreground"
                                : slot.available
                                  ? "bg-muted hover:bg-primary/10"
                                  : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed line-through"
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary & Form */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedServiceData ? (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="font-medium">{selectedServiceData.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-between mt-1">
                        <span>{selectedServiceData.durationMinutes} minutes</span>
                        <span className="font-semibold text-primary">${selectedServiceData.price}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No service selected</p>
                  )}

                  {selectedDate && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-medium">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {selectedTime && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground">Time</div>
                      <div className="font-medium">{selectedTime}</div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter your phone"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests?"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedService || !selectedDate || !selectedTime || createAppointment.isPending}
                    onClick={handleSubmit}
                  >
                    {createAppointment.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
