🧠 Module 1: Global State & API Orchestration

The "brain" of the WatchWise frontend isn't just storing data; it's managing the
Synchronicity between a distributed backend and a complex, multi-page UI. We
utilize RTK Query to treat the backend as a "Single Source of Truth" while
maintaining a lightning-fast local cache.

1. The Unified Service Layer: Beyond Simple Fetching

Instead of scattered API calls, we implemented a Service-Oriented Architecture.
By splitting our API logic into authApi, watchlistApi, and favoriteApi, we
achieve high maintainability.

The Technical Implementation

Each service uses createApi with a shared fetchBaseQuery.

  - Encapsulation: Every endpoint (e.g., getWatchlist, addFavorite)
    automatically generates its own React Hooks (useGetWatchlistQuery), which
    track isLoading, isError, and isFetching states natively.
  - Memory Management: RTK Query automatically removes data from the cache when
    no components are "subscribed" to it (default 60 seconds), keeping the
    browser's memory footprint lean.

2. Credentials Management: Secure Handoff

Since our backend uses HttpOnly Cookies for JWT storage, the frontend must be
configured to participate in this secure handshake, especially across different
domains (e.g., .onrender.com).

credentials: "include" Logic

In our baseQuery configuration, we explicitly set:

baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    credentials: "include", // The "Golden Key"
}),

  - Why this matters: By default, browsers do not send cookies with cross-origin
    requests. By setting this to "include", we tell the browser to attach the
    token cookie to every outgoing request.
  - Stateless Persistence: The frontend doesn't need to "know" the JWT or store
    it in localStorage. This eliminates XSS (Cross-Site Scripting) risks where a
    malicious script could steal a token. The browser handles the identity; the
    code handles the data.

3. Cross-Tag Invalidation: Real-Time UI Sync

One of the hardest problems in React is ensuring that when you "Like" a movie on
the search page, the "Favorite" count on your Profile page updates instantly
without a refresh. We solve this with Tag-Based Invalidation.

The "Subscription" Model

1.  providesTags: The getWatchlist query "subscribes" to the "Watchlist" tag.
2.  invalidatesTags: The addToWatchlist mutation "invalidates" the "Watchlist"
    tag.

  - The Orchestration: The moment addToWatchlist succeeds, RTK Query detects
    that the data for any component showing the watchlist is now "stale." It
    automatically re-fetches the data in the background, ensuring the Home,
    Movies, and Profile pages stay perfectly synced.

4. Optimistic UI Updates: The "Zero-Latency" Feel

To provide a premium user experience, we don't wait for the server to confirm a
"Favorite" or "Remove" action. We implement Optimistic Updates via the
onQueryStarted lifecycle.

Technical Workflow (The removeFromWatchlist Example)

In watchlistAPI.js, when a user clicks "Remove":

1.  Manual Patch: We use dispatch(api.util.updateQueryData) to manually reach
    into the Redux cache and remove the item before the API call even hits the
    server.
2.  Perceived Speed: The UI element vanishes instantly (0ms latency).
3.  The "Rollback" Safety Net:
    try {
      await queryFulfilled; // Wait for the real server response
    } catch {
      patchResult.undo(); // If the server fails (e.g., timeout), put the item back!
      toast.error("Sync failed. Restoring item.");
    }

  - Engineering Benefit: This handles the "Race Condition" where a user might
    click multiple buttons quickly. The UI remains responsive while the server
    catches up.

5. Summary of the Global Orchestrator

| Feature              | Technical Benefit                       | User Impact                                                  |
| :------------------- | :-------------------------------------- | :----------------------------------------------------------- |
| **RTK Query**        | Centralized cache / Auto-loading states | No broken "loading" spinners; consistent data.               |
| **HttpOnly Support** | Token-less Auth / Security              | Faster, more secure login that doesn't "log out" on refresh. |
| **Tag System**       | Decoupled component synchronization     | Changes in one page reflect everywhere instantly.            |
| **Optimistic Logic** | Latency compensation                    | App feels fast even on slow 3G/4G connections.               |

Next Step: Should we deep dive into Module 2: Adaptive Media Discovery & Hybrid
Recommendations? This explains the complex logic behind calculating user "Taste
Weights" in Home.jsx.

