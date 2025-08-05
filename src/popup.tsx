import React from "react";
import ReactDOM from "react-dom/client";
import { PopupApp } from "./components/PopupApp";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("popup-root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <PopupApp />
    </ThemeProvider>
  </React.StrictMode>,
);