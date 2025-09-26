import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./context/AuthContext.jsx";
import { EventProvider } from "./context/EventContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AttendeeProvider } from "./context/AttendeeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { TicketProvider } from "./context/TicketContext.jsx";
import { ProfileProvider } from "./context/ProfileContext.jsx";
import { OrganizerTicketProvider } from "./context/OrganizerTicketContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <OrganizerTicketProvider>
              <EventProvider>
                <AttendeeProvider>
                  <NotificationProvider>
                    <TicketProvider>
                      <App />
                    </TicketProvider>
                  </NotificationProvider>
                </AttendeeProvider>
              </EventProvider>
            </OrganizerTicketProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
