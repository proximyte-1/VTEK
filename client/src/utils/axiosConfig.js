// src/axios/axiosConfig.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3001", // your Express server
  withCredentials: true, // send cookies with requests
});

export default axiosInstance;
