import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/app-layout";
import { AuthProvider } from "./features/auth/auth-context";
import { LoginPage } from "./features/auth/login-page";
import { ProtectedRoute } from "./features/auth/protected-route";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { BranchesPage } from "./features/property/branches/branches-page";
import { BuildingsPage } from "./features/property/buildings/buildings-page";
import { FloorsPage } from "./features/property/floors/floors-page";
import { RoomTypesPage } from "./features/property/room-types/room-types-page";
import { RoomsPage } from "./features/property/rooms/rooms-page";
import { BedsPage } from "./features/property/beds/beds-page";
import { CustomersPage } from "./features/tenancy/customers/customers-page";
import { BookingsPage } from "./features/tenancy/bookings/bookings-page";
import { ContractsPage } from "./features/tenancy/contracts/contracts-page";
import { BillingPeriodsPage } from "./features/billing/billing-periods-page";
import { InvoicesPage } from "./features/billing/invoices-page";
import { PaymentsPage } from "./features/payments/payments-page";
import { DepositsPage } from "./features/deposits/deposits-page";
import { CashSessionsPage } from "./features/cash-sessions/cash-sessions-page";
import { DebtsPage } from "./features/debts/debts-page";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="room-types" element={<RoomTypesPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="beds" element={<BedsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="billing-periods" element={<BillingPeriodsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="deposits" element={<DepositsPage />} />
          <Route path="cash-sessions" element={<CashSessionsPage />} />
          <Route path="debts" element={<DebtsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
