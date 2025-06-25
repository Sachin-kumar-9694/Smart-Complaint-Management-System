
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface ProfileSectionProps {
  user: User | null;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Create profile if it doesn't exist
        setProfileData({
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          phone: user?.user_metadata?.phone || '',
          avatar_url: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfileData({
        ...profileData,
        avatar_url: data.publicUrl
      });

      toast({
        title: "Avatar uploaded successfully",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profile updated successfully",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Profile Settings
        </h2>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-2xl">
                  {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : <UserIcon className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="relative">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center space-x-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span>{uploading ? "Uploading..." : "Change Avatar"}</span>
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={handleInputChange}
                  className="border-teal-200 focus:border-teal-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="border-teal-200 focus:border-teal-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleInputChange}
                className="border-teal-200 focus:border-teal-500"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                disabled={loading || uploading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Read-only account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">User ID</Label>
              <p className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">
                {user?.id}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Role</Label>
              <p className="text-sm text-gray-800 capitalize bg-teal-50 text-teal-700 px-2 py-1 rounded w-fit">
                {user?.user_metadata?.role || 'user'}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Account Created</Label>
            <p className="text-sm text-gray-800">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
