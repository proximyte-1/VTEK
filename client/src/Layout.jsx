import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import { Container } from "@mui/material";
import { Outlet } from "react-router-dom";

export default function Layout() {
  // const [_, setTableData] = useState([]);

  // const handleFormSubmit = (formData) => {
  //   setTableData((prevData) => [...prevData, formData]);
  // };

  return (
    <div>
      <Navbar />
      <Container sx={{ paddingTop: 3 }}>
        <Outlet />
      </Container>
    </div>
  );
}
