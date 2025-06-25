
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardContent } from "@/components/DashboardContent";
import { ProfileSection } from "@/components/ProfileSection";
import { ComplaintForm } from "@/components/ComplaintForm";
import { ComplaintsList } from "@/components/ComplaintsList";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent user={user} />;
      case "profile":
        return <ProfileSection user={user} />;
      case "new-complaint":
        return <ComplaintForm user={user} onSuccess={() => setActiveSection("complaints")} />;
      case "complaints":
        return <ComplaintsList user={user} />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-teal-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <AppSidebar 
          user={user} 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-teal-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Smart Complaint Management System
                </h1>
              </div>
              <div className="text-sm text-gray-600">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </div>
            </div>
          </header>
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
