// src/pages/Login.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/auth";

const Login = () => {
  const authContextValue = useAuth();
  console.log("Login Page: Value from useAuth():", authContextValue);

  // Destructure authentication state and functions from the context
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect to redirect if the user is already authenticated.
  // This prevents authenticated users from seeing the login page.
  useEffect(() => {
    // If not loading (auth check complete) and user is authenticated, redirect.
    if (!isLoading && isAuthenticated) {
      console.log("Login Page: Already authenticated, redirecting to home.");
      navigate("/"); // Redirect to home page or dashboard
    }
  }, [isAuthenticated, isLoading, navigate]); // Dependencies

  // Handler for the Google Login button click.
  const handleGoogleLogin = () => {
    console.log("Login Page: Initiating Google Login...");
    login(); // Call the login function from AuthContext
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login</h2>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
    </div>
  );
};

export default Login;
