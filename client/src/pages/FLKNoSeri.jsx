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
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { useAlert } from "../utils/alert";
import axios from "axios";

const FLKNoSeri = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      flex: 1,
      minWidth: 150,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD-MM-YYYY HH:mm") : "-",
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 1,
      minWidth: 150,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD-MM-YYYY HH:mm") : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 0, // Disables flex shrinking
      minWidth: 200, // Fallback width
      align: "center",
      renderCell: (params) => (
        <>
          <Button
            variant="contained"
            color="warning"
            sx={{ marginX: 1 }}
            onClick={() => navigate(`edit/id=${params.row.id}`)}
          >
            Edit
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleExport(params.row.id)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Export"}
          </Button>
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
        <Box sx={{ minWidth: 700 }}>
          <DataGrid
            rows={datas}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px" }}
        onClick={() => navigate(`add`)}
      >
        New Data
      </Button>

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

export default FLKNoSeri;
