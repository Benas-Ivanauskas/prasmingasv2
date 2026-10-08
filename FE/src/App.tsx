import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import TripPage from "./pages/TripPage/TripPage";
import Contacts from "./pages/Contacts/Contacts";
import About from "./pages/About/About";
import Login from "./pages/Login/Login";
import BuyOneSession from "./pages/BuySession/BuyOneSession";
import BuyTravellerInfo from "./pages/BuySession/BuyTravellerInfo";
import BuyPayment from "./pages/BuySession/BuyPayment";
import BuySuccess from "./pages/BuySession/BuySuccess";

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
          <Route path="/buy/:slug/:departureId" element={<BuyOneSession />}></Route>
          <Route path="/buy/:slug/:departureId/travellers" element={<BuyTravellerInfo />}></Route>
          <Route path="/buy/:slug/:departureId/payment" element={<BuyPayment />}></Route>
          <Route path="/buy/:slug/:departureId/success" element={<BuySuccess />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
