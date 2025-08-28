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
  Chip,
  IconButton,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { useAlert } from "../../../utils/alert";
import axios from "axios";
import { useAuth } from "../../../utils/auth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import DangerousIcon from "@mui/icons-material/Dangerous";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import GetAppIcon from "@mui/icons-material/GetApp";
import { displayFormatDateTime } from "../../../utils/helpers";

const NoNav = () => {
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
      field: "no_rep",
      headerName: "No Report",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => `SPGFI${params.value}`,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1, minWidth: 150 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "status_appr",
      headerName: "Status",
      flex: 0,
      minWidth: 120,
      // valueFormatter: (params) => {
      //   switch (params.value) {
      //     case 1:
      //       return "Approve";
      //     case 2:
      //       return "Pending";
      //     case 3:
      //       return "Rejected";
      //     default:
      //       return "Unknown";
      //   }
      // },

      renderCell: (params) => {
        if (params.value === 2) {
          return (
            <Chip
              color="warning"
              icon={<PauseCircleFilledIcon />}
              label="Pending"
              sx={{ width: "100%" }}
            />
          );
        } else if (params.value === 3) {
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
  const [user_appr, setUserApproval] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDataFLK = async () => {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + `api/get-flk-norep`
        );

        const data = response.data;

        const lk_arr = [];
        Object.entries(data).map(([key, value]) => {
          lk_arr.push(value.id);
        });

        await fetchUserApproval(JSON.stringify(lk_arr));
        setDatas(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching items:", error);
        showAlert("Terjadi kesalahan saat mengambil data!", "error");
      }
    };

    const fetchUserApproval = async (data_arr) => {
      // let cleanData = data_arr.replace("[", "(").replace("]", ")");
      try {
        const response = await axios.post(
          import.meta.env.VITE_API_URL + `api/get-user-approval`,
          {
            data_lk: data_arr,
          }
        );

        const data = response.data;

        setUserApproval(data); // <-- set the array into state
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
        import.meta.env.VITE_API_URL + `api/export-lk-norep`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: data,
            reportTitle: `Report Laporan Kerja - Dengan Barang`,
          }),
        }
      );
      if (!response.ok) throw new Error("Export failed");

      // Convert response to Blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report Satuan - Dengan Barang ${dayjs().format(
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
        Laporan Kerja - Dengan Barang
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <DataGrid
          rows={datas}
          columns={columns}
          columnBufferPx={columns.length} // Render all columns off-screen
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

      {/* Link to Form Page */}
      {!user?.role?.includes(5) && !user?.role?.includes(6) && (
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "20px", marginBottom: "20px" }}
          onClick={() => navigate(`add`)}
        >
          New
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

export default NoNav;
