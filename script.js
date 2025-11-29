// ==========================================
// CONFIG: TMDb API
// ==========================================

// TODO: Replace this with your real TMDb API key
// Create an account at https://www.themoviedb.org/ to get an API key
const API_KEY = "c9db2a42a86afb8eb5ce9aa08263970c";

// TMDb base URLs
const API_BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

// ==========================================
// DOM ELEMENTS
// ==========================================
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const movieGrid = document.getElementById("movie-grid");
const statusMessage = document.getElementById("status-message");

// Run when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Optional: show some default movies on load (popular)
  fetchPopularMovies();
});

// Handle search form submit
if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stop page reload

    const query = searchInput.value.trim();
    if (!query) {
      showStatus("Type a movie name to search.");
      clearMovies();
      return;
    }

    searchMovies(query);
  });
}

// ==========================================
// API CALLS
// ==========================================

// Fetch popular movies on first load
function fetchPopularMovies() {
  showStatus("Loading popular movies...");
  clearMovies();

  const url = `${API_BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error: " + res.status);
      return res.json();
    })
    .then((data) => {
      const movies = data.results || [];
      if (!movies.length) {
        showStatus("No movies found.");
        return;
      }
      showStatus(""); // clear message
      renderMovies(movies);
    })
    .catch((error) => {
      console.error("Error fetching popular movies:", error);
      showStatus("Could not load popular movies. Check console.");
    });
}

// Search movies by text query
function searchMovies(query) {
  showStatus(`Searching for "${query}"...`);
  clearMovies();

  const url = `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
    query
  )}&language=en-US&page=1&include_adult=false`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error: " + res.status);
      return res.json();
    })
    .then((data) => {
      const movies = data.results || [];
      if (!movies.length) {
        showStatus(`No results found for "${query}".`);
        return;
      }
      showStatus(`Showing results for "${query}":`);
      renderMovies(movies);
    })
    .catch((error) => {
      console.error("Error searching movies:", error);
      showStatus("Something went wrong while searching. Check console.");
    });
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

// Clear all movie cards
function clearMovies() {
  if (movieGrid) {
    movieGrid.innerHTML = "";
  }
}

// Render a list of movie objects into cards
function renderMovies(movies) {
  if (!movieGrid) return;

  clearMovies();

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    movieGrid.appendChild(card);
  });
}

// Create one movie card element from a TMDb movie
function createMovieCard(movie) {
  const {
    id,
    title,
    vote_average,
    poster_path,
  } = movie;

  // Build poster URL (or fallback if no poster)
  const posterUrl = poster_path
    ? `${IMG_BASE_URL}${poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  const rating = typeof vote_average === "number"
    ? vote_average.toFixed(1)
    : "N/A";

  // Outer article
  const card = document.createElement("article");
  card.className = "movie-card";
  card.id = `movie-card-${id}`;
  card.setAttribute("role", "listitem");

  // Poster wrapper
  const posterWrapper = document.createElement("div");
  posterWrapper.className = "movie-poster-wrapper";

  const img = document.createElement("img");
  img.className = "movie-poster";
  img.src = posterUrl;
  img.alt = `${title || "Movie"} poster`;

  const overlay = document.createElement("div");
  overlay.className = "movie-poster-overlay";

  posterWrapper.appendChild(img);
  posterWrapper.appendChild(overlay);

  // Info area (title + rating)
  const info = document.createElement("div");
  info.className = "movie-info";

  const titleEl = document.createElement("h3");
  titleEl.className = "movie-title";
  titleEl.id = `movie-title-${id}`;
  titleEl.textContent = title || "Untitled";

  const ratingRow = document.createElement("div");
  ratingRow.className = "movie-rating";
  ratingRow.id = `movie-rating-${id}`;

  const starSpan = document.createElement("span");
  starSpan.className = "movie-star";
  starSpan.textContent = "★";

  const ratingSpan = document.createElement("span");
  ratingSpan.className = "movie-rating-value";
  ratingSpan.textContent = rating;

  ratingRow.appendChild(starSpan);
  ratingRow.appendChild(ratingSpan);

  info.appendChild(titleEl);
  info.appendChild(ratingRow);

  // Put together
  card.appendChild(posterWrapper);
  card.appendChild(info);

  return card;
}

// ==========================================
// UI HELPERS
// ==========================================

// Show a status / info message above the grid
function showStatus(message) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
}
