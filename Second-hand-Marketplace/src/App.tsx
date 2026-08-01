import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { AuthPage } from '@/pages/AuthPage';
import { SellPage } from '@/pages/SellPage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SellerPage } from '@/pages/SellerPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-stone-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/seller/:id" element={<SellerPage />} />
              <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/messages/:id" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
