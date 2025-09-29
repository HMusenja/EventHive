import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import EventDetail from "@/pages/EventDetail";
import EventList from "@/pages/EventList";
import EditEventPage from "@/pages/events/EditEventPage";


import Dashboard from "@/pages/dashboard/Dashboard";
import OrganizerLayout from "@/pages/OrganizerLayout";
import Sales from "@/pages/dashboard/organizer/Sales";
import Events from "@/pages/dashboard/organizer/Events";
import Exports from "@/pages/dashboard/organizer/Exports";
import Analytics from "@/pages/dashboard/organizer/Analytics";

import RequestMeeting from "@/pages/RequestMeeting";
import MyMeetings from "@/pages/MyMeetings";
import AccountLayout from "@/pages/AccountLayout";
import EditProfilePage from "@/pages/account/EditProfilePage";
import Profile from "@/pages/account/Profile";
import Matches from "@/pages/account/Matches";
import Meetings from "@/pages/account/Meetings";
import MyTickets from "@/pages/account/MyTickets";
import Settings from "@/pages/account/Settings";
import AppShell from "@/components/layout/AppShell";
import EventOnboardingPage from "@/components/events/EventOnboardingPage";
import CreateEventPage from "@/pages/events/CreateEventPage";
import Tickets from "@/pages/Tickets";
import EventProfilePage from "@/pages/events/EventProfilePage";
import PeopleSuggestionsPage from "@/pages/events/PeopleSuggestionsPage";
import PeoplePublicProfile from "@/pages/events/PeoplePublicProfile";
import TicketSuccess from "@/pages/TicketSuccess";
import DummyCheckout from "@/pages/DummyCheckout";
import CheckinScanner from "@/pages/CheckinScanner";
import Chat from "@/pages/Chat";
import ChatHub from "@/pages/ChatHub";
import GlobalChat from "@/pages/GlobalChat";

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



       {/* <Route path="/events/:id/tickets" element={<Tickets />} /> */}

        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/success" element={<TicketSuccess />} />
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

        {/* Event detail by slug (preferred) */}
        <Route path="/events/:slug" element={<EventDetail />} />

         <Route path="/dashboard/organizer" element={<OrganizerLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="sales" element={<Sales />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="exports" element={<Exports />} /> 
          </Route>

        {/* Onboarding + Tickets by slug */}
        <Route path="/events/:slug/onboarding" element={<EventOnboardingPage />} />
        <Route path="/events/:slug/tickets" element={<Tickets />} />

        <Route path="/events/id/:id/tickets" element={<Tickets />} />


        <Route path="/pay/dummy-checkout" element={<DummyCheckout />} />
        <Route path="/events/:eventId/checkin" element={<CheckinScanner />} />

        {/* Attendee Event Profile */}
        <Route path="/events/:slug/me" element={<EventProfilePage />} />
        <Route path="/events/:slug/people" element={<PeopleSuggestionsPage />} />
        <Route path="/events/:slug/attendees/:memberId" element={<PeoplePublicProfile />} />
        {/* Legacy event detail by id */}
        <Route path="/events/id/:id" element={<EventDetail />} />

        {/* Chat hub + global chat */}
        <Route path="/chat" element={<ChatHub />} />
        <Route path="/chat/global" element={<GlobalChat />} />
        <Route path="/chat/event/:eventId" element={<GlobalChat />} />
        {/* Event chat by slug OR by id */}
        <Route path="/events/:slug/chat" element={<Chat />} />
        <Route path="/events/:eventId/chat" element={<Chat />} />


      </Route>


      {/* Account routes (no AppShell, use AccountLayout instead) */}
      <Route path="/account" element={<AccountLayout />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="event/create" element={<CreateEventPage />} />
         <Route path="event/:id/edit" element={<EditEventPage />} />
        <Route path="matches" element={<Matches />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 fallback (optional) */}
      <Route path="*" element={<div>404 Not Found</div>} />
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}


