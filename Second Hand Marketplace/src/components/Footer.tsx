import { Link } from 'react-router-dom';
import { Recycle, Heart, Leaf, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">ReMarket</span>
            </div>
            <p className="text-sm text-stone-400 max-w-md leading-relaxed">
              A peer-to-peer marketplace for second-hand items. Give pre-loved things a second life,
              reduce waste, and connect with your community.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Leaf className="w-4 h-4 text-emerald-500" /> Sustainable
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Shield className="w-4 h-4 text-emerald-500" /> Secure
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Heart className="w-4 h-4 text-emerald-500" /> Community
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/search" className="hover:text-emerald-400 transition-colors">Browse items</Link></li>
              <li><Link to="/sell" className="hover:text-emerald-400 transition-colors">Sell an item</Link></li>
              <li><Link to="/wishlist" className="hover:text-emerald-400 transition-colors">My wishlist</Link></li>
              <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/profile" className="hover:text-emerald-400 transition-colors">Profile</Link></li>
              <li><Link to="/messages" className="hover:text-emerald-400 transition-colors">Messages</Link></li>
              <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">© {new Date().getFullYear()} ReMarket. Built for a circular economy.</p>
          <p className="text-xs text-stone-500">Full-stack web development internship project</p>
        </div>
      </div>
    </footer>
  );
}
