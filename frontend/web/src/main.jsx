import React from "react";
import ReactDOM from "react-dom/client";
import { CustomerHomePage } from "./pages/customer/CustomerHomePage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CustomerHomePage />
  </React.StrictMode>
);
