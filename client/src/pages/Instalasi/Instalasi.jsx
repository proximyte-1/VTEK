import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAlert } from "../../utils/alert";
import { Margin } from "@mui/icons-material";
import dayjs from "dayjs";

const Instalasi = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    { field: "id_kontrak", headerName: "No. Kontrak", flex: 1 },
    {
      field: "tgl_instalasi",
      headerName: "Tanggal Instalasi",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD-MM-YYYY") : "-",
    },
    { field: "lokasi", headerName: "Lokasi", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 1,
      align: "center",
      renderCell: (params) => (
        <>
          <Button
            variant="contained"
            color="warning"
            sx={{ marginRight: 0.5 }}
            onClick={() => navigate(`edit/${params.row.id}`)}
          >
            Edit
          </Button>
        </>
      ),
    },
  ];

  const { alert, showAlert, closeAlert } = useAlert();

  const [datas, setDatas] = useState([]);

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + `api/get-instalasi`
        );

        setDatas(response.data);
      } catch (error) {
        console.error("Error fetching instalasi:", error);
      }
    }

    if (location.state?.message) {
      showAlert(location.state.message, location.state.severity || "info");
    }

    fetchContract();
  }, [location.state]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Master Instalasi
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

export default Instalasi;