This deep dive examines Module 2: Adaptive Media Discovery & Hybrid
Recommendations. In this module, we move away from static landing pages and
implement a behavioral "Interest Graph" that dynamically reshapes the user
experience based on their interaction history.

🚀 Module 2: Adaptive Media Discovery & Hybrid Recommendations

The Home.jsx component serves as a Recommendation Orchestrator. It doesn't just
show "What's Popular"; it calculates "What's Relevant" by synthesizing user
behavior into a weighted interest profile.

1. The Taste-Based Algorithm: Behavioral Heuristics

The heart of our discovery engine is a weighted scoring system. Instead of
treating every interaction equally, we apply Intent-Based Weights to genres.

The Mathematical Weighting Model

As seen in the sortedInterests memoized calculation, we assign points to genres
based on where they appear:

  - Favorites (Weight: +5): Indicates high affinity. A user favoriting a
    "Cyberpunk" anime is a much stronger signal than simply adding it to a list.
  - Watchlist (Weight: +2): Indicates active interest. Genres associated with
    items the user is currently watching or planning to watch are moderately
    weighted.
  - Stated Preferences (Weight: +1): Indicates aspirational interest. These are
    the genres the user said they liked during onboarding.

The Aggregation Logic

watchlist.forEach(item => {
  item.genres?.forEach(g => {
    behaviorGenres[g] = (behaviorGenres[g] || 0) + 2;
  });
});
// ... same for favorites (+5) and preferences (+1)

The system then flattens these into a sorted array, identifying the user's Top 3
Genre Pillars. These pillars are then mapped to their respective API IDs (TMDB
for movies, MAL for anime) to trigger targeted discovery queries.

2. Dynamic Content Sourcing: Prioritized Fallbacks

To ensure the "Hero" section is never empty and always optimized, we implement a
Layered Content Pipeline.

Prioritization Logic

The application executes two parallel queries for both Movies and Anime:

1.  The Target Query: useGetMoviesByGenreQuery (using calculated IDs).
2.  The Fallback Query: useGetPopularMoviesQuery (Global trending).

The "Smart Switch"

const popularMovies = useMemo(() => {
    const recs = movieRecQuery.data?.results || [];
    const trending = movieTrendingQuery.data?.results || [];
    // Prioritize Recommendations, fall back to Trending if recs are empty
    return recs.length > 0 ? recs.slice(0, 6) : trending.slice(0, 6);
}, [movieRecQuery.data, movieTrendingQuery.data]);

  - For New Users: Since they have no behavior, the Recommendation query is
    skipped (skip: !topMovieGenreIds), and the UI seamlessly displays "Trending
    Movies."
  - For Returning Users: The UI instantly transforms to show "Recommended
    Movies" based on their calculated taste pillars.

3. Content Safety Filter: The isSafe() Sanitizer

External APIs like TMDB and Jikan occasionally return "Adult" or "NSFW" metadata
that might not align with a general-purpose media tracker. We implement a
multi-pass sanitization filter.

Multi-Pass Sanitization

The isSafe utility checks three specific vectors:

1.  Explicit Flag: Checks the native item.adult boolean from TMDB.
2.  Rating Analysis: Specifically targets Jikan/MyAnimeList ratings. It looks
    for "Rx" (Hentai) or "R+" (Mild Nudity) and excludes them from the
    recommendation pool.
3.  Keyword Heuristics: Scans the title and overview/synopsis for a blacklisted
    array of adult keywords (erotica, sex, etc.) to catch items that might have
    slipped through the rating classification.

4. Performance & UX Optimization

Discovery is data-intensive, so we implement strict performance guards:

  - Memoized Filtering: We use useMemo to ensure that filtering out items
    already in the user's watchlist from the "Recommended" section doesn't
    re-run on every re-render.
  - Skeleton Integration: During the "Cold Start" (initial data fetch), we use
    MediaSkeleton count=6 to maintain layout stability, preventing the
    "Jumpiness" often seen in dynamic discovery feeds.
  - SAFE_GENRES_TO_EXCLUDE: We maintain a utility list (e.g., excluding generic
    genres like "TV Movie") to ensure the recommendation weights are focused on
    core cinematic genres like "Sci-Fi," "Action," or "Drama."

