import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowRight,
  Phone
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Book() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Booking state
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Queries
  const { data: services } = trpc.services.list.useQuery();
  const { data: workHours } = trpc.workHours.list.useQuery();

  const selectedWorkHour = selectedDate ? workHours?.find(w => w.dayOfWeek === selectedDate.getDay()) : undefined;
  
  // Mutation
  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success('تم حجز الموعد بنجاح!');
      navigate('/my-appointments');
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في حجز الموعد');
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
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>تسجيل الدخول مطلوب</CardTitle>
            <CardDescription>
              يرجى تسجيل الدخول لحجز موعد
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/login">
              <Button className="w-full" size="lg">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
          </Link>
          <h1 className="text-lg font-semibold mr-4">حجز موعد</h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { step: 1, label: 'الخدمة', done: !!selectedService },
              { step: 2, label: 'التاريخ والوقت', done: !!selectedDate && !!selectedTime },
              { step: 3, label: 'التأكيد', done: false },
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
                    اختر الخدمة
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
                          "p-4 rounded-lg border-2 text-right transition-all",
                          selectedService === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium">{service.nameAr || service.name}</div>
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.durationMinutes} دقيقة
                          </span>
                          <span className="font-semibold text-primary">{service.price} ر.س</span>
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
                      اختر التاريخ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold">
                        {MONTHS_AR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS_AR.map(day => (
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
                      اختر الوقت
                    </CardTitle>
                    <CardDescription>
                      {selectedDate.toLocaleDateString('ar-SA', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedWorkHour?.isWorkingDay ? (
  <p className="text-center text-muted-foreground py-8">
    هذا اليوم عطلة
  </p>
) : (
  <div className="space-y-4">
    <div className="flex flex-col gap-2">
      <Label htmlFor="time">اختر وقت البداية</Label>
      <Input
        id="time"
        type="time"
        step={300}
        value={selectedTime ?? ""}
        min={selectedWorkHour?.startTime}
        max={selectedWorkHour?.endTime === "00:00" ? "23:59" : selectedWorkHour?.endTime}
        onChange={(e) => setSelectedTime(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        اختر أي وقت يناسبك داخل ساعات العمل، وسيتم حجز المدة حسب زمن الخدمة تلقائياً.
      </p>
    </div>
  </div>
)}
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
                  <CardTitle>ملخص الحجز</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedServiceData ? (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="font-medium">{selectedServiceData.nameAr || selectedServiceData.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-between mt-1">
                        <span>{selectedServiceData.durationMinutes} دقيقة</span>
                        <span className="font-semibold text-primary">{selectedServiceData.price} ر.س</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لم يتم اختيار خدمة</p>
                  )}

                  {selectedDate && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground">التاريخ</div>
                      <div className="font-medium">
                        {selectedDate.toLocaleDateString('ar-SA', { 
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
                      <div className="text-sm text-muted-foreground">الوقت</div>
                      <div className="font-medium">{selectedTime}</div>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="أدخل اسمك"
                          className="pr-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="pr-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="أي ملاحظات إضافية..."
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
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الحجز...
                      </>
                    ) : (
                      'تأكيد الحجز'
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
