"use client";

import { useAuth } from "@/lib/AuthContext";
import { User, LogOut, LogIn, Settings, Menu, MapPin, Plane, Hotel, Bookmark } from "lucide-react";
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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size={36} showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              ) : user ? (
                <UserMenu user={user} onSignOut={handleSignOut} />
              ) : (
                <SignInButton />
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100">
                  <Menu size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white w-[85vw] max-w-sm">
                <SheetHeader className="text-left pb-4">
                  <Logo size={36} showText={true} />
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100%-80px)] py-6">
                  {/* Mobile Nav Links */}
                  <div className="flex flex-col space-y-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-100 transition-colors"
                        >
                          <link.icon size={20} className="text-gray-600" />
                          <span>{link.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  
                  {/* Mobile Auth */}
                  <div className="mt-auto pt-6">
                    <Separator className="mb-4" />
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                      </div>
                    ) : user ? (
                      <MobileUserMenu user={user} onSignOut={handleSignOut} />
                    ) : (
                      <SheetClose asChild>
                        <SignInButton mobile />
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

const SignInButton = ({ mobile = false }: { mobile?: boolean }) => (
  <Link
    href="/signin"
    className={`flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-semibold transition-all shadow-sm ${
      mobile ? 'w-full' : ''
    }`}
  >
    <LogIn size={16} />
    <span>Sign In</span>
  </Link>
);

const UserMenu = ({ user, onSignOut }: { user: any, onSignOut: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900 max-w-[100px] truncate">
          {user.displayName || 'Account'}
        </span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56 bg-white" align="end">
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
          <span>Profile</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/saved-trips" className="flex items-center cursor-pointer">
          <Bookmark size={16} className="mr-2" />
          <span>My Trips</span>
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
        className="text-red-600 focus:text-red-600 cursor-pointer"
      >
        <LogOut size={16} className="mr-2" />
        <span>Sign Out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const MobileUserMenu = ({ user, onSignOut }: { user: any, onSignOut: () => void }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
        <User size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {user.displayName || 'Traveler'}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
    
    <SheetClose asChild>
      <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-100 transition-colors">
        <User size={18} className="text-gray-600" />
        <span>Profile</span>
      </Link>
    </SheetClose>
    
    <SheetClose asChild>
      <Link href="/saved-trips" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-100 transition-colors">
        <Bookmark size={18} className="text-gray-600" />
        <span>My Trips</span>
      </Link>
    </SheetClose>
    
    <SheetClose asChild>
      <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-900 font-medium hover:bg-gray-100 transition-colors">
        <Settings size={18} className="text-gray-600" />
        <span>Settings</span>
      </Link>
    </SheetClose>
    
    <button
      onClick={onSignOut}
      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors w-full"
    >
      <LogOut size={18} />
      <span>Sign Out</span>
    </button>
  </div>
);

export default Navbar;