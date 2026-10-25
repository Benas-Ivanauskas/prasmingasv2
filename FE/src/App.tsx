import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import TripPage from "./pages/TripPage/TripPage";
import Contacts from "./pages/Contacts/Contacts";
import About from "./pages/About/About";
import Login from "./pages/Login/Login";
import RequireAuth from "./components/Admin/RequireAuth";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminHome from "./pages/Admin/AdminHome";
import AdminTrips from "./pages/Admin/AdminTrips";
import AdminTripForm from "./pages/Admin/AdminTripForm";
import AdminDiscounts from "./pages/Admin/AdminDiscounts";
import AdminNewsletter from "./pages/Admin/AdminNewsletter";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminOrderNew from "./pages/Admin/AdminOrderNew";
import AdminAuditLog from "./pages/Admin/AdminAuditLog";
import AdminExport from "./pages/Admin/AdminExport";
import BuyTripDetails from "./pages/BuySession/BuyTripDetails";
import BuyOneSession from "./pages/BuySession/BuyOneSession";
import BuyTravellerInfo from "./pages/BuySession/BuyTravellerInfo";
import BuyPayment from "./pages/BuySession/BuyPayment";
import BuySuccess from "./pages/BuySession/BuySuccess";
import BuyCancelled from "./pages/BuySession/BuyCancelled";
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/trips/:slug" element={<TripPage />}></Route>
          <Route path="/contacts" element={<Contacts />}></Route>
          <Route path="/about" element={<About />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="trips" element={<AdminTrips />} />
              <Route path="trips/new" element={<AdminTripForm />} />
              <Route path="trips/:id" element={<AdminTripForm />} />
              <Route path="discounts" element={<AdminDiscounts />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/new" element={<AdminOrderNew />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="export" element={<AdminExport />} />
            </Route>
          </Route>
          <Route path="/buy/:slug/:departureId" element={<BuyTripDetails />}></Route>
          <Route path="/buy/:slug/:departureId/seats" element={<BuyOneSession />}></Route>
          <Route path="/buy/:slug/:departureId/travellers" element={<BuyTravellerInfo />}></Route>
          <Route path="/buy/:slug/:departureId/payment" element={<BuyPayment />}></Route>
          <Route path="/buy/:slug/:departureId/success" element={<BuySuccess />}></Route>
          <Route path="/buy/:slug/:departureId/cancelled" element={<BuyCancelled />}></Route>
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
