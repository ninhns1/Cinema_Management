import { useState } from "react";
import { HeaderBar } from "../../components/home/HeaderBar";
import { HeroBanner } from "../../components/home/HeroBanner";
import { PopularMoviesSection } from "../../components/home/PopularMoviesSection";
import { ExploreEventsSection } from "../../components/home/ExploreEventsSection";
import { BookingModal } from "../../components/checkout/BookingModal";
import { MyTicketsPage } from "./MyTicketsPage";

const movies = [
  {
    id: "movie-1",
    title: "Maa",
    genre: "Fantasy/Horror/Thriller",
    rating: "7.2 - 2.7K votes",
    poster: "/assets/posters/maa.svg",
    showtimeKey: "maa-2026-08-19",
  },
  {
    id: "movie-2",
    title: "Kannappa",
    genre: "Action/Drama/Fantasy",
    rating: "7.3 - 10.7K votes",
    poster: "/assets/posters/kannappa.svg",
    showtimeKey: "kannappa-2026-08-19",
  },
  {
    id: "movie-3",
    title: "Mission: Impossible",
    genre: "Action/Adventure/Thriller",
    rating: "8.6 - 84.1K votes",
    poster: "/assets/posters/mission.svg",
    showtimeKey: "mi-2026-08-19",
  },
  {
    id: "movie-4",
    title: "F1: The Movie",
    genre: "Action/Drama/Sports",
    rating: "9.5 - 6.8K votes",
    poster: "/assets/posters/f1.svg",
    showtimeKey: "f1-2026-08-19",
  },
  {
    id: "movie-5",
    title: "Ballerina",
    genre: "Action/Thriller",
    rating: "8.7 - 15.2K votes",
    poster: "/assets/posters/ballerina.svg",
    showtimeKey: "ballerina-2026-08-19",
  },
];

const events = [
  { id: "event-1", title: "Comedy Shows", count: "205+ Events", banner: "/assets/events/comedy.svg" },
  { id: "event-2", title: "Amusement Park", count: "20+ Events", banner: "/assets/events/amusement.svg" },
  { id: "event-3", title: "Theatre Shows", count: "80+ Events", banner: "/assets/events/theatre.svg" },
  { id: "event-4", title: "Kids", count: "25+ Events", banner: "/assets/events/kids.svg" },
  { id: "event-5", title: "Music Shows", count: "10+ Events", banner: "/assets/events/music.svg" },
];

const demoUserId = "user-001";

export function CustomerHomePage() {
  const [currentPage, setCurrentPage] = useState("home");
  const [movieForBooking, setMovieForBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  function showSuccessToast(message) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  }

  return (
    <main className="home-page">
      <HeaderBar
        currentPage={currentPage}
        onNavigateHome={() => setCurrentPage("home")}
        onNavigateTickets={() => setCurrentPage("tickets")}
      />

      {currentPage === "home" ? (
        <section className="home-content">
          <HeroBanner />
          <PopularMoviesSection movies={movies} onBookNow={setMovieForBooking} />
          <ExploreEventsSection events={events} />
        </section>
      ) : (
        <section className="home-content">
          <MyTicketsPage userId={demoUserId} onPaidSuccess={showSuccessToast} />
        </section>
      )}

      {movieForBooking ? (
        <BookingModal
          movie={movieForBooking}
          userId={demoUserId}
          onClose={() => setMovieForBooking(null)}
          onPaymentSuccess={showSuccessToast}
        />
      ) : null}

      {toastMessage ? <div className="success-toast">{toastMessage}</div> : null}
    </main>
  );
}
