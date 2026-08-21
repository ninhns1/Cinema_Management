import { useState } from "react";
import { AuthModal } from "../../components/AuthModal";
import { HeaderBar } from "../../components/home/HeaderBar";
import { HeroBanner } from "../../components/home/HeroBanner";
import { PopularMoviesSection } from "../../components/home/PopularMoviesSection";
import TrailerModal from "../../components/movies/TrailerModal";
import { MovieDetailModal } from "../../components/movies/MovieDetailModal";
import { ExploreEventsSection } from "../../components/home/ExploreEventsSection";
import { Footer } from "../../components/home/Footer";
import { BookingModal } from "../../components/checkout/BookingModal";
import { clearAuthSession, getStoredUser, getRefreshToken } from "../../services/apiClientFixed";
import { authApi } from "../../services/apiClientFixed";
import { MyTicketsPage } from "./MyTicketsPage";
import { AdminDashboardPage } from "../admin/AdminDashboardPage";

const movies = [
  {
    id: "movie-1",
    title: "Dune: Part Two",
    genre: "Sci-Fi / Adventure / Drama",
    rating: "8.8 - 125K votes",
    poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    showtimeKey: "dune-2026-08-19",
    duration: "166 min",
    releaseDate: "2024",
  },
  {
    id: "movie-2",
    title: "Oppenheimer",
    genre: "Drama / Biography / History",
    rating: "8.9 - 98K votes",
    poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/rLb2cs785pePbIKYQz1ApJ727gV.jpg",
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    showtimeKey: "oppenheimer-2026-08-19",
    duration: "180 min",
    releaseDate: "2023",
  },
  {
    id: "movie-3",
    title: "Spider-Man: Across the Spider-Verse",
    genre: "Animation / Action / Adventure",
    rating: "8.7 - 89K votes",
    poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    trailerUrl: "https://www.youtube.com/embed/shW9i6k8cB0",
    showtimeKey: "spider-2026-08-19",
    duration: "140 min",
    releaseDate: "2023",
  },
  {
    id: "movie-4",
    title: "The Batman",
    genre: "Action / Crime / Drama",
    rating: "8.1 - 76K votes",
    poster: "https://image.tmdb.org/t/p/w500/5P8SmMzSNYikXpxil6BYzJ16611.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpOqQdH4.jpg",
    trailerUrl: "https://www.youtube.com/embed/mqqft2x_Aa4",
    showtimeKey: "batman-2026-08-19",
    duration: "176 min",
    releaseDate: "2022",
  },
  {
    id: "movie-5",
    title: "Top Gun: Maverick",
    genre: "Action / Drama",
    rating: "8.3 - 92K votes",
    poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/odJ4HXbE9LWnl8fKTdQ0llKX9PO.jpg",
    trailerUrl: "https://www.youtube.com/embed/qSqVVswaSXU",
    showtimeKey: "topgun-2026-08-19",
    duration: "131 min",
    releaseDate: "2022",
  },
  {
    id: "movie-6",
    title: "Avatar: The Way of Water",
    genre: "Sci-Fi / Action / Adventure",
    rating: "7.8 - 110K votes",
    poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
    trailerUrl: "https://www.youtube.com/embed/d9MyW72ELq0",
    showtimeKey: "avatar-2026-08-19",
    duration: "192 min",
    releaseDate: "2022",
  },
  {
    id: "movie-7",
    title: "John Wick: Chapter 4",
    genre: "Action / Thriller / Crime",
    rating: "8.2 - 78K votes",
    poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2u89.jpg",
    trailerUrl: "https://www.youtube.com/embed/qEVUtrk8_B4",
    showtimeKey: "johnwick-2026-08-19",
    duration: "169 min",
    releaseDate: "2023",
  },
  {
    id: "movie-8",
    title: "Barbie",
    genre: "Comedy / Adventure / Fantasy",
    rating: "7.4 - 95K votes",
    poster: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/nHf61UzkfFno5dHMNX5qMpfO3pS.jpg",
    trailerUrl: "https://www.youtube.com/embed/pu5pxJzF_3k",
    showtimeKey: "barbie-2026-08-19",
    duration: "114 min",
    releaseDate: "2023",
  },
  {
    id: "movie-9",
    title: "Interstellar",
    genre: "Sci-Fi / Adventure / Drama",
    rating: "8.7 - 156K votes",
    poster: "https://image.tmdb.org/t/p/w500/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    showtimeKey: "interstellar-2026-08-19",
    duration: "169 min",
    releaseDate: "2014",
  },
  {
    id: "movie-10",
    title: "The Dark Knight",
    genre: "Action / Crime / Drama",
    rating: "9.0 - 210K votes",
    poster: "https://image.tmdb.org/t/p/w500/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    trailerUrl: "https://www.youtube.com/embed/EXeTwQWrcwY",
    showtimeKey: "darkknight-2026-08-19",
    duration: "152 min",
    releaseDate: "2008",
  },
  {
    id: "movie-11",
    title: "Inception",
    genre: "Sci-Fi / Action / Thriller",
    rating: "8.8 - 178K votes",
    poster: "https://image.tmdb.org/t/p/w500/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    trailerUrl: "https://www.youtube.com/embed/YoHD9XEInc0",
    showtimeKey: "inception-2026-08-19",
    duration: "148 min",
    releaseDate: "2010",
  },
  {
    id: "movie-12",
    title: "Avengers: Endgame",
    genre: "Action / Sci-Fi / Adventure",
    rating: "8.4 - 195K votes",
    poster: "https://image.tmdb.org/t/p/w500/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    trailerUrl: "https://www.youtube.com/embed/TcMBFSGVi1c",
    showtimeKey: "avengers-2026-08-19",
    duration: "181 min",
    releaseDate: "2019",
  },
  {
    id: "movie-13",
    title: "Joker",
    genre: "Crime / Drama / Thriller",
    rating: "8.4 - 145K votes",
    poster: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YMDNqKDs.jpg",
    trailerUrl: "https://www.youtube.com/embed/zAGVQLHvwOY",
    showtimeKey: "joker-2026-08-19",
    duration: "122 min",
    releaseDate: "2019",
  },
  {
    id: "movie-14",
    title: "Parasite",
    genre: "Thriller / Drama / Comedy",
    rating: "8.5 - 98K votes",
    poster: "https://image.tmdb.org/t/p/w500/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    trailerUrl: "https://www.youtube.com/embed/5xH0HfJHsaY",
    showtimeKey: "parasite-2026-08-19",
    duration: "132 min",
    releaseDate: "2019",
  },
  {
    id: "movie-15",
    title: "The Matrix",
    genre: "Sci-Fi / Action",
    rating: "8.7 - 167K votes",
    poster: "https://image.tmdb.org/t/p/w500/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
    trailerUrl: "https://www.youtube.com/embed/vKQi3bBA1y8",
    showtimeKey: "matrix-2026-08-19",
    duration: "136 min",
    releaseDate: "1999",
  },
  {
    id: "movie-16",
    title: "Gladiator II",
    genre: "Action / Adventure / Drama",
    rating: "8.1 - 45K votes",
    poster: "https://image.tmdb.org/t/p/w500/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    trailerUrl: "https://www.youtube.com/embed/Q6XwqE6k8k0",
    showtimeKey: "gladiator-2026-08-19",
    duration: "148 min",
    releaseDate: "2024",
  },
  {
    id: "movie-17",
    title: "Poor Things",
    genre: "Comedy / Drama / Romance",
    rating: "8.0 - 52K votes",
    poster: "https://image.tmdb.org/t/p/w500/bQS43HSLZzMjZkcHJz4fGc7fNdz.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/bQS43HSLZzMjZkcHJz4fGc7fNdz.jpg",
    trailerUrl: "https://www.youtube.com/embed/RmR94e4j9kQ",
    showtimeKey: "poorthings-2026-08-19",
    duration: "141 min",
    releaseDate: "2023",
  },
  {
    id: "movie-18",
    title: "Killers of the Flower Moon",
    genre: "Crime / Drama / History",
    rating: "7.9 - 48K votes",
    poster: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/kf5NCuoCvEqNBs8LgqN3F1dHdV3.jpg",
    trailerUrl: "https://www.youtube.com/embed/EqCX1Kjx8nU",
    showtimeKey: "killers-2026-08-19",
    duration: "206 min",
    releaseDate: "2023",
  },
  {
    id: "movie-19",
    title: "Godzilla x Kong: The New Empire",
    genre: "Action / Sci-Fi / Adventure",
    rating: "7.2 - 38K votes",
    poster: "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/veIy6Oz3UYg65C9L9X7X9q9q9q9.jpg",
    trailerUrl: "https://www.youtube.com/embed/qoOLXsJf8f0",
    showtimeKey: "godzilla-2026-08-19",
    duration: "115 min",
    releaseDate: "2024",
  },
  {
    id: "movie-20",
    title: "Deadpool & Wolverine",
    genre: "Action / Comedy / Sci-Fi",
    rating: "7.8 - 65K votes",
    poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/ls9VvSCcOZpD9q7q7q7q7q7q7q7.jpg",
    trailerUrl: "https://www.youtube.com/embed/390sWuF_sYg",
    showtimeKey: "deadpool-2026-08-19",
    duration: "127 min",
    releaseDate: "2024",
  },
];

