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
import Users from "./pages/Users/Users";
import AddUsers from "./pages/Users/AddUsers";
import EditUsers from "./pages/Users/EditUsers";
import Contract from "./pages/Contract/Contract";
import AddContract from "./pages/Contract/AddContract";
import EditContract from "./pages/Contract/EditContract";
import Instalasi from "./pages/Instalasi/Instalasi";
import AddInstalasi from "./pages/Instalasi/AddInstalasi";
import EditInstalasi from "./pages/Instalasi/EditInstalasi";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Auth/Dashboard";

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

          {/* Users Group */}
          <Route path="users">
            <Route index element={<Users />} />
            <Route path="add" element={<AddUsers />} />
            <Route path="edit/:id" element={<EditUsers />} />
          </Route>

          {/* Contract Group */}
          <Route path="contract">
            <Route index element={<Contract />} />
            <Route path="add" element={<AddContract />} />
            <Route path="edit/:id" element={<EditContract />} />
          </Route>

          {/* Instalasi Group */}
          <Route path="instalasi">
            <Route index element={<Instalasi />} />
            <Route path="add" element={<AddInstalasi />} />
            <Route path="edit/:id" element={<EditInstalasi />} />
          </Route>

          {/* Login / Auth Group */}
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Dashboard />} />

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
