// client/src/components/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function SearchResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('q');

        if (query) {
            fetchSearchResults(query);
        }
    }, [location]);

    const fetchSearchResults = async (query) => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Search request failed');
            }
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="search-results">
            <h1>Search Results</h1>
            {results.length === 0 ? (
                <p>No results found.</p>
            ) : (
                <ul>
                    {results.map((result, index) => (
                        <li key={index}>
                            <a href={result.url}>{result.title}</a>
                            <p>{result.text}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchResults;