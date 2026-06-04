# Utsava 📅

Utsava is a delightful, modern, responsive AI-powered event organizer and management application built with Next.js, Clerk, Cloudinary, and MongoDB.

---

## 🚀 Features

- **Event Creation**: Easy step-by-step event hosting with direct system image upload to Cloudinary.
- **Onboarding System**: Personalized user interest configuration.
- **Robust Searching & Filtering**: Find events by category, query, state, or city.
- **Advanced Dashboard**: Full control over attendees, real-time scorecard management, live stream manager, and CSV exports.
- **Secure Ticketing**: Auto-generated registration tickets with ticket IDs for seamless check-in.
- **Security Checkpoints**: Organizers only have authorization to manage, check-in, or delete their events.

---

## 🛠️ Tech Stack

- **Core**: Next.js 16 (Turbopack) & React
- **Authentication**: Clerk Auth
- **Database**: MongoDB (Mongoose)
- **Image Hosting**: Cloudinary
- **Email Notifications**: Resend
- **Styling**: Tailwind CSS & Shadcn/ui

---

## 📋 Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory and add the following keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database Connection
MONGODB_URI=your_mongodb_connection_string

# Email Notifications (Resend)
RESEND_API_KEY=your_resend_api_key

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Features (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### 3. Build for Production
```bash
npm run build
npm start
```
