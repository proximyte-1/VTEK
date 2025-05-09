import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Master from "./pages/Master";
import Add from "./pages/Add";
import Edit from "./pages/Edit";
import NoSeri from "./pages/NoSeri";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<Add />} />
          <Route path="add-no-barang" element={<NoSeri />} />
          <Route path="edit/:id" element={<Edit />} />
          <Route path="master" element={<Master />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
