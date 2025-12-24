import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Clock, 
  Scissors,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
  Home,
  Menu,
  Users
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
    label: 'قيد الانتظار', 
    icon: AlertCircle, 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  confirmed: { 
    label: 'مؤكد', 
    icon: CheckCircle, 
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle, 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
  },
};

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

export default function DashboardAppointments() {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: allAppointments, isLoading } = trpc.appointments.listAll.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('تم تحديث حالة الموعد');
      utils.appointments.listAll.invalidate();
      utils.appointments.pending.invalidate();
      utils.appointments.upcoming.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'فشل في تحديث الحالة');
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

  const filteredAppointments = allAppointments?.filter(apt => 
    statusFilter === 'all' || apt.status === statusFilter
  ) || [];

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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold hidden sm:inline">لوحة التحكم</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">الموقع</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-row-reverse">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] p-4 bg-card/50">
          <DashboardNav currentPath={location} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">جميع المواعيد</h1>
                <p className="text-muted-foreground">إدارة جميع مواعيد العملاء</p>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مواعيد</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>العميل</TableHead>
                          <TableHead>الخدمة</TableHead>
                          <TableHead>التاريخ والوقت</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead className="text-left">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.map((appointment) => {
                          const status = statusConfig[appointment.status as keyof typeof statusConfig];
                          const StatusIcon = status?.icon || AlertCircle;
                          const appointmentDate = new Date(appointment.appointmentDate);
                          
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {appointment.customerName || appointment.user?.name || 'عميل'}
                                    </p>
                                    {appointment.customerPhone && (
                                      <p className="text-xs text-muted-foreground">
                                        {appointment.customerPhone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{appointment.service?.nameAr || appointment.service?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {appointment.service?.durationMinutes} دقيقة • {appointment.service?.price} ر.س
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {appointmentDate.toLocaleDateString('ar-SA', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {appointmentDate.toLocaleTimeString('ar-SA', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("gap-1", status?.className)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status?.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-left">
                                <Select
                                  value={appointment.status}
                                  onValueChange={(value) => 
                                    updateStatus.mutate({ 
                                      id: appointment.id, 
                                      status: value as any 
                                    })
                                  }
                                  disabled={updateStatus.isPending}
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                                    <SelectItem value="confirmed">مؤكد</SelectItem>
                                    <SelectItem value="completed">مكتمل</SelectItem>
                                    <SelectItem value="cancelled">ملغي</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