const events = [
  { id: "event-1", title: "Comedy Shows", count: "205+ Events", banner: "/assets/events/comedy.svg" },
  { id: "event-2", title: "Amusement Park", count: "20+ Events", banner: "/assets/events/amusement.svg" },
  { id: "event-3", title: "Theatre Shows", count: "80+ Events", banner: "/assets/events/theatre.svg" },
  { id: "event-4", title: "Kids", count: "25+ Events", banner: "/assets/events/kids.svg" },
  { id: "event-5", title: "Music Shows", count: "10+ Events", banner: "/assets/events/music.svg" },
];

export function CustomerHomePage() {
  const [currentPage, setCurrentPage] = useState("home");
  const [authUser, setAuthUser] = useState(getStoredUser());
  const [movieForBooking, setMovieForBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  function showSuccessToast(message) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  }

  function openAuthModal(nextAction = null) {
    setPendingAction(nextAction);
    setAuthModalOpen(true);
  }

  function handleAuthSuccess(user) {
    setAuthUser(user);
    setAuthModalOpen(false);

    if (pendingAction?.type === "booking" && pendingAction.movie) {
      setMovieForBooking(pendingAction.movie);
    }

    if (pendingAction?.type === "tickets") {
      setCurrentPage("tickets");
    }

    setPendingAction(null);
  }

  async function handleLogout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authApi.post("/logout", { refreshToken });
      }
    } catch (_e) {
      // ignore
    }

    clearAuthSession();
    setAuthUser(null);
    setMovieForBooking(null);
    setCurrentPage("home");
  }

  function handleBookNow(movie) {
    if (!authUser) {
      openAuthModal({ type: "booking", movie });
      return;
    }
    setMovieForBooking(movie);
  }

  function handleNavigateTickets() {
    if (!authUser) {
      openAuthModal({ type: "tickets" });
      return;
    }
    setCurrentPage("tickets");
  }

  const [trailerMovie, setTrailerMovie] = useState(null);

  function handleOpenTrailer(movie) {
    setSelectedMovie(movie);
  }

  function handleCloseTrailer() {
    setTrailerMovie(null);
  }

  function handleCloseDetail() {
    setSelectedMovie(null);
  }

  return (
    <main className="home-page">
      <HeaderBar
        currentPage={currentPage}
        authUser={authUser}
        onNavigateHome={(page) => {
          if (page === "admin") return setCurrentPage("admin");
          setCurrentPage("home");
        }}
        onNavigateTickets={handleNavigateTickets}
        onOpenAuth={() => openAuthModal()}
        onLogout={handleLogout}
      />

      {currentPage === "home" ? (
        <section className="home-content">
          <HeroBanner />
          <PopularMoviesSection movies={movies} onBookNow={handleBookNow} onPosterClick={handleOpenTrailer} />
          <ExploreEventsSection events={events} />
          <Footer />
        </section>
      ) : currentPage === "tickets" ? (
        <section className="home-content">
          <MyTicketsPage userId={authUser?.id || null} onPaidSuccess={showSuccessToast} />
          <Footer />
        </section>
      ) : currentPage === "admin" ? (
        <section className="home-content">
          <AdminDashboardPage />
          <Footer />
        </section>
      ) : null}

      {movieForBooking && authUser ? (
        <BookingModal
          movie={movieForBooking}
          userId={authUser.id}
          onClose={() => setMovieForBooking(null)}
          onPaymentSuccess={showSuccessToast}
        />
      ) : null}

      {authModalOpen ? (
        <AuthModal
          onClose={() => {
            setAuthModalOpen(false);
            setPendingAction(null);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      ) : null}

      {selectedMovie ? (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={handleCloseDetail}
          onBookNow={handleBookNow}
        />
      ) : null}

      {toastMessage ? <div className="success-toast">{toastMessage}</div> : null}
    </main>
  );
}
