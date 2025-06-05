import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress,
  Box,
} from "@mui/material";
import { schemaUsers, handleFileSelect } from "../../utils/helpers";
import { useAlert } from "../../utils/alert";
import { useNavigate, useParams } from "react-router-dom";
import FileUpload from "../../components/FileUpload/FileUpload";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";

const EditUsers = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schemaUsers),
    context: { isEdit: true },
    defaultValues: {
      name: "",
      username: "",
    },
  });

  const handleFileSelect = (file) => {
    setValue("pic", file, { shouldValidate: true });
  };

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDataUser() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-users-by-id?${id}`
        );

        const data = response.data[0];
        Object.entries(data).forEach(([key, value]) => {
          setValue(key, value, { shouldDirty: true });
        });
      } catch (error) {
        console.error("Error fetching Data User:", error);
      }
    }

    fetchDataUser();
  }, []);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/edit-users?${id}`,
        data
      );

      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data user.");
      } else {
        setLoading(false);
        navigate("/users", {
          state: {
            message: "Data User Berhasil Ditambahkan!",
            severity: "success",
          },
        });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showAlert("Terjadi kesalahan saat mengirim data.", "error");
    }
  };

  const onInvalid = (errors) => {
    console.log("Form has errors:", errors);
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Edit User
      </Typography>
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        encType="multipart/form-data"
      >
        <Grid container spacing={5} marginY={"2em"} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="name">
              Nama
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="username">
              Username
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              {...register("username")}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 12 }}>
            {/* Upload */}
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onError={(msg) => (msg ? showAlert(msg, "error") : null)}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

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

        <Grid container spacing={5}>
          {/* Submit Button */}
          <Grid size={{ xs: 12, md: 12 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Submit"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default EditUsers;
