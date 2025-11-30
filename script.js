// ==========================================
// CONFIG: TMDb API
// ==========================================

// TODO: Replace this with your real TMDb API key
const API_KEY = "c9db2a42a86afb8eb5ce9aa08263970c";

// TMDb base URLs
const API_BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

// We'll store the list of genres here after we fetch them
let genresList = [];

// We'll store whatever movies are currently loaded (popular / search / genre)
let currentMovies = [];

// ==========================================
// DOM ELEMENTS
// ==========================================
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const movieGrid = document.getElementById("movie-grid");
const statusMessage = document.getElementById("status-message");
const genreSelect = document.getElementById("genre-select");
const sortSelect = document.getElementById("sort-select");

// ==========================================
// INITIALIZE APP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Load popular movies by default
  fetchPopularMovies();

  // Load genres and fill the dropdown
  fetchGenres();
});

// Handle search form submit
if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stop page reload

    const query = searchInput.value.trim();
    if (!query) {
      showStatus("Type a movie name to search.");
      clearMovies();
      currentMovies = [];
      return;
    }

    searchMovies(query);
  });
}

// Handle genre change
if (genreSelect) {
  genreSelect.addEventListener("change", () => {
    const selectedGenreId = genreSelect.value;

    // Reset search input when changing genres (optional)
    if (searchInput) searchInput.value = "";

    // If user chooses "All genres" (empty value), show popular again
    if (!selectedGenreId) {
      fetchPopularMovies();
      return;
    }

    fetchMoviesByGenre(selectedGenreId);
  });
}

// Handle sort change
if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    applySortAndRender();
  });
}

// ==========================================
// API CALLS
// ==========================================

// Fetch list of genres (Action, Comedy, etc.)
function fetchGenres() {
  const url = `${API_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error: " + res.status);
      return res.json();
    })
    .then((data) => {
      genresList = data.genres || [];
      populateGenreSelect(genresList);
    })
    .catch((error) => {
      console.error("Error fetching genres:", error);
      // If this fails, the dropdown will just stay as "All genres"
    });
}

// Fill the <select> with genre options
function populateGenreSelect(genres) {
  if (!genreSelect) return;

  // Keep the first "All genres" option, clear the rest
  genreSelect.innerHTML = '<option value="">All genres</option>';

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre.id; // we'll use this ID in the API call
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });
}

// Fetch popular movies on first load or when resetting
function fetchPopularMovies() {
  showStatus("Loading popular movies...");
  clearMovies();
  currentMovies = [];

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
      currentMovies = movies;
      showStatus("Popular movies:");
      applySortAndRender();
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
  currentMovies = [];

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
      currentMovies = movies;
      showStatus(`Showing results for "${query}":`);
      applySortAndRender();
    })
    .catch((error) => {
      console.error("Error searching movies:", error);
      showStatus("Something went wrong while searching. Check console.");
    });
}

// Fetch movies by genre
function fetchMoviesByGenre(genreId) {
  // Find genre name for nicer status text
  let genreName = "selected genre";
  const found = genresList.find((g) => String(g.id) === String(genreId));
  if (found) genreName = found.name;

  showStatus(`Loading ${genreName} movies...`);
  clearMovies();
  currentMovies = [];

  const url = `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&page=1&with_genres=${genreId}&sort_by=popularity.desc`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error: " + res.status);
      return res.json();
    })
    .then((data) => {
      const movies = data.results || [];
      if (!movies.length) {
        showStatus(`No ${genreName} movies found.`);
        return;
      }
      currentMovies = movies;
      showStatus(`${genreName} movies:`);
      applySortAndRender();
    })
    .catch((error) => {
      console.error("Error fetching movies by genre:", error);
      showStatus("Could not load movies for this genre. Check console.");
    });
}

// ==========================================
// SORT + RENDER
// ==========================================

// Apply current sort option to currentMovies and render
function applySortAndRender() {
  if (!movieGrid) return;

  // Copy the array so we don't mutate currentMovies directly
  let moviesToRender = [...currentMovies];

  if (sortSelect && sortSelect.value) {
    if (sortSelect.value === "rating-desc") {
      // High → Low
      moviesToRender.sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
      );
    } else if (sortSelect.value === "rating-asc") {
      // Low → High
      moviesToRender.sort(
        (a, b) => (a.vote_average || 0) - (b.vote_average || 0)
      );
    }
  }

  renderMovies(moviesToRender);
}

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

// Create one movie card element from a TMDb movie object
function createMovieCard(movie) {
  const { id, title, vote_average, poster_path } = movie;

  // Build poster URL (or fallback if no poster)
  const posterUrl = poster_path
    ? `${IMG_BASE_URL}${poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  const rating =
    typeof vote_average === "number" ? vote_average.toFixed(1) : "N/A";

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
