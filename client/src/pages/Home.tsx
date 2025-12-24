import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Scissors, 
  Calendar, 
  Clock, 
  Star, 
  ChevronLeft,
  CalendarDays,
  Loader2,
  User,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: services, isLoading: servicesLoading } = trpc.services.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">صالون الحلاقة</span>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isAuthenticated ? (
              <>
                <Link href="/my-appointments">
                  <Button variant="ghost" size="sm">
                    <CalendarDays className="w-4 h-4 ml-2" />
                    مواعيدي
                  </Button>
                </Link>
                
                {user?.role === 'admin' && (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="w-4 h-4 ml-2" />
                      لوحة التحكم
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      {user?.name || user?.phone}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  تسجيل الدخول
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            تجربة حلاقة مميزة
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            احجز موعدك
            <span className="text-primary block mt-2">بكل سهولة</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            استمتع بتجربة حلاقة احترافية مع أفضل الخدمات. احجز موعدك الآن في ثوانٍ معدودة.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                احجز الآن
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            
            {isAuthenticated && (
              <Link href="/my-appointments">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <CalendarDays className="w-4 h-4" />
                  عرض مواعيدي
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">خدماتنا</h2>
            <p className="text-muted-foreground">اختر من بين مجموعة متنوعة من الخدمات</p>
          </div>
          
          {servicesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Scissors className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد خدمات متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Scissors className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{service.nameAr || service.name}</CardTitle>
                    {service.description && (
                      <CardDescription>{service.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {service.durationMinutes} دقيقة
                      </div>
                      <div className="font-bold text-primary text-lg">
                        {service.price} ر.س
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">حجز سهل</h3>
              <p className="text-muted-foreground">
                احجز موعدك في أي وقت ومن أي مكان بخطوات بسيطة
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">وفر وقتك</h3>
              <p className="text-muted-foreground">
                لا حاجة للانتظار، اختر الوقت المناسب لك
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">خدمة مميزة</h3>
              <p className="text-muted-foreground">
                نقدم أفضل الخدمات بأيدي محترفين
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} صالون الحلاقة. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
