import React, {useEffect, useState} from 'react'
import { useDebounce } from 'react-use'
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { getTrendingMovies, updateSearchCount } from "../aws.js";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3/";

const TMDB_AP_KEY = import.meta.env.VITE_TMDB_API_KEY;

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [trendingMovies, setTrendingMovies] = useState([]);

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage("")
        try {
            const API_URL = query ?
                `${TMDB_API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`:
                `${TMDB_API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`;
            const API_OPTIONS = {
                method: "GET",
                headers: {
                    "content-type": "application/json",
                    "Authorization": `Bearer ${TMDB_AP_KEY}`
                }
            }
            const response = await fetch(API_URL, API_OPTIONS);

            if(!response.ok){
                throw new Error("Something went wrong while fetching movies");
            }
            const data = await response.json();
            setMovieList(data.results);

            if(query && data.results.length > 0) {
                await updateSearchCount(searchTerm, data.results[0]);
            }
        } catch (error) {
            setErrorMessage(`Something went wrong while fetching movies, ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    const fetchTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            console.log(movies);
            setTrendingMovies(movies);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
            fetchMovies(debouncedSearchTerm);
        }, [debouncedSearchTerm]
    )

    useEffect(() => {
        fetchTrendingMovies();
    }, [])

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>Find the <span className="text-gradient">Movies</span> you will enjoy without Hassle</h1>

                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {
                                trendingMovies.slice(0,5).map((movie, index) => (
                                    <li key={movie.MovieId}>
                                        <p>{index + 1}</p>
                                        <img src={movie.PosterUrl} alt={movie.title} />
                                    </li>
                                ))
                            }
                        </ul>
                    </section>
                    )
                }

                <section className="all-movies">
                    <h2>All Movies</h2>

                    {
                        isLoading ? (
                            <p className="text-white">Loading...</p>
                        ) : errorMessage ? (
                            <p className="text-red-500">{errorMessage}</p>
                        ) : (
                            <ul>
                                {movieList.map((movie) => (
                                    <MovieCard key={movie.id} movie={movie}/>
                                ))}
                            </ul>
                        )
                    }
                </section>
            </div>
        </main>
    )
}
export default App
