# Full-Stack-dev
Second Hand Marketplace

A full-stack web application for buying and selling pre-owned items. Built with modern web technologies to provide a seamless marketplace experience.

---

## 🚀 Features
- 🔐 **User Authentication** – Sign up, log in, and manage accounts securely.
- 📦 **Product Listings** – Add, edit, and delete items with images and descriptions.
- 🔍 **Search & Filter** – Find items by category, price, or keywords.
- 💬 **Messaging System** – Buyers and sellers can communicate directly.
- 📱 **Responsive Design** – Optimized for desktop and mobile devices.
- ⚡ **Real-Time Updates** – Instant listing and chat updates with WebSockets.

---

## 🛠️ Tech Stack
**Frontend:**
- React.js (Vite)
- TailwindCSS

**Backend:**
- Node.js + Express.js
- MongoDB (Mongoose ORM)

**Other Tools:**
- JWT Authentication
- Cloud Storage for images
- WebSocket / Socket.io for real-time chat

---

## 📂 Project Structure

├── client/          # Frontend (React + Vite)
├── server/          # Backend (Node.js + Express)
├── models/          # MongoDB schemas
├── routes/          # API endpoints
└── README.md


---

## ⚙️ Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/second-hand-marketplace.git
   cd second-hand-marketplace

2. Install dependencies:
    # Backend
    cd server
    npm install
    
    # Frontend
    cd ../client
    npm install

3. Configure environment variables:
   - Create a .env file in server/ with:
   
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     CLOUD_STORAGE_KEY=your_cloud_key

5. Run the app:
    # Backend
    npm run dev
    
    # Frontend
    npm run dev
  