5. Summary of the Recommendation Engine

| Stage            | Logic                                       | Purpose                             |
| :--------------- | :------------------------------------------ | :---------------------------------- |
| **Analysis**     | Weighted reduction of Watchlist/Favs/Prefs  | Identify the "Taste Pillars."       |
| **Mapping**      | Cross-reference genre names to Provider IDs | Translate "Drama" into TMDB ID 18.  |
| **Fetching**     | Parallel Recommendation & Trending queries  | Zero-downtime content availability. |
| **Sanitization** | Keyword & Rating filtering (`isSafe`)       | Clean, professional UI.             |
| **Final Render** | Prioritize Recommendations over Trends      | personalized "Discovery" feel.      |

Next Step: Should we deep dive into Module 3: Intelligent Library & Watchlist
Management? This covers the complex state management for status updates and
cross-media filtering.

This deep dive explores Module 3: Intelligent Library & Watchlist Management.
This module is the core utility of the application—it’s where the user’s
personal data is managed, filtered, and synchronized. We focus on the
engineering required to make a massive library feel searchable and responsive.

📚 Module 3: Intelligent Library & Watchlist Management

The Watchlist.jsx component and its associated buttons represent a State-Driven
Library. It solves the problem of "Data Inconsistency" by creating a unified
schema for different media types and provides a high-performance filtering
interface.

1. Dual-Axis Filtering: Sophisticated State Slicing

Unlike a simple search, the Watchlist implements Cross-Category Filtering. A
user can simultaneously filter by Status (e.g., "Completed") and Type (e.g.,
"Anime").

The Combined Filter Logic

Instead of hitting the API every time a button is clicked, we perform
Client-Side Filtering on the cached Redux data. This results in 0ms latency for
the user.

const filteredItems = items.filter(item => {
    const statusMatch = statusFilter === "All" || item.status === statusFilter;
    const typeMatch = typeFilter === "All" || item.type.toLowerCase() === typeFilter.toLowerCase();
    return statusMatch && typeMatch;
});

Dynamic UI Synchronization

  - Pagination Reset: A common UX pitfall is staying on "Page 4" when a filter
    reduces the results to one page. We implement a useEffect that listens to
    statusFilter and typeFilter and automatically resets currentPage to 0
    whenever a filter changes.
  - Contextual Badge Counts: The filter buttons don't just show labels; they
    show dynamic counts. We use helper functions (getStatusCount, getTypeCount)
    that calculate totals based on the currently active cross-filter, giving the
    user immediate feedback on how many items exist in that sub-category.

2. Atomic Action Components: The "Lego" Pattern

We avoid "Prop Drilling" and "Fat Components" by moving API logic into Atomic
Components: WatchlistButton and FavoriteButton.

Encapsulated Responsibility

  - Self-Sufficient Logic: Each button uses its own RTK Query hooks
    (useGetWatchlistQuery, useAddToWatchlistMutation). You can drop a
    WatchlistButton anywhere—a search result, a detail page, or a recommendation
    slider—and it will work perfectly without needing parent props to manage its
    state.
  - Performance via React.memo: Since a watchlist grid can render 50+ buttons,
    we wrap these components in React.memo. This prevents unnecessary re-renders
    of every button when the user simply types in a search bar elsewhere,
    significantly improving FPS on mobile devices.

3. Status Orchestration: Real-Time Mutations

Changing the status of an item (e.g., moving a movie from "Watching" to
"Completed") triggers a complex background orchestration.

The "Update" Lifecycle

1.  Direct Mutation: When a user selects a new status from the dropdown,
    updateWatchlistStatus is called.
2.  Tag Invalidation: RTK Query invalidates the "Watchlist" tag.
3.  UI Reflow: The Watchlist.jsx component automatically receives the updated
    list. Because of our Cross-Tag Invalidation (Module 1), the Analytics page
    also updates its "Completion Progress" chart in the background.
4.  Toast Feedback: The system provides non-blocking toast notifications
    ("Status Updated"), ensuring the user feels in control without interrupting
    their workflow.

