import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";

import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Accounts from "./pages/Accounts";
import AccountDetails from "./pages/AccountDetails";
import Categories from "./pages/Categories";
import Budgets from "./pages/Budgets";
import Bills from "./pages/Bills";
import { DateProvider } from "./context/DateContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import Alerts from "./pages/Alerts";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ToastContainer />

      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard (protected + layout) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DateProvider>
                  <DashboardLayout />
                </DateProvider>
              </ProtectedRoute>
            }
          >
            
            <Route index element={<DashboardHome />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:accountId" element={<AccountDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="bills" element={<Bills />} />
            <Route path="profile" element={<Profile />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="alerts" element={<Alerts />} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
