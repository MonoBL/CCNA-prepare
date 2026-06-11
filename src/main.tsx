import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import AuthGate from "@/auth/AuthGate";
import { ProgressProvider } from "@/state/ProgressContext";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthGate>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </AuthGate>
    </BrowserRouter>
  </React.StrictMode>
);
