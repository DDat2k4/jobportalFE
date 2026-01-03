import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./assets/plugins/bootstrap/css/bootstrap.min.css";
import "./assets/plugins/bootstrap/css/bootsnav.css";
import "./assets/plugins/icons/css/icons.css";
import "./assets/plugins/animate/animate.css";
import "./assets/plugins/nice-select/css/nice-select.css";
import "./assets/plugins/aos-master/aos.css";
import "./assets/css/style.css";
import "./assets/css/responsive.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
