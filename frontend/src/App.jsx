/* Application entry point that connects authentication and page routing. */
import { useEffect, useState } from "react";
import MainLayout from "./layouts/MainLayout.jsx";
import useAuth from "./context/useAuth.js";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rooms from "./pages/Rooms.jsx";
import Reservations from "./pages/Reservations.jsx";
import ReservationForm from "./pages/ReservationForm.jsx";
import Billing from "./pages/Billing.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoiceDetails from "./pages/InvoiceDetails.jsx";
import MyInvoices from "./pages/MyInvoices.jsx";
import PaymentStatus from "./pages/PaymentStatus.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Profile from "./pages/Profile.jsx";
import Users from "./pages/Users.jsx";
import NotFound from "./pages/NotFound.jsx";
import NotAuthorized from "./pages/NotAuthorized.jsx";
import { Alert, Loader } from "./components/UI.jsx";
import { navigate } from "./router.js";

function CurrentPage({ path }) {
  if (path === "/login") return <Login />;
  if (path === "/register") return <Register />;
  if (path === "/unauthorized") return <NotAuthorized />;
  if (path === "/dashboard") return <Dashboard />;
  if (path === "/rooms") return <Rooms />;
  if (path === "/reservations") return <Reservations />;
  if (path === "/reservations/new") return <ReservationForm />;
  if (path === "/billing") return <Billing />;
  if (path === "/invoices") return <Invoices />;
  if (path.startsWith("/invoices/")) return <InvoiceDetails invoiceId={path.slice("/invoices/".length)} />;
  if (path === "/my-invoices") return <MyInvoices />;
  if (path === "/payment/success") return <PaymentStatus outcome="success" />;
  if (path === "/payment/cancelled") return <PaymentStatus outcome="cancelled" />;
  if (path === "/my-bookings") return <MyBookings />;
  if (path === "/profile") return <Profile />;
  if (path === "/users") return <Users />;
  return <NotFound />;
}

export default function App() {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [logoutMessage, setLogoutMessage] = useState("");

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    window.addEventListener("luxurystay:navigate", syncPath);
    const showLogoutError = (event) => {
      if (event.detail) setLogoutMessage(event.detail);
    };
    window.addEventListener("luxurystay:logout-error", showLogoutError);
    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("luxurystay:navigate", syncPath);
      window.removeEventListener("luxurystay:logout-error", showLogoutError);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (path === "/") {
      navigate(user ? "/dashboard" : "/login", true);
    } else if (user && ["/login", "/register"].includes(path)) {
      navigate("/dashboard", true);
    } else if (!user && !["/login", "/register", "/unauthorized"].includes(path)) {
      navigate("/login", true);
    }
  }, [path, user, loading]);

  if (loading) return <Loader fullPage label="Restoring your session" />;
  if (!user && !["/login", "/register", "/unauthorized"].includes(path)) return null;
  if (user && ["/login", "/register"].includes(path)) return null;
  if (path === "/users" && user && !["admin", "manager"].includes(user.role)) return <NotAuthorized />;
  if (path === "/rooms" && user && !["admin", "manager", "receptionist", "housekeeping", "guest"].includes(user.role)) return <NotAuthorized />;
  if (path === "/reservations" && user && !["admin", "manager", "receptionist"].includes(user.role)) return <NotAuthorized />;
  if (path === "/reservations/new" && user && !["admin", "manager", "receptionist", "guest"].includes(user.role)) return <NotAuthorized />;
  if (path === "/billing" && user && !["admin", "manager"].includes(user.role)) return <NotAuthorized />;
  if (path === "/invoices" && user && !["admin", "manager", "receptionist"].includes(user.role)) return <NotAuthorized />;
  if (path.startsWith("/invoices/") && user && !["admin", "manager", "receptionist", "guest"].includes(user.role)) return <NotAuthorized />;
  if (path === "/my-invoices" && user && user.role !== "guest") return <NotAuthorized />;
  if (path.startsWith("/payment/") && !["/payment/success", "/payment/cancelled"].includes(path)) return <NotFound />;
  if (path === "/my-bookings" && user && user.role !== "guest") return <NotAuthorized />;
  if (!["/login", "/register", "/unauthorized", "/dashboard", "/rooms", "/reservations", "/reservations/new", "/billing", "/invoices", "/my-invoices", "/payment/success", "/payment/cancelled", "/my-bookings", "/profile", "/users"].includes(path) && !path.startsWith("/invoices/")) return <NotFound />;
  if (path === "/unauthorized") return <NotAuthorized />;
  if (["/login", "/register"].includes(path)) return <CurrentPage path={path} />;

  const protectedPage = <ProtectedRoute user={user}><CurrentPage path={path} /></ProtectedRoute>;
  const rolePage = ["/users", "/billing"].includes(path) ? <RoleRoute user={user} roles={["admin", "manager"]}>{protectedPage}</RoleRoute> : protectedPage;
  return (
    <MainLayout path={path}>
      {logoutMessage && <Alert className="mb-4" onClose={() => setLogoutMessage("")}>{logoutMessage}</Alert>}
      {rolePage}
    </MainLayout>
  );
}
