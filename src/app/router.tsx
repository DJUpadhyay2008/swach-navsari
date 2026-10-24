import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/pages/LandingPage';
import { ReportIssuePage } from '@/pages/ReportIssuePage';
import { MyReportsPage } from '@/pages/MyReportsPage';
import { ReportDetailPage } from '@/pages/ReportDetailPage';
import { TrackComplaintPage } from '@/pages/TrackComplaintPage';
import { AuthPage } from '@/pages/AuthPage';
import { WorkerPortalPage } from '@/pages/WorkerPortalPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Municipal Admin Operations
import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminReportDetailPage } from '@/pages/admin/AdminReportDetailPage';
import { AdminAssignmentsPage } from '@/pages/admin/AdminAssignmentsPage';
import { AdminVerificationsPage } from '@/pages/admin/AdminVerificationsPage';
import { AdminMapPage } from '@/pages/admin/AdminMapPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'auth',
        element: <AuthPage />,
      },
      {
        path: 'report',
        element: <ReportIssuePage />,
      },
      {
        path: 'my-reports',
        element: <MyReportsPage />,
      },
      {
        path: 'reports/:id',
        element: <ReportDetailPage />,
      },
      {
        path: 'track',
        element: <TrackComplaintPage />,
      },
      {
        path: 'worker',
        element: <WorkerPortalPage />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <AdminOverviewPage />,
      },
      {
        path: 'reports',
        element: <AdminReportsPage />,
      },
      {
        path: 'reports/:id',
        element: <AdminReportDetailPage />,
      },
      {
        path: 'assignments',
        element: <AdminAssignmentsPage />,
      },
      {
        path: 'verifications',
        element: <AdminVerificationsPage />,
      },
      {
        path: 'map',
        element: <AdminMapPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
      {
        path: 'staff',
        element: <AdminStaffPage />,
      },
      {
        path: 'audit',
        element: <AdminAuditPage />,
      },
    ],
  },
]);
