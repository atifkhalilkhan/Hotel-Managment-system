import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout";
import ScrollToTop from "./components/layout/ScrollToTop";
import Placeholder from "./pages/Placeholder";
import Contact from "./pages/Contact";
import Reviews from "./pages/Reviews";
import About from "./pages/About";
import Services from "./pages/Services";
import Rooms from "./pages/Rooms";
import Gallery from "./pages/Gallery";
import Home from "./pages/Home";
import Policies from "./pages/Policies";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="rooms/:type" element={<Rooms />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="contact" element={<Contact />} />
          <Route path="policies" element={<Policies />} />
          <Route path="*" element={<Placeholder eyebrow="404" title="This page does not exist." text="The link may be broken or the page may have moved." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
