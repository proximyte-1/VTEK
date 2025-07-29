import axios from "axios";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Create a context for authentication
const AuthContext = createContext([]);

// Auth component to wrap your application and provide auth state
export const Auth = ({ children }) => {
  // Export Auth
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true); // Start loading state

        // --- ACTUAL BACKEND API CALL USING AXIOS ---
        // Your backend's endpoint for checking user session status is /api/user.
        // `withCredentials: true` is crucial for sending and receiving session cookies.
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/user`,
          {
            withCredentials: true,
          }
        );

        // Axios automatically parses JSON, so response.data contains the user data.
        const userData = response.data;
        const email = userData?._json?.email;

        const db_response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }api/get-users-by-email?email=${email}`,
          {
            withCredentials: true,
          }
        );

        const dbData = db_response.data[0];

        const updatedUser = {
          ...userData, // Start with all properties from userData
          role: dbData?.role, // Add/overwrite role
          type: dbData?.type, // Add/overwrite type
          id_user: dbData?.id, // Add/overwrite id_user (renamed from dbData?.id)
        };

        setUser(updatedUser);
        setIsAuthenticated(true);
        // Your server's deserializeUser returns the full profile, which has a 'displayName' property.
        console.log(
          "AuthContext: Session validated successfully. User:",
          userData.displayName || userData.name
        );
      } catch (error) {
        // Axios errors have a `response` property for HTTP errors (e.g., 401, 403)
        // and a `message` for network errors.
        if (
          axios.isAxiosError(error) &&
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          console.log(
            "AuthContext: No valid session found or session expired. Status:",
            error.response.status
          );
        } else {
          console.error(
            "AuthContext: Network or unexpected error checking authentication status:",
            error.message
          );
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // End loading state
      }
    };

    checkAuthStatus();
  }, []);

  const login = async () => {
    setIsLoading(true); // Set loading state during login process
    // --- PRODUCTION CONCEPT: Redirect to your Express backend's Google OAuth initiation endpoint ---
    // This URL should match the route on your Express server that starts the Google OAuth flow.
    // Assuming your Express backend is running on http://localhost:5000
    window.location.href = "http://localhost:3001/auth/google";

    // IMPORTANT: The frontend does NOT handle the login success here.
    // Your Express backend's /auth/google/callback will handle the Google authentication
    // and then redirect the browser back to your frontend (e.g., to /dashboard).
    // When the frontend loads on /dashboard, the useEffect (checkAuthStatus) will run again
    // and detect the newly authenticated session.
  };

  const logout = async () => {
    setIsLoading(true); // Set loading state during logout process
    try {
      // --- PRODUCTION CONCEPT: Call your Express backend's logout endpoint using Axios ---
      // Your backend's logout route is a GET request to /auth/logout.
      // `withCredentials: true` is crucial for sending the session cookie.
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}auth/logout`,
        {
          withCredentials: true,
        }
      );
      // IMPORTANT: The frontend does NOT manually clear user/auth state here immediately.
      // Your Express backend's /auth/logout route performs a redirect to http://localhost:5173/login.
      // When the frontend loads on /login (or wherever it redirects), the `checkAuthStatus` useEffect
      // will run again, detect the now-unauthenticated state, and update the UI accordingly.
      // We set the state here optimistically, but the redirect will cause a full page reload anyway.
      setUser(null);
      setIsAuthenticated(false);
      console.log("AuthContext: Logout request sent. Backend will redirect.");
      if (response.data.ok) {
        navigate("/login");
      }
    } catch (error) {
      console.error("AuthContext: Error during logout:", error.message);
      // You might want to check error.response.status here for specific backend error messages
      // e.g., if (axios.isAxiosError(error) && error.response && error.response.data) console.error(error.response.data);
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  // If context is null, it means useAuth was called outside of an AuthProvider.
  // Throwing an error here provides a clear message to the developer.
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
