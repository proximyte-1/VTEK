import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";

const User = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    {
      field: "no_rep",
      headerName: "No Report",
      flex: 1,
      width: 100,
      renderCell: (params) =>
        params.row.type === 1 ? `SPGFGI${params.value}` : `- No.Seri -`,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 1,
      align: "center",
      renderCell: (params) =>
        params.row.type === 1 ? (
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate(`/edit/id=${params.row.id}`)}
            >
              Edit
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="warning"
              onClick={() => navigate(`/edit-no-barang/id=${params.row.id}`)}
            >
              Edit
            </Button>
          </>
        ),
    },
  ];

  const [open, setOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", severity: "info" });
  const [datas, setDatas] = useState([]);

  useEffect(() => {
    async function fetchDataFLK() {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + `api/get-flk`
        );

        const data = await response.json();
        setDatas(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    }

    if (location.state?.message) {
      setAlertData({
        message: location.state.message,
        severity: location.state.severity || "info",
      });
      setOpen(true);
    }

    fetchDataFLK();
  }, [location.state]);

  function displayValue(value) {
    return value === null || value === undefined || value == "" ? "-" : value;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Home
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
      <Link to="/add">
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "20px" }}
        >
          New Data
        </Button>
      </Link>

      <Snackbar
        open={open}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        onClose={() => setOpen(false)}
      >
        <Alert
          severity={alertData.severity}
          onClose={() => setOpen(false)}
          variant="filled"
        >
          {alertData.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default User;
