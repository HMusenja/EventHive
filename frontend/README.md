# EventHive 🎉  
Smart Event Networking Platform (MERN + Vite + Tailwind + shadcn/ui)

## Overview
EventHive is a full-stack web application that goes beyond ticketing — it helps attendees connect by interests, book meetings, chat in-app, and stay engaged after events.  
It is designed to demonstrate real-world app flows like QR check-in, agendas, speakers, sponsors, and analytics.

---

## Core Features
- **Event Pages**: Hero, agenda, speakers, venue map.
- **Ticketing**: Free/paid tickets, Stripe checkout, promo codes.
- **Attendee Onboarding**: Profile + interests → matchmaking engine.
- **Networking**: 1:1 meeting scheduler with availability & reminders.
- **Chat**: Direct messages, session channels, push/email notifications.
- **QR Check-In**: QR code tickets + webcam scanner for entry.
- **Feedback**: Session/event ratings & forms.
- **Organizer Dashboard**: Sales, attendance, engagement analytics.
- **Optional Plus Features**:
  - Content/session recommendations
  - Group/round-robin speed networking
  - Live Q&A + polls
  - Sponsor lead capture
  - Post-event community space

---

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Socket.IO client
- Lucide Icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Stripe (payments)
- Socket.IO (real-time chat)
- Nodemailer (emails)
- Cloudinary (media)
- Zod (validation)

---

## Project Structure

### Frontend (`/frontend`)
frontend/
├── public/ # Static assets (served as-is)
├── src/
│ ├── api/ # Axios API wrappers
│ │ ├── axiosConfig.js
│ │ └── userApi.js
│ ├── components/
│ │ ├── layout/ # Navbar, Footer, AppShell
│ │ ├── home/ # Homepage sections (Hero, Features, etc.)
│ │ └── ui/ # Generated shadcn/ui components
│ ├── context/ # React Context (Auth, Events, etc.)
│ ├── hooks/ # Custom hooks
│ ├── pages/ # Page-level components
│ │ ├── Home.jsx
│ │ └── Builder.jsx
│ ├── routing/ # AppRoutes
│ │ └── AppRoutes.jsx
│ ├── styles/ # Tailwind + globals
│ │ └── globals.css
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css
├── package.json

### Backend (`/backend`)
backend/
├── src/
│ ├── config/ # env + database config
│ │ └── db.js
│ ├── controllers/ # Route controllers
│ │ └── eventController.js
│ ├── middleware/ # Error handling, auth, rate limit
│ │ └── authMiddleware.js
│ ├── models/ # Mongoose models
│ │ ├── User.js
│ │ ├── Event.js
│ │ └── Ticket.js
│ ├── routes/ # Express routes
│ │ ├── userRoutes.js
│ │ └── eventRoutes.js
│ ├── utils/ # Helpers (jwt, mail, etc.)
│ │ ├── jwt.js
│ │ └── email.js
│ ├── validation/ # Zod schemas
│ │ └── eventValidation.js
│ ├── tests/ # Jest + Supertest tests
│ ├── app.js # Express app config
│ └── server.js # Entry point
├── .env.example
├── package.json

## Demo Workflow (Simulating an Event)

### 1. Organizer creates an event
- Login as **Organizer**  
- Create event → add agenda, speakers, tickets, and promo codes  
- Event page published at `/events/:id`

### 2. Attendee registers & buys ticket
- New user signs up → chooses **Attendee** role  
- Completes onboarding (interests, skills, goals)  
- Buys ticket via **Stripe** (or registers if free)  
- Receives **QR code ticket** in profile/email  

### 3. Check-in at event
- Organizer opens **QR scanner** (webcam)  
- Attendee shows QR code → status updates to **“checked-in”**  

### 4. Networking & meetings
- Attendee gets **recommended matches**  
- Schedules **1:1 meeting** → notifications sent  
- In-app **chat** is available during event  

### 5. During sessions
- **Live Q&A** with upvotes & polls (optional)  
- Attendees leave **feedback forms** after sessions  

### 6. Post-event
- Organizer dashboard shows **sales, attendance, engagement analytics**  
- Attendees can join **community space** for follow-up discussions  

