import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, Scissors, User, ChevronRight, Star, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: services } = trpc.services.list.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">BarberBook</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/my-appointments">
                  <Button variant="ghost" size="sm">My Appointments</Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user?.name || 'User'}</span>
                </div>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Premium Barbershop Experience</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Book Your Perfect
              <span className="block mt-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Grooming Session
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the art of traditional barbering with modern convenience. 
              Book your appointment in seconds and enjoy premium grooming services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  Book Appointment
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/my-appointments">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                  <Calendar className="w-4 h-4" />
                  View My Bookings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our range of professional grooming services, 
              each delivered with precision and care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {services?.map((service) => (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Scissors className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  {service.nameAr && (
                    <p className="text-sm text-muted-foreground">{service.nameAr}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description || 'Professional grooming service'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.durationMinutes} min</span>
                    </div>
                    <span className="text-lg font-semibold text-primary">
                      ${service.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!services || services.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Scissors className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Services will be available soon</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground text-sm">
                Book your appointment in just a few clicks with our intuitive calendar system.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Flexible Hours</h3>
              <p className="text-muted-foreground text-sm">
                Choose from available time slots that fit your schedule perfectly.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium Service</h3>
              <p className="text-muted-foreground text-sm">
                Experience top-quality grooming from skilled professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for a Fresh Look?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Book your appointment now and experience the difference of professional grooming.
          </p>
          <Link href="/book">
            <Button size="lg" variant="secondary" className="gap-2 px-8">
              Book Now
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">BarberBook</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BarberBook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
