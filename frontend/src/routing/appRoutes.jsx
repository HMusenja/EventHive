// src/routing/appRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EventDetail from "@/pages/EventDetail";
import EventList from "@/pages/EventList";
import Tickets from "@/pages/Tickets";
import RequestMeeting from "@/pages/RequestMeeting";
import MyMeetings from "@/pages/MyMeetings";

// import Dashboard from "@/pages/Dashboard";
// import Settings from "@/pages/Settings";
// import ProtectedRoute from "./ProtectedRoute";
import AccountLayout from "@/pages/AccountLayout";
import AppShell from "@/components/layout/AppShell";

export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/account" element={<AccountLayout />} />
        <Route path="/events/:id/tickets" element={<Tickets />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/events/:eventId/network/request/:userId" element={<RequestMeeting />} />
        <Route path="/events/:eventId/meetings" element={<MyMeetings />} />


        {/* Protected */}
        {/* <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* 404 fallback (optional) */}
      </Routes>
    </AppShell>
  );
}