4. Metadata Denormalization: Standardizing the Chaos

The greatest technical challenge in this module is that Movies (TMDB) and Anime
(Jikan) provide data in completely different shapes.

The Normalization Bridge

Inside the buttons, before sending data to the backend, we transform the
"Provider Schema" into the "WatchWise Schema":

  - Title Logic: Maps item.title (Movies) and item.name (Anime) to a single
    title field.
  - Image Logic: Converts TMDB's relative path (/poster.jpg) and Jikan's nested
    object (images.jpg.image_url) into a single, absolute image string.
  - Genre Logic: Maps TMDB's genre_ids (numbers) and Jikan's genres (objects)
    into a clean string[] of genre names.

Engineering Benefit

Because the buttons handle this "translation" during the Add phase, the
Watchlist.jsx component can be remarkably simple. It doesn't need if/else logic
for images or titles; it just renders item.image and item.title, regardless of
whether the content is a movie or an anime.

5. Summary of Library Management

| Feature                | Technical Implementation         | Impact                                      |
| :--------------------- | :------------------------------- | :------------------------------------------ |
| **Combined Filtering** | Predicate logic on cached state  | Instant results without API lag.            |
| **Atomic Buttons**     | Encapsulated RTK Query hooks     | High reusability and clean code.            |
| **Schema Mapping**     | Manual denormalization on "Add"  | Unified UI for disparate data sources.      |
| **Responsive Grid**    | Bootstrap 5 + `aspect-ratio` CSS | Perfect card alignment on all screen sizes. |

Next Step: Should we deep dive into Module 4: Social Graph & Peer Discovery or
Module 5: Behavioral Analytics & Data Visualization? Module 5 is particularly
interesting for seeing how this data is transformed into charts.

This deep dive explores Module 4: Social Graph & Peer Discovery. This module
transitions WatchWise from a solo utility into a social ecosystem. The
engineering challenge here is balancing a lightweight "Discovery" experience
with the potentially heavy data load of a growing user directory.

👥 Module 4: Social Graph & Peer Discovery

The DiscoverPeople.jsx component and its associated comparisonAPI serve as the
Entry Point to the Social Graph. It is designed to facilitate "Taste Matching"
by making other users searchable and their interests instantly visible.

1. High-Performance Peer Search Architecture

In this module, we prioritize Interaction Speed. We use a client-side search
strategy that provides 0ms latency feedback as the user types.

The Optimized Search Logic

Instead of sending a new API request for every keystroke (which would stress the
backend and introduce network lag), we fetch the user directory once and perform
Local String Matching.

  - Case-Insensitive Normalization: We use .toLowerCase() on both the search
    term and the username to ensure consistent results.
  - The Filter Pipeline:
    const filteredUsers = otherUsers.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

Developer Experience (DX) Enhancements

  - useRef for Auto-Focus: We use a useRef hook to target the search input on
    mount. This ensures that as soon as a user navigates to "Discover," they can
    start typing immediately without an extra click, reducing the "Interaction
    to Next Paint" (INP) time.
  - State Reset Logic: A common logic error is being on "Page 5" and typing a
    search that only has 1 result—the result would be hidden. We implement a
    useEffect that forces setCurrentPage(0) whenever the searchTerm changes.

2. Similarity Visualization: Interest Highlighting

A key part of "Discovery" is knowing why you should follow someone. We implement
a dynamic interest preview in every user card.

Data-Driven Card Design

  - Genre Extraction: The backend sends the user's preferences.genres. The
    frontend then slices this array to show the top 2 interests:
    user.preferences?.genres?.length > 0 
      ? `Interested in ${user.preferences.genres.slice(0, 2).join(", ")}` 
      : "Exploring genres..."
  - Visual Identity: Since we don't store high-res profile pictures to maintain
    a lightweight DB, we generate Dynamic Avatars using the first letter of the
    username. This is styled with Bootstrap's circular utility classes and a
    custom shadow to give it a "3D" profile feel.
  - Taste Teasers: By highlighting genres like "Sci-Fi" or "Thriller" directly
    on the search card, we reduce the "Cognitive Load" on the user, allowing
    them to identify potential "Taste Matches" without clicking into every
    profile.

