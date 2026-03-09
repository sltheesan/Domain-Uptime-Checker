import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import BrandsPage from "../pages/BrandsPage";
import BrandDetailsPage from "../pages/BrandDetailsPage";
import DomainsPage from "../pages/DomainsPage";
import UsersPage from "../pages/UsersPage";
import SettingsPage from "../pages/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";
import MobileViewPage from "../pages/MobileViewPage";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "mobile-view",
            element: <MobileViewPage />
          },
          {
            element: <AppLayout />,
            children: [
              {
                path: "dashboard",
                element: <DashboardPage />
              },
              {
                path: "brands",
                element: <BrandsPage />
              },
              {
                path: "brands/:id",
                element: <BrandDetailsPage />
              },
              {
                path: "domains",
                element: <DomainsPage />
              }
            ]
          }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: "users",
                element: <UsersPage />
              },
              {
                path: "settings",
                element: <SettingsPage />
              }
            ]
          }
        ]
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
