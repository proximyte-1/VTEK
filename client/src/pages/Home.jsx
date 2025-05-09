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
import { DataGrid } from "@mui/x-data-grid";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    { field: "no_rep", headerName: "No Report", flex: 1 },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    { field: "waktu_mulai", headerName: "Waktu Mulai", flex: 1 },
    { field: "waktu_selesai", headerName: "Waktu Selesai", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 1,
      renderCell: (params) => (
        <>
          <Button
            variant="contained"
            color="warning"
            onClick={() => navigate(`/edit/id=${params.row.id}`)}
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

      <DataGrid
        rows={datas}
        columns={columns}
        getRowId={(row) => row.id} // <- replace with your actual unique field
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

      {/* Table */}
      <TableContainer sx={{ padding: 3 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>No. Report</TableCell>
              {/* <TableCell>Nama Customer</TableCell> */}
              <TableCell>Nama Pelapor</TableCell>
              <TableCell>Waktu Datang</TableCell>
              <TableCell>Waktu Selesai</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datas.length > 0 ? (
              datas.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{displayValue(index + 1)}</TableCell>
                  <TableCell>{displayValue(item.no_rep)}</TableCell>
                  {/* <TableCell>{displayValue()}</TableCell> */}
                  <TableCell>{displayValue(item.pelapor)}</TableCell>
                  <TableCell>
                    {displayValue(
                      item.waktu_mulai
                        ? format(new Date(item.waktu_mulai), "yyyy-MM-dd HH:mm")
                        : "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {displayValue(
                      item.waktu_selesai
                        ? format(
                            new Date(item.waktu_selesai),
                            "yyyy-MM-dd HH:mm"
                          )
                        : "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to={`/edit/id=${item.id}`}>
                      <Button variant="contained" color="warning">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

export default Home;
