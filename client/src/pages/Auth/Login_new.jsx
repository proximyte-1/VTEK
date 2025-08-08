import React, { useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Avatar,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import logo from "../../assets/logo_login.png";
import GoogleIcon from "@mui/icons-material/Google"; // For the Google icon
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/auth";
import { useAlert } from "../../utils/alert";

// Define a custom theme for Material-UI to ensure consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // A standard blue for primary actions
    },
    secondary: {
      main: "#dc004e", // A contrasting color
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif", // Using Inter font as per instructions
    h4: {
      fontWeight: 600,
      marginBottom: "1rem",
    },
    body1: {
      fontSize: "1rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          // Access theme here
          borderRadius: 8, // Rounded corners for buttons
          textTransform: "none", // Prevent uppercase text
          padding: "10px 20px",
          "&:hover": {
            backgroundColor: theme.palette.primary.dark, // Darken on hover
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)", // More pronounced shadow on hover
          },
        }),
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh", // Full viewport height
          // Updated background to a subtle linear gradient
          background: "linear-gradient(135deg, #f0f2f5 0%, #e0e4e8 100%)",
          padding: "16px", // Padding for small screens
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff", // White background for the card
          padding: "40px",
          borderRadius: 12, // Rounded corners for the box
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", // Soft shadow
          textAlign: "center",
          maxWidth: "400px", // Max width for the login card
          width: "100%", // Full width on small screens
        },
      },
    },
  },
});

// LoginPage component
function LoginPage() {
  // Destructure authentication state and functions from the context
  const { isAuthenticated, isRegisted, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    // If not loading (auth check complete) and user is authenticated, redirect.
    if (!isLoading && isAuthenticated) {
      console.log("Login Page: Already authenticated, redirecting to home.");
      navigate("/"); // Redirect to home page or dashboard
    }

    if (isRegisted === false) {
      console.log("msk isregis");
      showAlert("User Belum Terdaftar, Silahkan Hubungi Admin!!", "error");
    }
  }, [isAuthenticated, isLoading, navigate, isRegisted]); // Dependencies

  // Handler for the Google Login button click.
  const handleGoogleLogin = () => {
    console.log("Login Page: Initiating Google Login...");
    login(); // Call the login function from AuthContext
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xl">
        <Box
          component={Paper}
          padding={5}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* You can replace this with your actual logo image */}
          <img
            src={logo}
            alt="Company Logo"
            style={{
              maxWidth: "90%",
              height: "100%",
              marginBottom: 80,
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = { logo };
            }} // Fallback
          />

          {/* Title */}
          <Typography component="h1" variant="h4" sx={{ my: 3 }}>
            Login VTK
          </Typography>

          {/* Login with Google Button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            fullWidth
            sx={{
              mt: 2,
              py: 1.5, // Increase vertical padding
              fontWeight: 600,
            }}
          >
            Login with Google
          </Button>

          {/* Optional: Add a small message or link */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Don't have an account? Call Admin To Register
          </Typography>
        </Box>
        {/* Alert notifications */}
        <Snackbar
          open={alert.open}
          autoHideDuration={5000}
          onClose={closeAlert}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={closeAlert}
            variant="filled"
            severity={alert.severity}
            fontSize="inherit"
            sx={{ width: "100%" }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default LoginPage; // Export LoginPage instead of App
