import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { StatsPage } from '@/features/dashboard/StatsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { PropertiesPage } from '@/features/properties/PropertiesPage';
import { RequestsPage } from '@/features/requests/RequestsPage';
import { BroadcastPage } from '@/features/broadcast/BroadcastPage';
import { BannersPage } from '@/features/banners/BannersPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { PrivacyPolicyPage } from '@/features/legal/PrivacyPolicyPage';
import { PublicListingPage } from '@/features/public/PublicListingPage';
import { PublicRequestPage } from '@/features/public/PublicRequestPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  // Public share landing pages (no auth) — what a shared listing/request link
  // resolves to when Android App Links don't open the app directly.
  { path: '/listing/:id', element: <PublicListingPage /> },
  { path: '/request/:id', element: <PublicRequestPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <StatsPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/properties', element: <PropertiesPage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/broadcast', element: <BroadcastPage /> },
          { path: '/banners', element: <BannersPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
