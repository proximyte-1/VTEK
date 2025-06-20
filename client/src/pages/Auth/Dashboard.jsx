// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("/api/user")
      .then((res) => {
        console.log(res);
        console.log(res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.error(err);
        // Optionally redirect to login if unauthenticated
      });
  }, []);

  const handleLogout = () => {
    window.location.href = "http://localhost:3001/auth/logout";
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Welcome, {user.displayName}</h2>
      <img
        src={user.photos?.[0]?.value}
        alt="User profile"
        style={{ width: 100, borderRadius: "50%" }}
      />
      <p>Email: {user.emails[0].value}</p>
      <br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
