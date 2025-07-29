import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import AddNoSeri from "./pages/LK/NoSeri/AddNoSeri";
import EditNoSeri from "./pages/LK/NoSeri/EditNoSeri";
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
import ViewContract from "./pages/Contract/ViewContract";
import AddInstalasi_Contract from "./pages/Instalasi/PindahInstalasi";
import LoginPage from "./pages/Auth/Login_new";
import { Auth } from "./utils/auth";
import Search from "./pages/LK/Search";
import ViewOriginContract from "./pages/Contract/ViewOriginContract";
import Area from "./pages/Area/Area";
import AddArea from "./pages/Area/AddArea";
import EditArea from "./pages/Area/EditArea";
import HistoryContract from "./pages/Contract/HistoryContract";
import NoNav from "./pages/LK/NoNav/NoNav";
import AddNoNav from "./pages/LK/NoNav/AddNoNav";
import EditNoNav from "./pages/LK/NoNav/EditNoNav";
import NoSeri from "./pages/LK/NoSeri/NoSeri";
import Customer from "./pages/Customer/Customer";
import AddCustomer from "./pages/Customer/AddCustomer";
import EditCustomer from "./pages/Customer/EditCustomer";
import PeriodeReport from "./pages/Report/PeriodeReport";
import AreaReport from "./pages/Report/AreaReport";
import CustomerReport from "./pages/Report/CustomerReport";
import TeknisiReport from "./pages/Report/TeknisiReport";

function App() {
  return (
    <Router>
      <Auth>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* FLK Group */}
            <Route path="flk">
              <Route index element={<NoNav />} />
              <Route path="add" element={<AddNoNav />} />
              <Route path="search" element={<Search />} />
              <Route path="edit/:id" element={<EditNoNav />} />
            </Route>

            {/* FLK No Barang Group */}
            <Route path="flk-no-barang">
              <Route index element={<NoSeri />} />
              <Route path="add" element={<AddNoSeri />} />
              <Route path="search" element={<Search />} />
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
              <Route path="view/:id" element={<ViewContract />} />
              <Route path="view-origin/:id" element={<ViewOriginContract />} />
              <Route path="instalasi/:id" element={<AddInstalasi_Contract />} />
              <Route path="history/:id" element={<HistoryContract />} />
            </Route>

            {/* Instalasi Group */}
            <Route path="instalasi">
              <Route index element={<Instalasi />} />
              <Route path="add" element={<AddInstalasi />} />
              <Route path="edit/:id" element={<EditInstalasi />} />
            </Route>

            {/* Area Group */}
            <Route path="area">
              <Route index element={<Area />} />
              <Route path="add" element={<AddArea />} />
              <Route path="edit/:id" element={<EditArea />} />
            </Route>

            {/* Customer Group */}
            <Route path="customer">
              <Route index element={<Customer />} />
              <Route path="add" element={<AddCustomer />} />
              <Route path="edit/:id" element={<EditCustomer />} />
            </Route>

            {/* Login / Auth Group */}
            <Route path="loginss" element={<LoginPage />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Admin Group */}
            {/* <Route path="admin" element={<Layout />}>
            <Route index element={<Admin />} />
            <Route path="user" element={<AdminUser />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route> */}

            <Route path="report-periode" element={<PeriodeReport />} />
            <Route path="report-area" element={<AreaReport />} />
            <Route path="report-customer" element={<CustomerReport />} />
            <Route path="report-teknisi" element={<TeknisiReport />} />
          </Route>
          <Route path="/login" element={<LoginPage />}></Route>
        </Routes>
      </Auth>
    </Router>
  );
}

export default App;
