import axios from "axios";

const BASE_URL =
  window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000" // Changed from 127.0.0.1 to localhost
    : "cb-lake.vercel.app";

export const api = axios.create({
  baseURL: BASE_URL,
});
