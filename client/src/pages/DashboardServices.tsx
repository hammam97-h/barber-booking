import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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

type ServiceFormData = {
  name: string;
  nameAr: string;
  description: string;
  durationMinutes: number;
  price: number;
};

export default function DashboardServices() {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    nameAr: '',
    description: '',
    durationMinutes: 30,
    price: 0,
  });

  const { data: services, isLoading } = trpc.services.listAll.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success('Service created successfully');
      utils.services.listAll.invalidate();
      utils.services.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create service');
    }
  });

  const updateService = trpc.services.update.useMutation({
    onSuccess: () => {
      toast.success('Service updated successfully');
      utils.services.listAll.invalidate();
      utils.services.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update service');
    }
  });

  const deleteService = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success('Service deleted successfully');
      utils.services.listAll.invalidate();
      utils.services.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete service');
    }
  });

  const seedServices = trpc.services.seed.useMutation({
    onSuccess: () => {
      toast.success('Default services added');
      utils.services.listAll.invalidate();
      utils.services.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to seed services');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      description: '',
      durationMinutes: 30,
      price: 0,
    });
    setEditingService(null);
  };

  const handleEdit = (service: any) => {
    setFormData({
      name: service.name,
      nameAr: service.nameAr || '',
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price,
    });
    setEditingService(service.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (editingService) {
      updateService.mutate({
        id: editingService,
        ...formData,
      });
    } else {
      createService.mutate(formData);
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Services</h1>
                <p className="text-muted-foreground">Manage your barbershop services</p>
              </div>
              
              <div className="flex gap-2">
                {(!services || services.length === 0) && (
                  <Button 
                    variant="outline" 
                    onClick={() => seedServices.mutate()}
                    disabled={seedServices.isPending}
                  >
                    {seedServices.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Add Default Services
                  </Button>
                )}
                
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? 'Edit Service' : 'Add New Service'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingService 
                          ? 'Update the service details below' 
                          : 'Fill in the details for the new service'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Service Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Haircut"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nameAr">Arabic Name</Label>
                        <Input
                          id="nameAr"
                          value={formData.nameAr}
                          onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                          placeholder="e.g., قص شعر"
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the service"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min={5}
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              durationMinutes: parseInt(e.target.value) || 30 
                            }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            min={0}
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              price: parseInt(e.target.value) || 0 
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={createService.isPending || updateService.isPending}
                      >
                        {(createService.isPending || updateService.isPending) ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {editingService ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : services?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Scissors className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">No services yet</p>
                  <Button onClick={() => seedServices.mutate()} disabled={seedServices.isPending}>
                    Add Default Services
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {services?.map((service) => (
                  <Card key={service.id} className={cn(!service.isActive && "opacity-60")}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Scissors className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              {!service.isActive && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                              )}
                            </div>
                            {service.nameAr && (
                              <p className="text-sm text-muted-foreground">{service.nameAr}</p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.durationMinutes} min
                              </span>
                              <span className="font-semibold text-primary">${service.price}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this service?')) {
                                deleteService.mutate({ id: service.id });
                              }
                            }}
                            disabled={deleteService.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-3 ml-16">
                          {service.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