3. Client-Side Pagination & DOM Management

As the user base grows, rendering hundreds of profile cards simultaneously can
lead to Browser Thread Jitter and memory spikes.

Paginated User Grid

We implement a client-side pagination system (12 items per page) to manage the
DOM node count.

  - The Slice Pattern: We use the formula paginatedUsers =
    filteredUsers.slice(currentPage * itemsPerPage, (currentPage + 1) *
    itemsPerPage) to determine exactly which user cards to mount.
  - DOM Performance: By limiting the grid to 12 items, we ensure that the
    browser only has to calculate layouts and styles for a small subset of
    components. This keeps the scroll performance at a locked 60FPS, even on
    low-end mobile devices.
  - Smooth Navigation: The pagination controls include a window.scrollTo({
    top: 0, behavior: "smooth" }) call, ensuring that when a user changes pages,
    they are returned to the top of the grid with a polished animation.

4. Summary of the Social Discovery Module

| Feature                | Technical Implementation        | Impact                                       |
| :--------------------- | :------------------------------ | :------------------------------------------- |
| **Local Search**       | Array filtering on cached state | Instant, zero-latency search results.        |
| **Auto-Focus**         | `useRef` + `useEffect` hook     | Immediate interactivity on page load.        |
| **Dynamic Avatars**    | CSS-driven letter avatars       | Lightweight profiles without image overhead. |
| **Taste Highlighting** | Array slicing from preferences  | Quicker social matching and relevance.       |
| **Pagination**         | Array slicing for DOM nodes     | High performance with many users.            |

5. Senior Developer Insights: Scaling the Social Graph

Currently, fetching all users in one go is efficient for a few hundred users.
However, our architecture is ready for the next level of scale:

  - Server-Side Pagination: The comparisonAPI is structured so we can easily
    swap getAllUsers for a paginated endpoint (/users?page=1&limit=20) as the
    community grows.
  - Memoized Filtering: If the user count exceeds 1,000, we would wrap the
    filteredUsers logic in useMemo to prevent the search filter from running on
    every re-render of the parent component.

Next Step: Should we deep dive into Module 5: Behavioral Analytics & Data
Visualization? This covers how we turn these user interactions into the complex
charts seen on the Profile page.

This deep dive examines Module 5: Behavioral Analytics & Data Visualization. In
this module, we transform raw user data into a visual story. The engineering
challenge is translating JSON response objects into interactive, responsive
graphics while maintaining the performance and aesthetic of a "Dark Mode"
dashboard.

📊 Module 5: Behavioral Analytics & Data Visualization

The Analytics.jsx component acts as a Data Interpretation Layer. It consumes the
aggregated manifest from the backend and utilizes Recharts to provide the user
with a mirror of their media consumption habits.

1. Genre Frequency Mapping: The BarChart Engine

Visualizing genre distribution is difficult because users often have dozens of
genres. A standard horizontal axis would lead to label overlapping.

The Technical Implementation

We use a Responsive BarChart with specific layout optimizations:

  - Label Management: To prevent "Label Crowding," we set the X-Axis angle={-45}
    and textAnchor="end". This allows the UI to display 10–15 genres
    side-by-side without overlapping text.
  - Dynamic Scaling: The YAxis is calculated automatically by Recharts based on
    the value field, ensuring that "Power Users" with 100+ items and "New Users"
    with 5 items both see proportional bars.
  - Themed Tooltips: We override the default Recharts tooltip with custom CSS
    (contentStyle) to match our dark theme, using #222 backgrounds and #0dcaf0
    text to maintain brand consistency.

2. Content Mix Analysis: The Donut Strategy

To visualize the balance between Movies and Anime, we use a Donut-style
PieChart.

Implementation Details

  - Aesthetic Configuration: By setting innerRadius={50} and outerRadius={70},
    we create a Donut chart rather than a solid Pie. This is visually "lighter"
    and fits the modern dashboard aesthetic.
  - Color Mapping: We iterate through a predefined COLORS array and apply them
    to Cell components. This ensures that "Movies" and "Anime" are always
    visually distinct.
  - Data Validation: We implement a check (typeData.some(d => d.value > 0)) to
    ensure the chart doesn't render as a broken empty circle if the user has a
    fresh account.

3. Progress Tracking: Milestone Visualization

While charts are great for trends, Progress Bars are better for visualizing
"Completion Status."

The Percentage Logic

Instead of the backend providing percentages, we calculate them on-the-fly in
the UI. This reduces the payload size and allows the UI to react to local state
changes:

const percentage = totalItems > 0 
  ? ((status.value / totalItems) * 100).toFixed(0) 
  : 0;

  - Contextual Color Coding: We map statuses to Bootstrap color classes:
      - Plan to Watch → bg-warning (Caution/Needs attention)
      - Currently Watching → bg-info (In progress)
      - Completed → bg-success (Success/Finished)

4. Automated Behavioral Insights: Data to Wisdom

The most "intelligent" part of this module is the Behavioral Insight Engine.
This isn't a static list; it's a logic-driven analysis of the chart data.

Derivative Analysis Patterns

1.  Mode Detection: We sort the genreData array locally to find the entry with
    the highest value: [...genreData].sort((a,b) => b.value - a.value)[0]?.name
    Result: "Favorite genre: Action."
2.  Saturation Alerts: We check the raw value of the "Plan to Watch" count. If
    it exceeds a specific threshold (e.g., 5 items), the UI changes its
    feedback: Result: "Plan to Watch list: Busy! Time to watch."
3.  Achievement Tracking: We extract the completedCount to provide positive
    reinforcement: Result: "Completed 45 titles."

5. Summary of the Analytics Manifest

| Visualization     | Data Target     | Interaction Logic                                |
| :---------------- | :-------------- | :----------------------------------------------- |
| **Bar Chart**     | Genre Frequency | Hover for exact counts; angled labels for scale. |
| **Donut Chart**   | Media Type Mix  | Legend-linked coloring for Movie vs. Anime.      |
| **Progress Bars** | Watch Status    | Calculated percentages; color-coded by intent.   |
| **Insight List**  | Derived Trends  | Logical "if/else" analysis of the data result.   |

6. Senior Developer Insights: UI Performance

Rendering three complex SVG charts simultaneously can be heavy on the Main
Thread. To optimize this, we:

  - ResponsiveContainer: Wrap all charts in ResponsiveContainer to ensure they
    re-calculate their width only when the window resizes, preventing redundant
    layout calculations.
  - Conditional Rendering: We use "Early Returns" to show a simple "Loading
    analysis..." message while the query is fetching, preventing Recharts from
    trying to render undefined data and throwing errors.

Next Step: Should we deep dive into Module 6: Security, Auth & Navigation
Guarding? This covers the critical OTP flow and how we protect these analytics
behind a ProtectedRoute.

This deep dive examines Module 6: Security, Auth & Navigation Guarding. This
module represents the "Security Gatekeeper" of the application. It ensures a
friction-less yet secure journey from registration to session persistence,
utilizing the latest patterns in React Router 6 and schema-based form
validation.

🔐 Module 6: Security, Auth & Navigation Guarding

The security architecture of WatchWise is built to handle Stateful
Authentication. We balance the strictness of server-side HttpOnly cookies with
the agility of client-side routing guards.

1. The Multi-Step Verification Pipeline (OTP Flow)

We move away from the "Instant Signup" model to a more secure Email-Verified
Registration. The challenge is maintaining user context during the jump from
Signup to VerifyOTP.

The Technical Handoff

1.  Signup Submission: The user submits the Signup form. The
    authApi.useRegisterMutation() is triggered.
2.  Incubation State: Upon success, the backend places the user in a "Pending"
    state and sends an OTP.
3.  UI Transition: The frontend navigates the user to /verify-otp.
4.  The Verification Guard: The VerifyOTP component provides a clean interface
    for the 6-digit code. It utilizes useVerifyOTPMutation() to finalize the
    account. By separating these steps, we ensure that our "Verified User"
    database is never cluttered with bots or mistyped emails.

2. Validation Engineering: Formik & Yup

For sensitive fields like passwords and emails, we avoid manual state
management. We use Formik for form lifecycle and Yup for declarative schema
validation.

The Validation Schema

