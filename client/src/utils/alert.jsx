import { useState } from "react";

export const useAlert = () => {
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showAlert = (message, severity = "success") => {
    setAlert({ open: true, message, severity });
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return { alert, showAlert, closeAlert };
};
