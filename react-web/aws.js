const AWS_API_BASE_URL = import.meta.env.VITE_AWS_API_BASE_URL;

export const getTrendingMovies = async () => {
    try {
        const API_URL = `${AWS_API_BASE_URL}movie-metrics`;
        const API_OPTIONS = {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const response = await fetch(API_URL, API_OPTIONS);

        if(!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json();
    } catch (error) {
        console.error(error);
    }
}

export const updateSearchCount = async (searchTerm, movie) => {
    try {
        const API_URL = `${AWS_API_BASE_URL}movie-metrics`;
        const API_OPTION = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                SearchString: searchTerm,
                MovieId: movie.id,
                PosterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            })
        }
        await fetch(API_URL, API_OPTION);
    } catch (error) {
        console.error(error);
    }
}