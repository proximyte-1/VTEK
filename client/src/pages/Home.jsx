import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  const [rows, _] = useState([
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
  ]);

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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
              </TableRow>
            ))}
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
