import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Master from "./pages/Master";
import Add from "./pages/Add";
import Edit from "./pages/Edit";
import AddNoSeri from "./pages/AddNoSeri";
import EditNoSeri from "./pages/EditNoSeri_new";
import FLKNoSeri from "./pages/FLKNoSeri";
import FLKNoRep from "./pages/FLKNoRep";
import Report from "./pages/Report";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* FLK Group */}
          <Route path="flk">
            <Route index element={<FLKNoRep />} />
            <Route path="add" element={<Add />} />
            <Route path="edit/:id" element={<Edit />} />
          </Route>

          {/* FLK No Barang Group */}
          <Route path="flk-no-barang">
            <Route index element={<FLKNoSeri />} />
            <Route path="add" element={<AddNoSeri />} />
            <Route path="edit/:id" element={<EditNoSeri />} />
          </Route>

          {/* Admin Group */}
          {/* <Route path="admin" element={<Layout />}>
            <Route index element={<Admin />} />
            <Route path="user" element={<AdminUser />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route> */}

          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
