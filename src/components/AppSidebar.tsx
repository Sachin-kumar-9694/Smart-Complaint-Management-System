
import { 
  Home, 
  User, 
  FileText, 
  Plus, 
  LogOut, 
  Shield,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AppSidebarProps {
  user: SupabaseUser | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onSignOut: () => void;
}

export function AppSidebar({ user, activeSection, setActiveSection, onSignOut }: AppSidebarProps) {
  const menuItems = [
    {
      title: "Dashboard",
      url: "dashboard",
      icon: Home,
    },
    {
      title: "Profile",
      url: "profile",
      icon: User,
    },
    {
      title: "New Complaint",
      url: "new-complaint",
      icon: Plus,
    },
    {
      title: "My Complaints",
      url: "complaints",
      icon: FileText,
    },
  ];

  return (
    <Sidebar className="bg-white/80 backdrop-blur-md border-r border-teal-100">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              SCMS
            </h2>
            <p className="text-xs text-gray-500">Smart Complaint Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setActiveSection(item.url)}
                    isActive={activeSection === item.url}
                    className={`w-full justify-start ${
                      activeSection === item.url 
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600' 
                        : 'hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm font-medium text-teal-800">
              {user?.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs text-teal-600">{user?.email}</p>
            <p className="text-xs text-teal-500 capitalize">
              Role: {user?.user_metadata?.role || "user"}
            </p>
          </div>
          <Button
            onClick={onSignOut}
            variant="outline"
            className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
