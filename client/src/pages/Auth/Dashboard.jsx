// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("/api/user")
      .then((res) => {
        setUser((u) => res.data._json);
      })
      .catch((err) => {
        console.error(err);
        // Optionally redirect to login if unauthenticated
      });
  }, []);

  const handleLogout = () => {
    window.location.href = "http://localhost:3001/auth/logout";
  };

  const handleTest = () => {
    console.log(user.photos[0]);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Welcome, {user.name}</h2>
      <img
        src={user.picture}
        alt="User profile"
        referrerPolicy="no-referrer"
        style={{ width: 100, borderRadius: "50%" }}
      />
      <p>Email: {user.email}</p>
      <br />
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleTest}>test</button>
    </div>
  );
};

export default Dashboard;
