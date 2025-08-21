import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import { Container } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./utils/auth";
import { useEffect } from "react";

export default function Layout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]); // Dependencies for useEffect

  return (
    <div>
      <Navbar />
      <Container sx={{ paddingTop: 3 }}>
        <Outlet />
      </Container>
    </div>
  );
}
