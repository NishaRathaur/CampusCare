# CampusCare

**Smart Campus Hygiene, Infrastructure, and Facility Management System**

CampusCare is a full-stack web application that lets students and faculty report hygiene and infrastructure problems on campus, and lets the administration track them through to resolution. Complaints are assigned to supervisors, supervisors assign workers, and the student sees proof of the fix before giving feedback.

It is the enhanced version of an earlier *College Hygiene and Infrastructure Fault Reporting System*.

---

## Features

**Student / Faculty**
- Register with email verification, then log in
- Raise complaints with title, description, location and photo
- AI-assisted category and priority suggestion (LLM with rule-based fallback)
- Track complaint status in *My Complaints*
- View the supervisor's proof-of-resolution photo, then give a rating and comment
- Profile and change-password pages

**Admin**
- Dashboard with all complaints in a compact table and a detail drawer
- Assign complaints to supervisors and see which worker is handling each one
- Close complaints after reviewing proof and student feedback
- Reports and Analytics: totals, resolution rate, average days to resolve, average rating, status and priority charts
- Export complaint reports to Excel with a date range and field selection
- Manage supervisors, workers and complaint categories

**Supervisor**
- Home dashboard with live stats
- View assigned complaints and update status (Pending, In Progress, Resolved)
- Assign workers from their own team (*My Workers*)
- Upload proof-of-resolution photos

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, SheetJS (`xlsx`) |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcryptjs, role-based access control |
| File uploads | Multer |
| Email | Nodemailer |
| AI classification | Anthropic Messages API (optional, with rule-based fallback) |

---

## Complaint Lifecycle

```
Pending -> Assigned -> In Progress -> Resolved -> Closed
                                          |
                                          +-> Reopened (if not satisfactory)
```

---

## Project Structure

```
Campus Care/
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   └── index.js
└── Frontend/
    ├── public/
    ├── src/
    └── index.html
```

---

## Getting Started

### Prerequisites
- Node.js 18 or later
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/NishaRathaur/CampusCare.git
cd CampusCare
```

### 2. Set up the backend
```bash
cd Backend
npm install
```

Create a `Backend/.env` file (example values, replace with your own):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campuscare
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Email (for verification links)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

# Optional: AI classification (falls back to rule-based if missing)
ANTHROPIC_API_KEY=your_api_key
```

Start the server:
```bash
npm run dev
```
If there is no `dev` script, use `node index.js`.

### 3. Set up the frontend
```bash
cd ../Frontend
npm install
```

Create a `Frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the app:
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

> To open the app from a phone on the same Wi-Fi, set `CLIENT_URL` to your computer's local IP address and run Vite with `server.host: true`.

---

## User Roles

| Role | Access |
|---|---|
| Student / Faculty | Raise and track own complaints, give feedback |
| Supervisor | Manage assigned complaints and own workers |
| Admin | Full access: users, assignments, reports, export |

---


## Future Scope

- Mobile app and push notifications
- Automatic escalation of overdue complaints
- Multi-campus support
- AI summary of feedback comments
- Mandatory proof photo before a complaint can be marked resolved

---

