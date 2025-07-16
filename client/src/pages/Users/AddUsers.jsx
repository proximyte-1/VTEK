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
      kode_area: "",
      role: "",
      type: "",
    },
  });

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [dataArea, setDataArea] = useState("");

  // const handleFileSelect = (file) => {
  //   setValue("pic", file, { shouldValidate: true });
  // };

  useEffect(() => {
    try {
      axios.get(`${import.meta.env.VITE_API_URL}api/get-area`).then((res) => {
        if (res.data.length > 0) {
          const data = res.data;
          setDataArea(data);
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
        data.append(key, value);
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
          {dataArea && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="kode_area"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.kode_area}>
                    <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                      Pilih Kode Area
                    </Typography>
                    <Select
                      id="supervisor-select"
                      variant="outlined"
                      {...field}
                      displayEmpty
                    >
                      {dataArea.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.kode_area && (
                      <FormHelperText>
                        {errors.kode_area?.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="role">
              Role
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} variant="outlined" fullWidth>
                  <MenuItem disabled value="">
                    <em>Pilih Role</em>
                  </MenuItem>
                  {Object.entries(selectRole).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="type">
              Type
            </Typography>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select {...field} variant="outlined" fullWidth>
                  <MenuItem disabled value="">
                    <em>Pilih Type</em>
                  </MenuItem>
                  {Object.entries(selectType).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </Grid>

          {/* <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="pass">
              Password
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              {...register("pass")}
              error={!!errors.pass}
              helperText={errors.pass?.message}
            />
          </Grid> */}

          {/* <Grid size={{ xs: 12, md: 12 }}>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Box>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onError={(msg) => (msg ? showAlert(msg, "error") : null)}
                />
              </Box>
            </Box>
          </Grid> */}
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
