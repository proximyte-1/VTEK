// CustomerInfoAccordion.jsx
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Typography,
} from "@mui/material";
import { displayValue } from "../../utils/helpers";
import { ExpandMoreRounded } from "@mui/icons-material";

const CustomerInfoAccor = ({ watch, expand, searched }) => {
  const customer = watch("customer") || {};

  return (
    <Accordion disabled={!searched} expanded={!expand}>
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Typography component="span" variant="h5">
          Detail Pelanggan
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={5}>
          {/* Row 1 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography>
              No. Pelanggan :{" "}
              {displayValue(customer?.["d:Sell_to_Customer_No"])}
            </Typography>
            <Typography>
              Nama Pelanggan :
              {displayValue(customer?.["d:Sell_to_Customer_Name"])}
            </Typography>
            <Typography>
              Alias : {displayValue(customer?.["d:Sell_to_Customer_Name"])}
            </Typography>
            <Typography>
              Alamat : {displayValue(customer?.["d:Sell_to_Address"])}
            </Typography>
            <Typography>
              Penanggung Jawab :{" "}
              {displayValue(customer?.["d:Penanggung_jawab"])}
            </Typography>
          </Grid>
          {/* Row 2 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography>No. Seri :</Typography>
            <Grid>
              <Typography>Kode Area :</Typography>
              <Typography>Group :</Typography>
            </Grid>
            <Typography>Supervisor :</Typography>
            <Typography>Teknisi :</Typography>
            <Typography>C.S.O :</Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default CustomerInfoAccor;
