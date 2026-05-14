# WatchWise - Frontend

Welcome to the **WatchWise** frontend! This is a modern, responsive web application built with **React 19** and **Vite**, designed for discovering, tracking, and comparing movies and anime.

## 🚀 Technologies Used

This project leverages a robust stack of modern technologies to ensure performance, scalability, and a smooth user experience:

- **React 19:** The core UI library, utilizing the latest features for efficient rendering.
- **Vite:** A lightning-fast build tool and development server.
- **Redux Toolkit (RTK):**
  - **RTK Query:** Used for efficient data fetching and caching, specifically for authentication and user-related operations.
  - **Global State Management:** Manages user sessions and application-wide states.
- **React Router DOM v6:** Handles seamless client-side routing and protected access control.
- **Axios:** Used for complex media-related API interactions with the backend proxy.
- **Bootstrap 5:** Provides a solid, responsive grid system and pre-styled UI components.
- **Formik & Yup:** A powerful combination for robust form handling and schema-based validation.
- **React Hot Toast:** For beautiful, non-obtrusive toast notifications.
- **Recharts:** Integrated for visualizing user analytics and trends.
- **CSS3:** Custom styles to fine-tune the aesthetics and branding.

---

## 📁 Project Structure

The project follows a feature-based architecture, making it modular and easy to maintain:

```text
Fn/
├── public/              # Static assets (icons, images)
├── src/
│   ├── app/             # Redux store configuration
│   ├── assets/          # Project-specific assets (SVG, images)
│   ├── common/          # Reusable UI components (Navbar, ProtectedRoute, MediaCard)
│   ├── features/        # Domain-specific modules
│   │   ├── analytics/   # User activity visualization
│   │   ├── anime/       # Anime discovery and filtering
│   │   ├── auth/        # Authentication (Login, Signup, OTP, Password Reset)
│   │   ├── comparison/  # Media comparison logic
│   │   ├── favorites/   # Favorites management
│   │   ├── home/        # Landing page and trending sections
│   │   ├── movies/      # Movie discovery and filtering
│   │   ├── profile/     # User profile, interests, and discovery
│   │   └── watchlist/   # Personalized watchlist management
│   ├── hooks/           # Custom React hooks (e.g., useMediaLogic)
│   ├── services/        # API abstraction layer (Axios instances, RTK Query endpoints)
│   ├── utils/           # Helper functions and constants
│   ├── App.jsx          # Main layout component
│   ├── main.jsx         # Application entry point
│   └── config.js        # Global configuration (API Base URL)
└── index.html           # HTML template
```

---

## 🏗️ Architecture & Patterns

### 1. State Management Strategy
The application employs a dual-layered state management approach:
- **Server State (RTK Query):** We use RTK Query for data-intensive operations like authentication and user profiles. This handles automatic caching, loading states, and background synchronization.
- **UI State (Redux Slices):** Standard Redux slices are used for synchronous application state, such as user session data and global UI toggles.

### 2. Logic Abstraction (Custom Hooks)
To keep components clean and focused on rendering, complex logic is abstracted into custom hooks like `useMediaLogic.js`, which centralizes filtering, pagination, and data fetching logic for media grids.

---

## 🛠️ Key Features & Flow

### 1. Authentication & Security
- **Flow:** Users sign up with email and must verify their account via **OTP**.
- **Security:** Uses `HttpOnly` cookies for session management. Protected routes ensure that features like the Watchlist or Profile are only accessible to logged-in users.
- **State:** User authentication status is managed globally via Redux, allowing for persistent sessions across refreshes.

### 2. Media Discovery (Movies & Anime)
- **Architecture:** The app uses a proxy pattern. It calls our backend, which then fetches data from external APIs (like TMDB for movies and Jikan/MyAnimeList for anime).
- **Features:**
  - **Search:** Real-time search for both movies and anime.
  - **Filtering:** Filter media by genres, languages, and sort them by popularity or rating.
  - **Details:** Comprehensive detail pages including synopses, ratings, and recommendations.

### 3. Personalization
- **Watchlist:** Users can add/remove media to their personal watchlist.
- **Favorites:** Mark specific media as favorites for quick access.
- **Interests:** Users can select their favorite genres to receive personalized content suggestions.

### 4. Comparison & Analytics
- **Compare:** A dedicated feature to compare different movies or anime side-by-side.
- **Analytics:** Visualized data showing user preferences and activity using Recharts.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation
1. Clone the repository.
2. Navigate to the frontend directory:
   ```bash
   cd Fn
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Environment (Optional):
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://watchwisebackend.onrender.com
   ```

### Running the Project
- **Development Mode:**
  ```bash
   npm run dev
   ```
  The app will be available at `http://localhost:5173`.

- **Production Build:**
  ```bash
   npm run build
   ```
  This generates a `dist/` folder ready for deployment.

---

## 📡 API Configuration
The frontend communicates with the backend hosted at:
`https://watchwisebackend.onrender.com`

This can be configured in `src/config.js`.

---

## 📱 Responsive Design & UX
The application is built with a **Mobile-First** philosophy. Using Bootstrap 5's grid system and custom CSS media queries, the interface provides a seamless experience across mobile, tablet, and desktop devices.

---

## ⚡ Performance & UX Optimizations

To ensure a high-quality user experience, the following optimizations have been implemented:

- **Skeleton Screens:** Instead of generic loading spinners, we use custom `MediaSkeleton` and `DetailSkeleton` components. This improves **perceived performance** by giving users a visual hint of the layout before data arrives.
- **Optimized Image Loading:** Using the `OptimizedImage` component to handle image loading states and prevent **Layout Shifts (CLS)**, which is critical for a smooth scrolling experience in media grids.
- **AbortController Integration:** API calls are linked to `AbortController` signals (managed via custom hooks), ensuring that pending requests are cancelled when a user navigates away or changes search queries, saving bandwidth and preventing state updates on unmounted components.
- **Real-time Feedback:** Integration of `react-hot-toast` provides immediate, non-blocking feedback for user actions like adding to a watchlist or logging in.

---

## 🗺️ Future Roadmap
- [ ] **Dark Mode:** Add a theme switcher for enhanced user comfort.
- [ ] **Social Features:** Allow users to follow each other and share watchlists.
- [ ] **Unit Testing:** Implement testing for core utility functions and Redux slices.
- [ ] **PWA:** Add Progressive Web App support for offline access.

---

## 🤝 Contributing
Feel free to submit issues or pull requests to improve the platform!
