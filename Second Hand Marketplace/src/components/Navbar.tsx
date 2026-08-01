import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  Search,
  Heart,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Recycle,
  Plus,
  Shield,
} from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-emerald-700' : 'text-stone-600 hover:text-emerald-700'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-stone-900 hidden sm:block">
                Re<span className="text-emerald-600">Market</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLink('/', 'Browse')}
              {navLink('/search', 'Explore')}
              {navLink('/sell', 'Sell')}
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for items..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/wishlist"
                  className="hidden sm:flex p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>
                <Link
                  to="/messages"
                  className="hidden sm:flex p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                  title="Messages"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
                {profile?.is_admin && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                    title="Admin"
                  >
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-stone-100 transition-colors">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-emerald-700" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top">
                    <div className="p-3 border-b border-stone-100">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {profile?.username || profile?.full_name || 'Account'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      {profile?.is_admin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
                <Link
                  to="/sell"
                  className="ml-1 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Sell
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-full hover:bg-stone-100 text-stone-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 rounded-full text-sm focus:outline-none"
              />
            </form>
            <div className="flex flex-col gap-1">
              <Link to="/" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Browse</Link>
              <Link to="/search" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Explore</Link>
              <Link to="/sell" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Sell an item</Link>
              {user ? (
                <>
                  <Link to="/wishlist" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Wishlist</Link>
                  <Link to="/messages" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Messages</Link>
                  <Link to="/dashboard" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Dashboard</Link>
                  <Link to="/profile" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Profile</Link>
                  {profile?.is_admin && (
                    <Link to="/admin" className="px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg">Admin Panel</Link>
                  )}
                  <button onClick={() => signOut()} className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Sign out</button>
                </>
              ) : (
                <Link to="/auth" className="px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg">Sign in</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
