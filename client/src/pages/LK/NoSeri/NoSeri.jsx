import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAlert } from "../../../utils/alert";
import { useAuth } from "../../../utils/auth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import DangerousIcon from "@mui/icons-material/Dangerous";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import { displayFormatDateTime } from "../../../utils/helpers";

const NoSeri = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    // use for role checking
    if (user?.role?.includes(3) || user?.role?.includes(4)) {
    }
  }, [user]);

  const columns = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      flex: 0,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    {
      field: "no_seri",
      headerName: "No Seri",
      flex: 0,
      minWidth: 150,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "Status",
      headerName: "Status",
      flex: 0,
      minWidth: 120,
      renderCell: (params) => {
        if (params.row.status_appr === 2) {
          return (
            <Chip
              color="warning"
              icon={<PauseCircleFilledIcon />}
              label="Pending"
              sx={{ width: "100%" }}
            />
          );
        } else if (params.row.status_appr === 3) {
          return (
            <Chip
              color="error"
              icon={<DangerousIcon />}
              label="Rejected"
              sx={{ width: "100%" }}
            />
          );
        } else {
          return (
            <Chip
              color="success"
              icon={<CheckCircleIcon />}
              label="Approve"
              sx={{ width: "100%" }}
            />
          );
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      type: "actions",
      flex: 1, // Disables flex shrinking
      width: 100,
      minWidth: 100, // Fallback width
      align: "center",
      renderCell: (params) => (
        <>
          {!user?.role?.includes(5) && !user?.role?.includes(6) && (
            <IconButton
              variant="contained"
              onClick={() => navigate(`view/id=${params.row.id}`)}
            >
              <VisibilityIcon />
            </IconButton>
          )}

          {!user?.role?.includes(5) && !user?.role?.includes(6) && (
            <IconButton
              variant="contained"
              onClick={() => navigate(`edit/id=${params.row.id}`)}
            >
              <EditIcon />
            </IconButton>
          )}

          <IconButton
            variant="contained"
            onClick={() => handleExport(params.row.id)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : <GetAppIcon />}
          </IconButton>
        </>
      ),
    },
  ];

  const { alert, showAlert, closeAlert } = useAlert();
  const [datas, setDatas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDataFLK = async () => {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + `api/get-flk-noseri`
        );

        const data = response.data;
        setDatas(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching items:", error);
        showAlert("Terjadi kesalahan saat mengambil data!", "error");
      }
    };

    if (location.state?.message) {
      showAlert(location.state.message, location.state.severity || "info");
    }

    fetchDataFLK();
  }, [location.state]);

  const handleExport = async (lk_id) => {
    setLoading(true);
    try {
      const data = datas.find(({ id }) => id == lk_id);

      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/export-lk-noseri`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: data,
            reportTitle: `Report Laporan Kerja - Tanpa Barang`,
          }),
        }
      );
      if (!response.ok) throw new Error("Export failed");

      // Convert response to Blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report Satuan - Tanpa Barang ${dayjs().format(
        "DD-MM-YYYY"
      )}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (err) {
      console.error("Export error:", err);
      showAlert("Failed to export Excel", "error");
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Laporan Kerja - Tanpa Barang
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box>
          <DataGrid
            rows={datas}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 15,
                },
              },
            }}
            pageSizeOptions={[15]}
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      {!user?.role?.includes(5) && !user?.role?.includes(6) && (
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "20px", marginBottom: "20px" }}
          onClick={() => navigate(`add`)}
        >
          New Data
        </Button>
      )}

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
  );
};

export default NoSeri;
