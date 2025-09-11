import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EventDetail from "@/pages/EventDetail";
import EventList from "@/pages/EventList";
import AccountLayout from "@/pages/AccountLayout";
import Profile from "@/pages/account/Profile";
import Matches from "@/pages/account/Matches";
import Meetings from "@/pages/account/Meetings";
import MyTickets from "@/pages/account/MyTickets";
import Settings from "@/pages/account/Settings";
import AppShell from "@/components/layout/AppShell";
import EventOnboardingPage from "@/components/events/EventOnboardingPage";
import Tickets from "@/pages/Tickets";
import EventProfilePage from "@/pages/events/EventProfilePage";
import PeopleSuggestionsPage from "@/pages/events/PeopleSuggestionsPage";
import PeoplePublicProfile from "@/pages/events/PeoplePublicProfile";
import TicketSuccess from "@/pages/TicketSuccess";
import DummyCheckout from "@/pages/DummyCheckout";
import CheckinScanner from "@/pages/CheckinScanner";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes wrapped with AppShell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Events listing */}
        <Route path="/events" element={<EventList />} />

        {/* Event detail by slug (preferred) */}
        <Route path="/events/:slug" element={<EventDetail />} />

        {/* Onboarding + Tickets by slug */}
        <Route path="/events/:slug/onboarding" element={<EventOnboardingPage />} />
        <Route path="/events/:slug/tickets" element={<Tickets />} />
        <Route path="/events/id/:id/tickets" element={<Tickets />} /> 
        <Route path="/tickets/success" element={<TicketSuccess />} />
        <Route path="/pay/dummy-checkout" element={<DummyCheckout />} />
        <Route path="/events/:eventId/checkin" element={<CheckinScanner />} />

        {/* Attendee Event Profile */}
        <Route path="/events/:slug/me" element={<EventProfilePage />} />
        <Route path="/events/:slug/people" element={<PeopleSuggestionsPage />} />
        <Route path="/events/:slug/attendees/:memberId" element={<PeoplePublicProfile />} />

        {/* Legacy event detail by id */}
        <Route path="/events/id/:id" element={<EventDetail />} />
      </Route>

      {/* Account routes (no AppShell, use AccountLayout instead) */}
      <Route path="/account" element={<AccountLayout />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="matches" element={<Matches />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 fallback (optional) */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}


