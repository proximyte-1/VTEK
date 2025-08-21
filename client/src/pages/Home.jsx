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
import { displayFormatDate, displayFormatDateTime } from "../utils/helpers";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    {
      field: "no_rep",
      headerName: "No Report",
      flex: 1,
      width: 100,
      renderCell: (params) =>
        params.row.type === 1 ? `SPGFGI${params.value}` : `-`,
    },
    {
      field: "no_seri",
      headerName: "No Seri",
      flex: 1,
      width: 100,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 1,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 1,
      renderCell: (params) => displayFormatDateTime(params.value),
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
                  pageSize: 15,
                },
              },
            }}
            pageSizeOptions={[15]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Box>

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

export default Home;
