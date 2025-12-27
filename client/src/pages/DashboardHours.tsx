import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  Scissors,
  TrendingUp,
  Loader2,
  Home,
  Menu,
  Save
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const navItems = [
  { label: 'الرئيسية', href: '/dashboard', icon: TrendingUp },
  { label: 'المواعيد', href: '/dashboard/appointments', icon: Calendar },
  { label: 'الخدمات', href: '/dashboard/services', icon: Scissors },
  { label: 'ساعات العمل', href: '/dashboard/hours', icon: Clock },
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

type WorkHourData = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  slotDurationMinutes: number;
};

export default function DashboardHours() {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [workHoursData, setWorkHoursData] = useState<WorkHourData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: workHours, isLoading } = trpc.workHours.list.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const updateWorkHours = trpc.workHours.update.useMutation({
    onSuccess: () => {
      utils.workHours.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث ساعات العمل');
    }
  });

  useEffect(() => {
    if (workHours) {
      // Initialize with existing data or defaults
      const initialData: WorkHourData[] = DAYS.map((_, index) => {
        const existing = workHours.find(w => w.dayOfWeek === index);
        return existing ? {
          dayOfWeek: existing.dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
          isWorkingDay: existing.isWorkingDay,
          slotDurationMinutes: existing.slotDurationMinutes,
        } : {
          dayOfWeek: index,
          startTime: '09:00',
          endTime: '18:00',
          isWorkingDay: index !== 5 && index !== 6, // Default: weekends off
          slotDurationMinutes: 30,
        };
      });
      setWorkHoursData(initialData);
    }
  }, [workHours]);

  const handleChange = (dayIndex: number, field: keyof WorkHourData, value: any) => {
    setWorkHoursData(prev => prev.map((day, i) => 
      i === dayIndex ? { ...day, [field]: value } : day
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      for (const day of workHoursData) {
        await updateWorkHours.mutateAsync(day);
      }
      toast.success('تم حفظ ساعات العمل بنجاح');
      setHasChanges(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
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
              <SheetContent side="right" className="w-64 p-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Scissors className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold">صالون الحلاقة</span>
                </div>
                <DashboardNav currentPath={location} />
              </SheetContent>
            </Sheet>
            
            <Link href="/">
                          </div>
                        )}
                        
                        {!day.isWorkingDay && (
                          <span className="text-sm text-muted-foreground">مغلق</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>نصائح</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• قم بتفعيل/إلغاء تفعيل المفتاح لتحديد يوم العمل أو الإغلاق.</p>
                <p>• حدد وقت البداية والنهاية لكل يوم عمل.</p>
                <p>• المستخدم يختار وقت البداية بحرّية داخل ساعات العمل، والنظام يمنع التداخل تلقائياً.</p>
                <p>• التغييرات ستؤثر على الحجوزات المستقبلية فقط.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
