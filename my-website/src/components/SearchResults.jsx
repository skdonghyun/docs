import React, { useState, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { usePluginData } from '@docusaurus/useGlobalData';
import LunrSearchAdapter from '../components/LunrSearchAdapter';

function SearchResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const { siteConfig } = useDocusaurusContext();
    const { indexHash } = usePluginData('docusaurus-lunr-search');
    const [searchAdapter, setSearchAdapter] = useState(null);

    useEffect(() => {
        const loadSearchData = async () => {
            try {
                const [searchIndexData, searchDocumentData] = await Promise.all([
                    fetch(`/lunr-index.json`).then(res => res.json()),
                    fetch(`/search-doc.json`).then(res => res.json())
                ]);
                
                const adapter = new LunrSearchAdapter(searchDocumentData, searchIndexData);
                setSearchAdapter(adapter);
            } catch (error) {
                console.error('Error loading search data:', error);
            }
        };

        loadSearchData();
    }, [indexHash]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('q');

        if (query && searchAdapter) {
            performSearch(query);
        }
    }, [location, searchAdapter]);

    const performSearch = async (query) => {
        setLoading(true);
        try {
            const searchResults = await searchAdapter.search(query);
            
            const formattedResults = searchResults.map(result => ({
                system: result.system,
                category: result.hierarchy?.lvl0 || '',
                title: result.hierarchy?.lvl1 || result.hierarchy?.lvl0 || '',
                url: result.url,
                snippet: highlightSearchTerms(result._snippetResult?.content?.value || '', query),
            }));

            setResults(formattedResults);
        } catch (error) {
            console.error('Error performing search:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const highlightSearchTerms = (content, query) => {
        const words = query.split(' ');
        words.forEach(word => {
            const regex = new RegExp(word, 'gi');
            content = content.replace(regex, match => `<mark>${match}</mark>`);
        });
        return content;
    };

    return (
        <div className="search-results">
            <h1>Search Results</h1>
            {results.length === 0 ? (
                <p>No results found.</p>
            ) : (
                <ul>
                    {results.map((result, index) => (
                        <li key={index}>
                            <div className="search-result-system">{result.system}</div>
                            <div className="search-result-category">{result.category}</div>
                            <a href={`${siteConfig.baseUrl}${result.url}`}>{result.title}</a>
                            <p dangerouslySetInnerHTML={{ __html: result.snippet }}></p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchResults;