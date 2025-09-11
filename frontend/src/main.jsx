import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./context/AuthContext.jsx";
import { EventProvider } from "./context/EventContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AttendeeProvider } from "./context/AttendeeContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <EventProvider>
            <AttendeeProvider>
              <App />
            </AttendeeProvider>
          </EventProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
