// Updated version with full form fields, Selects, DateTimePickers, and conditional rep_ke
import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  InputAdornment,
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload/FileUpload";

const selectStatusCall = {
  GR: "Garansi",
  KS: "Kontrak Servis",
  TST: "Tunjangan Servis Total",
  RT: "Rental",
  Chg: "Charge",
};

const selectKeluhan = {
  P_JAM: "Paper Jam",
  COPY_Q: "Copy Quality",
  M_ADJUST: "Machine Adjustment",
  ELECT: "Electrical",
  MACH: "Machine",
};

const selectProblem = {
  REPLACE: "Replace",
  CLEAN: "Clean",
  LUB: "Lubric",
  ADJUST: "Adjustment",
  REPAIR: "Repair",
};

const selectStatusResult = {
  OK: "OK",
  CONT: "Continue",
  TS: "Technical Support",
  SS: "Software Support",
};

const schema = yup.object().shape({
  no_rep: yup.string().required(),
  no_call: yup.string().required(),
  pelapor: yup.string().required(),
  waktu_call: yup.date().required(),
  waktu_dtg: yup.date().required(),
  status_call: yup.string().required(),
  keluhan: yup.string().required(),
  kat_keluhan: yup.string().required(),
  problem: yup.string().required(),
  kat_problem: yup.string().required(),
  solusi: yup.string().required(),
  waktu_mulai: yup.date().required(),
  waktu_selesai: yup
    .date()
    .min(
      yup.ref("waktu_mulai"),
      "Waktu selesai tidak boleh sebelum waktu mulai"
    ),
  count_bw: yup.string().required(),
  count_cl: yup.string().required(),
  saran: yup.string().required(),
  status_res: yup.string().required(),
});

const Add = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      no_rep: "",
      no_call: "",
      pelapor: "",
      waktu_call: null,
      waktu_dtg: null,
      status_call: "",
      keluhan: "",
      kat_keluhan: "",
      problem: "",
      kat_problem: "",
      solusi: "",
      waktu_mulai: null,
      waktu_selesai: null,
      count_bw: "",
      count_cl: "",
      saran: "",
      status_res: "",
      rep_ke: 1,
    },
  });

  const statusRes = watch("status_res");

  const onSubmit = async (data) => {
    if (!selectedFile) {
      setAlert({
        open: true,
        message: "File bukti harus diunggah.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, value);
      }
    });
    formData.append("pic", selectedFile);
    formData.append("created_by", 1);
    formData.append("type", 1);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-flk`,
        formData
      );
      if (response.status === 200) {
        navigate("/flk", {
          state: {
            message: "Data Laporan Kerja Berhasil Ditambahkan!",
            severity: "success",
          },
        });
      } else {
        throw new Error("Gagal menyimpan data.");
      }
    } catch (error) {
      setAlert({
        open: true,
        message: "Terjadi kesalahan saat mengirim data.",
        severity: "error",
      });
    }
  };

  const handleFileSelect = (file) => setSelectedFile(file);
  const handleCloseAlert = () => setAlert((prev) => ({ ...prev, open: false }));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Form Laporan Kerja
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="No. Report"
                fullWidth
                {...register("no_rep")}
                error={!!errors.no_rep}
                helperText={errors.no_rep?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="No. Call"
                fullWidth
                {...register("no_call")}
                error={!!errors.no_call}
                helperText={errors.no_call?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">+62</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nama Pelapor"
                fullWidth
                {...register("pelapor")}
                error={!!errors.pelapor}
                helperText={errors.pelapor?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="waktu_call"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Waktu Call"
                    {...field}
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={!!errors.waktu_call}
                        helperText={errors.waktu_call?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="waktu_dtg"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Waktu Penjadwalan"
                    {...field}
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={!!errors.waktu_dtg}
                        helperText={errors.waktu_dtg?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.status_call}>
                <InputLabel>Status Call</InputLabel>
                <Controller
                  name="status_call"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Status Call">
                      {Object.entries(selectStatusCall).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Keluhan"
                fullWidth
                multiline
                rows={3}
                {...register("keluhan")}
                error={!!errors.keluhan}
                helperText={errors.keluhan?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.kat_keluhan}>
                <InputLabel>Kategori Keluhan</InputLabel>
                <Controller
                  name="kat_keluhan"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Kategori Keluhan">
                      {Object.entries(selectKeluhan).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Problem"
                fullWidth
                multiline
                rows={3}
                {...register("problem")}
                error={!!errors.problem}
                helperText={errors.problem?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.kat_problem}>
                <InputLabel>Kategori Problem</InputLabel>
                <Controller
                  name="kat_problem"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Kategori Problem">
                      {Object.entries(selectProblem).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Solusi"
                fullWidth
                multiline
                rows={3}
                {...register("solusi")}
                error={!!errors.solusi}
                helperText={errors.solusi?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="waktu_mulai"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Waktu Mulai"
                    {...field}
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={!!errors.waktu_mulai}
                        helperText={errors.waktu_mulai?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="waktu_selesai"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Waktu Selesai"
                    {...field}
                    renderInput={(params) => (
                      <TextField
                        fullWidth
                        {...params}
                        error={!!errors.waktu_selesai}
                        helperText={errors.waktu_selesai?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Counter B/W"
                fullWidth
                {...register("count_bw")}
                error={!!errors.count_bw}
                helperText={errors.count_bw?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Counter CL"
                fullWidth
                {...register("count_cl")}
                error={!!errors.count_cl}
                helperText={errors.count_cl?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Saran"
                fullWidth
                multiline
                rows={3}
                {...register("saran")}
                error={!!errors.saran}
                helperText={errors.saran?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.status_res}>
                <InputLabel>Status Result</InputLabel>
                <Controller
                  name="status_res"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Status Result">
                      {Object.entries(selectStatusResult).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            {statusRes === "CONT" && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Report Ke-"
                  fullWidth
                  {...register("rep_ke")}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FileUpload
                onFileSelect={handleFileSelect}
                onError={(msg) =>
                  setAlert({ open: true, message: msg, severity: "error" })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </LocalizationProvider>
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Add;
