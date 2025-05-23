import React from "react";
import { NumericFormat } from "react-number-format";
import TextField from "@mui/material/TextField";

const NumberFormatTextField = ({ label, value, name, onChange, ...props }) => {
  return (
    <NumericFormat
      customInput={TextField}
      label={label}
      value={value}
      name={name}
      thousandSeparator
      allowNegative={false}
      onValueChange={(values) => {
        onChange({
          target: {
            name,
            value: values.value,
          },
        });
      }}
      {...props}
    />
  );
};

export default NumberFormatTextField;
