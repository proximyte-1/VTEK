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
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import { schemaUsers } from "../../utils/helpers";
import { useAlert } from "../../utils/alert";
import { useNavigate } from "react-router-dom";
import FileUpload from "../../components/FileUpload/FileUpload";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import { selectRole, selectType } from "../../utils/constants";

const AddUsers = () => {
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
    context: { isEdit: false },
    defaultValues: {
      name: "",
      email: "",
      role: "",
    },
  });

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      axios.get(`${import.meta.env.VITE_API_URL}api/get-area`).then((res) => {
        if (res.data.length > 0) {
          const data = res.data;
        }
      });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  }, []);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        if (key === "role") {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-users`,
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
    showAlert(
      "Terjadi kesalahan pada input data mohon check kembali.",
      "error"
    );
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        New User
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
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="email">
              Email
            </Typography>
            <TextField
              variant="outlined"
              type="email"
              fullWidth
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field, fieldState: { error } }) => (
                <>
                  <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                    Role
                  </Typography>
                  <Autocomplete
                    {...field}
                    multiple
                    id="role-autocomplete"
                    options={Object.entries(selectType).map(([id, name]) => ({
                      id: Number(id),
                      name: name,
                    }))}
                    getOptionLabel={(option) => option.name || ""}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    onChange={(event, newValue) => {
                      // Pass an array of IDs to the form state
                      field.onChange(newValue.map((option) => option.id));
                    }}
                    // The value prop must be an array of objects
                    value={
                      Object.entries(selectType)
                        .map(([id, name]) => ({ id: Number(id), name: name }))
                        .filter((option) => field.value?.includes(option.id)) ||
                      []
                    }
                    filterSelectedOptions
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        fullWidth
                        error={!!error}
                        helperText={error ? error.message : null}
                      />
                    )}
                  />
                </>
              )}
            />
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

export default AddUsers;