We implement strict rules in the Login and Signup components:

  - Email Validation: Yup.string().email("Invalid email").required("Required").
  - Password Strength: We enforce minimum lengths (e.g., 6+ characters) to
    ensure user account integrity.
  - Recovery Flow: The ForgotPassword and ResetPassword features use these same
    schemas to ensure that a user doesn't reset their password to something
    invalid. The ResetPassword component specifically parses the :token from the
    URL via useParams, allowing the backend to verify the reset link's
    authenticity.

3. Layout-Level Protection: The "Outlet" Pattern

In legacy React apps, developers had to wrap every single page in a
<ProtectedRoute>. We use a more advanced Nested Layout Route pattern provided by
React Router 6.

The Architectural Implementation

In main.jsx, we define a "Private Zone" using a Layout Route:

{
  element: (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  ),
  children: [
    { path: "/movies", element: <Movies /> },
    { path: "/watchlist", element: <Watchlist /> },
    // ... all other protected pages
  ],
}

  - The Guard Logic: The ProtectedRoute.jsx component checks the Redux
    userReducer. If user.id is null, it triggers a <Navigate to="/login" replace
    />.
  - The Benefit: This is a Centralized Firewall. Any new page added to the
    children array is automatically protected without any extra code. It also
    prevents "Flash of Unprotected Content" (FOUC) during navigation.

4. Hydration & Persistence: Session Syncing

One of the biggest UX hurdles is the "Refresh Logout" problem. If a user
refreshes the page, the Redux state is wiped. We implement a Hydration Strategy
to prevent this.

Redux-to-LocalStorage Sync

1.  Initial State: When the store is created, it initializes the userSlice by
    checking localStorage.getItem("user").
2.  The "Sync" Hook: Inside the userSlice, the updateUser and logout actions are
    responsible for both updating the Redux state AND updating the localStorage
    string.
3.  The Security Nuance: We store the user identity (Username, Email, ID) in
    localStorage for UI purposes (displaying names), but we never store the JWT
    token there. The actual session remains safely locked in the HttpOnly
    cookie, which is not accessible to JavaScript.

5. Summary of the Security Manifest

| Feature          | Technical Solution              | Security Impact                        |
| :--------------- | :------------------------------ | :------------------------------------- |
| **Registration** | 2-Phase OTP Verification        | Eliminates bot/fake account creation.  |
| **Validation**   | Formik + Yup Schemas            | Prevents malformed data/SQLi attempts. |
| **Guarding**     | Nested Layout Routes (`Outlet`) | Centralized, foolproof access control. |
| **Persistence**  | LocalStorage Hydration          | Seamless UX across page refreshes.     |
| **Session**      | HttpOnly Cookies                | Immunity to XSS-based token theft.     |

6. Senior Developer Insights: Navigation UX

  - replace Navigation: When redirecting a non-logged-in user from /profile to
    /login, we use the replace flag. This ensures the user doesn't get stuck in
    a "Back Button Loop" where clicking back takes them to the protected page,
    which then pushes them back to login.
  - Toast feedback: We use react-hot-toast inside our authAPI onQueryStarted
    lifecycle to provide immediate visual feedback (e.g., "Login Successful!")
    which persists across the navigation event.

Next Step: Should we finalize with Module 7: UX Engineering & Performance
Optimization? This covers the "Polish" layer—Skeleton screens, Optimized Images,
and Responsive Grids.

This final deep dive explores Module 7: UX Engineering & Performance
Optimization. In this module, we focus on the "Perceived Performance" and
"Visual Stability" of the application. The goal is to ensure that WatchWise
feels like a high-end native app, maintaining a fluid 60FPS experience even
during heavy data hydration.

⚡ Module 7: UX Engineering & Performance Optimization

UX Engineering at WatchWise is centered around CLS (Cumulative Layout Shift)
Mitigation and Feedback Loops. We ensure the interface is predictable,
responsive, and resilient to network latency.

1. Layout Shift Prevention: The OptimizedImage Component

Images are the primary culprit for "Jumpy" UIs. When a browser doesn't know the
size of an image before it loads, it shifts the content below it, leading to a
poor user experience.

The Engineering Solution

