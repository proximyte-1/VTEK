import React, { useEffect, useState } from "react";
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
} from "@mui/material";

const Home = () => {
  const [datas, setDatas] = useState([]);

  useEffect(() => {
    async function fetchDataFLK() {
      try {
        const response = await fetch("http://localhost:3001/api/get-flk");
        const data = await response.json();
        setDatas(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    }

    fetchDataFLK();
  }, []);

  function displayValue(value) {
    return value === null || value === undefined || value == "" ? "-" : value;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>

      {/* Table */}
      <TableContainer sx={{ padding: 3 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No.</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>No. Report</TableCell>
              <TableCell>Jam Datang</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datas.length > 0 ? (
              datas.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{displayValue(item.id)}</TableCell>
                  <TableCell>{displayValue(item.nama)}</TableCell>
                  <TableCell>{displayValue(item.no_report)}</TableCell>
                  <TableCell>
                    {displayValue(
                      item.jam_dtg
                        ? format(new Date(item.jam_dtg), "yyyy-MM-dd HH:mm")
                        : "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Link to="/add">
                      <Button
                        variant="contained"
                        color="error"
                        style={{ marginTop: "20px" }}
                      >
                        Delete
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
          Add New Entry
        </Button>
      </Link>
    </Container>
  );
};

export default Home;
