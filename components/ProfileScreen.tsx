import React, { useState, useEffect } from 'react';
import { Camera, Edit, Settings, MapPin, Calendar, DollarSign, TrendingUp, ChevronRight, Star, User } from 'lucide-react';

// Simulated user profile manager (replace with your actual implementation)
interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  status: string;
  starRating: number;
  destinations: number;
  tripsPlanned: number;
  totalSpent: number;
  upcomingTrips: number;
}

const ProfileScreen = () => {
  const [profile, setProfile] = useState<UserProfile>({
    userId: 'user123',
    name: 'Traveler',
    email: 'maxnekhavhambe@gmail.com',
    status: 'Explorer',
    starRating: 3,
    destinations: 8,
    tripsPlanned: 12,
    totalSpent: 24500,
    upcomingTrips: 2
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    email: profile.email
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load from localStorage (replace with actual API call)
      const savedProfile = localStorage.getItem('userProfile');
      const savedImage = localStorage.getItem('profileImage');
      
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setEditForm({ name: parsed.name, email: parsed.email });
      }
      
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedProfile = {
      ...profile,
      name: editForm.name,
      email: editForm.email
    };
    
    setProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    setIsEditingProfile(false);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-6 h-6 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold mb-2">Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span>Trip reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span>Price alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Marketing emails</span>
                  </label>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold mb-2">Privacy</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span>Share travel stats</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span>Allow profile discovery</span>
                  </label>
                </div>
              </div>
              
              <button className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Profile</h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {editForm.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition">
                    <Camera className="w-5 h-5 text-gray-700" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gladys</h1>
              <p className="text-amber-300 text-sm font-semibold">Travel AI</p>
            </div>
          </div>
          <button className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex flex-col items-center">
            {/* Profile Image */}
            <div className="relative mb-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-100 transition">
                <Camera className="w-5 h-5 text-gray-700" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info */}
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h2>
            <p className="text-gray-600 mb-6">{profile.email}</p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full mb-6">
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Status Badge */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-6 w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-400 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Status</p>
                  <p className="text-2xl font-bold text-amber-900">{profile.status}</p>
                </div>
              </div>
              <div className="flex gap-1 justify-center">
                {renderStars(profile.starRating)}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="bg-blue-500 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{profile.destinations}</p>
            <p className="text-gray-600 font-medium">Destinations</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="bg-purple-500 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{profile.tripsPlanned}</p>
            <p className="text-gray-600 font-medium">Trips Planned</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">
              ${(profile.totalSpent / 1000).toFixed(1)}k
            </p>
            <p className="text-gray-600 font-medium">Total Spent</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="bg-orange-500 rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{profile.upcomingTrips}</p>
            <p className="text-gray-600 font-medium">Upcoming</p>
          </div>
        </div>

        {/* Upcoming Trips Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 rounded-2xl w-16 h-16 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Upcoming Trips</h3>
              <p className="text-gray-600">You have {profile.upcomingTrips} trips planned</p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;