We implemented a custom OptimizedImage component that acts as a Structural
Guard:

  - Aspect Ratio Locking: We use CSS aspect-ratio: 2/3 on the image containers.
    This tells the browser exactly how much space to "reserve" before the pixels
    even arrive from TMDB or Jikan.
  - Loading States: The component maintains a local isLoaded state. It displays
    a subtle gray placeholder until the onLoad event fires, at which point the
    image is transitioned in using a CSS fade-in animation.
  - Error Resilience: If an external API provides a broken image URL, the
    component catches the onError event and swaps the source for a local
    placeholder.jpg, preventing "broken icon" boxes from cluttering the UI.

2. Perceived Performance: The Skeleton Strategy

Standard loading spinners can be frustrating as they offer no context for what
is coming. We use Skeleton Screens to bridge the gap between "Request" and
"Render."

The MediaSkeleton Pattern

  - Structural Matching: The MediaSkeleton is engineered to perfectly match the
    height, width, and border-radius of the actual MovieCard.
  - Shine Animation: We use a linear-gradient background with a @keyframes
    loading animation. This "shimmer" effect provides visual confirmation that
    the app is active and working.
  - User Benefit: By rendering a grid of skeletons, we provide a visual hint of
    the page layout. This lowers the user's perceived wait time and
    significantly improves the First Contentful Paint (FCP) score in Core Web
    Vitals.

3. Responsive Grid Architecture: 6-to-2 Column Adaptive Flow

Displaying media posters requires a high-density grid that doesn't feel cramped
on small screens or sparse on large ones. We utilize Bootstrap 5’s Row-Cols
Utility for a fluid transition.

Breakpoint Optimization

We implement a specific responsive hierarchy in our media grids:

  - Extra Large (xl): 6 columns (Maximized density for 4K/Desktop).
  - Large (lg): 5 columns.
  - Medium (md): 4 columns.
  - Small (sm): 3 columns.
  - Mobile (xs): 2 columns (Ensures posters remain large enough to be legible
    on 375px screens).

<div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-2 g-md-4">

  - Gutter Scaling: We use g-2 on mobile to save horizontal space and g-4 on
    desktop to give the UI room to "breathe."

4. Toast Notification System: Feedback Orchestration

Every asynchronous action in the app (Add to Watchlist, Change Status, Login)
must have a Non-Blocking Feedback Loop.

Centralized react-hot-toast Config

We use a global <Toaster /> in App.jsx with a custom dark theme to match our
aesthetic:

  - Configuration:
    toastOptions={{ style: { background: '#333', color: '#fff' } }}
  - Integration: Toasts are triggered inside the handleToggle or handleUpdate
    functions of our components.
  - UX Impact: If a user adds an item to their watchlist from a long search
    list, they get an immediate "Added to Watchlist" confirmation at the
    top-right. This prevents the user from wondering if their click "worked,"
    effectively managing the Action-Feedback Interval.

5. Performance Summary & UX Manifest

| Optimization           | Technical Implementation          | Core Web Vital Impact                                      |
| :--------------------- | :-------------------------------- | :--------------------------------------------------------- |
| **CLS Mitigation**     | `aspect-ratio` + `OptimizedImage` | **CLS (Cumulative Layout Shift)** → Close to 0.            |
| **Skeleton Screens**   | CSS Keyframe Shimmer              | **LCP (Largest Contentful Paint)** → Perceived as instant. |
| **Adaptive Grid**      | Bootstrap 5 `row-cols`            | **Mobile Usability** → 100% responsive.                    |
| **Toast Engine**       | `react-hot-toast`                 | **UX Interactivity** → High responsiveness.                |
| **Asset Optimization** | TMDB `/w342/` vs `/w500/` paths   | **Load Time** → Saves \~30% bandwidth per image.           |

6. Senior Developer Final Thoughts: The Polish Layer

This module is what separates a "Project" from a "Product." By focusing on CLS,
skeletons, and adaptive grids, we've built a frontend that is:

1.  Stable: No jumping content.
2.  Fast: Perceived performance is optimized via skeletons and optimistic
    updates.
3.  Accessible: Grid density adapts to the hardware being used.

---------------------------------------------------------------------------------------------------------------

<!-- # WatchWise - Frontend

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
-->