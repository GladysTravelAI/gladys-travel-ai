"use client";

import { useAuth } from "@/lib/AuthContext";
import { User, LogOut, LogIn, Settings, CreditCard, Calendar, Menu, MapPin, Plane, Hotel, Bookmark } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
  SheetHeader,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// Main navigation links
const navLinks = [
  { href: "/destinations", label: "Destinations", icon: MapPin },
  { href: "/flights", label: "Flights", icon: Plane },
  { href: "/hotels", label: "Hotels", icon: Hotel },
  { href: "/saved-trips", label: "My Trips", icon: Bookmark },
];

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={40} showText={true} />
          </Link>

          {/* === Desktop Navigation === */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Main Nav Links */}
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Block */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : user ? (
                <UserMenu user={user} onSignOut={handleSignOut} />
              ) : (
                <SignInButton />
              )}
            </div>
          </div>

          {/* === Mobile Navigation === */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu size={24} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white/80 backdrop-blur-xl border-none w-[300px]">
                <SheetHeader>
                  <Logo size={40} showText={true} />
                </SheetHeader>
                <div className="flex flex-col h-full py-6">
                  {/* Mobile Nav Links */}
                  <div className="flex flex-col space-y-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 font-medium hover:bg-black/10 transition-colors"
                        >
                          <link.icon size={20} />
                          <span>{link.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  
                  {/* Mobile Auth Block */}
                  <div className="mt-auto">
                    <Separator className="my-4 bg-black/10" />
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-gray-400/30 border-t-gray-700 rounded-full animate-spin"></div>
                      </div>
                    ) : user ? (
                      <MobileUserMenu user={user} onSignOut={handleSignOut} />
                    ) : (
                      <SheetClose asChild>
                        <SignInButton />
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Sub-Components for Readability ---

const SignInButton = () => (
  <Link
    href="/signin"
    className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all shadow-lg shadow-purple-500/30"
  >
    <LogIn size={16} />
    <span>Sign In</span>
  </Link>
);

const UserMenu = ({ user, onSignOut }: { user: NonNullable<ReturnType<typeof useAuth>['user']>, onSignOut: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center space-x-3 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <User size={18} className="text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-white">
            {user.displayName || 'Traveler'}
          </p>
          <p className="text-xs text-white/70">{user.email}</p>
        </div>
        <Menu size={16} className="text-white/70" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end">
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-900">
          {user.displayName || 'My Account'}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/dashboard" className="flex items-center cursor-pointer">
          <User size={16} className="mr-2" />
          <span>My Profile</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/saved-trips" className="flex items-center cursor-pointer">
          <Bookmark size={16} className="mr-2" />
          <span>My Trips</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/bookings" className="flex items-center cursor-pointer">
          <Calendar size={16} className="mr-2" />
          <span>My Bookings</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/payment" className="flex items-center cursor-pointer">
          <CreditCard size={16} className="mr-2" />
          <span>Payment Info</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/settings" className="flex items-center cursor-pointer">
          <Settings size={16} className="mr-2" />
          <span>Settings</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onSignOut}
        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
      >
        <LogOut size={16} className="mr-2" />
        <span>Sign Out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const MobileUserMenu = ({ user, onSignOut }: { user: NonNullable<ReturnType<typeof useAuth>['user']>, onSignOut: () => void }) => (
  <div className="flex flex-col space-y-3">
    <div className="flex items-center space-x-3 p-2">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
        <User size={20} className="text-white" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-900">
          {user.displayName || 'Traveler'}
        </p>
        <p className="text-xs text-gray-600 truncate">{user.email}</p>
      </div>
    </div>
    <SheetClose asChild>
      <Link href="/dashboard" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 font-medium hover:bg-black/10 transition-colors">
        <User size={16} />
        <span>My Profile</span>
      </Link>
    </SheetClose>
    <SheetClose asChild>
      <Link href="/saved-trips" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 font-medium hover:bg-black/10 transition-colors">
        <Bookmark size={16} />
        <span>My Trips</span>
      </Link>
    </SheetClose>
    <SheetClose asChild>
      <Link href="/bookings" className="flex items-center space-x-3 p-3 rounded-lg text-gray-800 font-medium hover:bg-black/10 transition-colors">
        <Calendar size={16} />
        <span>My Bookings</span>
      </Link>
    </SheetClose>
    <button
      onClick={onSignOut}
      className="flex items-center space-x-3 p-3 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors w-full"
    >
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  </div>
);

export default Navbar;