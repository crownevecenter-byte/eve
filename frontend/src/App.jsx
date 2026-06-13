// frontend/src/App.jsx
import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PageSuspense from './components/PageSuspense';
import CustomerPortalGate from './components/customer/CustomerPortalGate';
import { RedirectTrackToMy } from './components/customer/CustomerRouteRedirect';

// Public Pages
const Home = lazy(() => import('./pages/public/Home'));
const TrackOrder = lazy(() => import('./pages/public/TrackOrder'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const TermsOfService = lazy(() => import('./pages/public/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const PublicCart = lazy(() => import('./pages/public/Cart'));
const PublicCheckout = lazy(() => import('./pages/checkout/Checkout'));
const NotFound = lazy(() => import('./pages/public/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Auth Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Forgot = lazy(() => import('./pages/auth/Forgot'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));

// Dashboards - Owner
const OwnerLayout = lazy(() => import('./components/owner/OwnerLayout'));
const OwnerDashboard = lazy(() => import('./pages/dashboards/owner/Dashboard'));
const OwnerBranches = lazy(() => import('./pages/dashboards/owner/Branches'));
const OwnerParts = lazy(() => import('./pages/dashboards/owner/Parts'));
const OwnerUsers = lazy(() => import('./pages/dashboards/owner/Users'));
const OwnerReports = lazy(() => import('./pages/dashboards/owner/Reports'));
const OwnerSettings = lazy(() => import('./pages/dashboards/owner/Settings'));
const OwnerOrders = lazy(() => import('./pages/dashboards/owner/Orders'));
const OwnerPurchases = lazy(() => import('./pages/dashboards/owner/Purchases'));

// Dashboards - Branch
const BranchLayout = lazy(() => import('./components/branch/BranchLayout'));
const BranchDashboard = lazy(() => import('./pages/dashboards/branch/Dashboard'));
const BranchProducts = lazy(() => import('./pages/dashboards/branch/Products'));
const BranchInventory = lazy(() => import('./pages/dashboards/branch/Inventory'));
const BranchOrders = lazy(() => import('./pages/dashboards/branch/Orders'));
const BranchServices = lazy(() => import('./pages/dashboards/branch/Services'));
const BranchAppointments = lazy(() => import('./pages/dashboards/branch/Appointments'));
const BranchSuppliers = lazy(() => import('./pages/dashboards/branch/Suppliers'));
const BranchReports = lazy(() => import('./pages/dashboards/branch/Reports'));
const BranchPOS = lazy(() => import('./pages/dashboards/branch/POS'));
const BranchSettings = lazy(() => import('./pages/dashboards/branch/Settings'));

// Customer Portal
const CustomerLayout = lazy(() => import('./components/customer/CustomerLayout'));
const CustomerDashboard = lazy(() => import('./pages/dashboards/customer/Dashboard'));
const CustomerOrders = lazy(() => import('./pages/dashboards/customer/Orders'));
const CustomerBookings = lazy(() => import('./pages/dashboards/customer/Bookings'));
const CustomerProfile = lazy(() => import('./pages/dashboards/customer/Profile'));
const CustomerShop = lazy(() => import('./pages/dashboards/customer/Shop'));
const CustomerCart = lazy(() => import('./pages/dashboards/customer/Cart'));
const CustomerCheckout = lazy(() => import('./pages/dashboards/customer/Checkout'));
const CustomerTrack = lazy(() => import('./pages/dashboards/customer/TrackOrder'));
const CustomerBookService = lazy(() => import('./pages/dashboards/customer/BookService'));
const ProductDetail = lazy(() => import('./pages/dashboards/customer/ProductDetail'));

import { BRANCH_DASHBOARD_ROLES } from './constants/roles';

const AppRoutes = () => (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<Layout isPublic />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<CustomerPortalGate><CustomerShop /></CustomerPortalGate>} />
              <Route path="/product/:id" element={<CustomerPortalGate><ProductDetail /></CustomerPortalGate>} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              <Route path="/track/:id" element={<ProtectedRoute><CustomerPortalGate><TrackOrder /></CustomerPortalGate></ProtectedRoute>} />
              <Route path="/cart" element={<CustomerPortalGate><PublicCart /></CustomerPortalGate>} />
              <Route path="/checkout" element={<CustomerPortalGate><PublicCheckout /></CustomerPortalGate>} />
            </Route>

            <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
            <Route path="/register" element={<PageSuspense><Register /></PageSuspense>} />
            <Route path="/forgot" element={<PageSuspense><Forgot /></PageSuspense>} />
            <Route path="/verify-otp" element={<PageSuspense><VerifyOtp /></PageSuspense>} />

            <Route element={<PageSuspense><ProtectedRoute allowedRoles={['COMPANY_OWNER']}><OwnerLayout /></ProtectedRoute></PageSuspense>}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/branches" element={<OwnerBranches />} />
              <Route path="/owner/parts" element={<OwnerParts />} />
              <Route path="/owner/users" element={<OwnerUsers />} />
              <Route path="/owner/reports" element={<OwnerReports />} />
              <Route path="/owner/settings" element={<OwnerSettings />} />
              <Route path="/owner/orders" element={<OwnerOrders />} />
              <Route path="/owner/purchases" element={<OwnerPurchases />} />
            </Route>

            <Route element={<PageSuspense><ProtectedRoute allowedRoles={BRANCH_DASHBOARD_ROLES}><BranchLayout /></ProtectedRoute></PageSuspense>}>
              <Route path="/branch" element={<Navigate to="/branch/dashboard" replace />} />
              <Route path="/branch/dashboard" element={<BranchDashboard />} />
              <Route path="/branch/products" element={<BranchProducts />} />
              <Route path="/branch/inventory" element={<BranchInventory />} />
              <Route path="/branch/orders" element={<BranchOrders />} />
              <Route path="/branch/services" element={<BranchServices />} />
              <Route path="/branch/appointments" element={<BranchAppointments />} />
              <Route path="/branch/suppliers" element={<BranchSuppliers />} />
              <Route path="/branch/reports" element={<BranchReports />} />
              <Route path="/branch/settings" element={<BranchSettings />} />
            </Route>

            <Route element={<PageSuspense><ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerLayout /></ProtectedRoute></PageSuspense>}>
              <Route path="/my/dashboard" element={<CustomerDashboard />} />
              <Route path="/my/orders" element={<CustomerOrders />} />
              <Route path="/my/bookings" element={<CustomerBookings />} />
              <Route path="/my/profile" element={<CustomerProfile />} />
              <Route path="/my/shop" element={<CustomerShop />} />
              <Route path="/my/product/:id" element={<ProductDetail />} />
              <Route path="/my/cart" element={<CustomerCart />} />
              <Route path="/my/checkout" element={<CustomerCheckout />} />
              <Route path="/my/track/:id" element={<CustomerTrack />} />
              <Route path="/track/:id" element={<RedirectTrackToMy />} />
              <Route path="/my/book-service" element={<CustomerBookService />} />
              <Route path="/appointments" element={<Navigate to="/my/book-service" replace />} />
            </Route>

            <Route
              path="/branch/pos"
              element={
                <PageSuspense>
                  <ProtectedRoute allowedRoles={['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE']}>
                    <BranchPOS />
                  </ProtectedRoute>
                </PageSuspense>
              }
            />

            <Route path="/unauthorized" element={<PageSuspense><Unauthorized /></PageSuspense>} />
            <Route path="*" element={<PageSuspense><NotFound /></PageSuspense>} />
          </Routes>
        </BrowserRouter>
);

const App = () => (
  <AuthProvider>
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  </AuthProvider>
);

export default App;
