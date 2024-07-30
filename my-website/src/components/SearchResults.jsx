import React, { useRef, useCallback, useState, useEffect } from "react";
import { useHistory, useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { usePluginData } from '@docusaurus/useGlobalData';
import useIsBrowser from "@docusaurus/useIsBrowser";
import LunrSearchAdapter from '@site/src/theme/SearchBar/lunar-search';

function SearchResults() {
  const initialized = useRef(false);
  const [indexReady, setIndexReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const history = useHistory();
  const location = useLocation();
  const { siteConfig = {} } = useDocusaurusContext();
  const isBrowser = useIsBrowser();
  const { baseUrl } = siteConfig;
  const searchClientRef = useRef(null);

  const initSearchClient = useCallback((searchDocs, searchIndex, options) => {
    searchClientRef.current = new LunrSearchAdapter(searchDocs, searchIndex, baseUrl, options);
  }, [baseUrl]);

  const pluginData = usePluginData('docusaurus-lunr-search');
  const getSearchDoc = useCallback(() =>
    process.env.NODE_ENV === "production"
      ? fetch(`${baseUrl}${pluginData.fileNames.searchDoc}`).then((content) => content.json())
      : Promise.resolve([]),
    [baseUrl, pluginData]
  );

  const getLunrIndex = useCallback(() =>
    process.env.NODE_ENV === "production"
      ? fetch(`${baseUrl}${pluginData.fileNames.lunrIndex}`).then((content) => content.json())
      : Promise.resolve([]),
    [baseUrl, pluginData]
  );

  const loadAlgolia = useCallback(() => {
    if (!initialized.current) {
      Promise.all([
        getSearchDoc(),
        getLunrIndex(),
      ]).then(([searchDocs, searchIndex]) => {
        if (!searchDocs || searchDocs.length === 0) {
          return;
        }
        initSearchClient(searchDocs, searchIndex, {
          highlightResult: true,
          maxHits: 100
        });
        setIndexReady(true);
      });
      initialized.current = true;
    }
  }, [getSearchDoc, getLunrIndex, initSearchClient]);

  useEffect(() => {
    if (isBrowser) {
      loadAlgolia();
    }
  }, [isBrowser, loadAlgolia]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');
    setSearchQuery(query);

    if (query && indexReady && searchClientRef.current) {
      performSearch(query);
    }
  }, [location.search, indexReady]);

  const performSearch = async (query) => {
    if (!searchClientRef.current) {
      console.warn('Search client is not initialized');
      return;
    }
    try {
      const results = await searchClientRef.current.searchAll(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchItemClick = useCallback((item) => {
    const { url } = item;
    history.push(url);
  }, [history]);

  if (!indexReady) {
    return <div>Loading search index...</div>;
  }

  return (
    <div className="search-results-container">
      <h1>Search Results for: {searchQuery}</h1>
      {searchResults.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <>
          <p>Total results: {searchResults.length}</p>
          {searchResults.map((result, index) => (
            <div key={index} className="search-result-item" onClick={() => handleSearchItemClick(result)}>
              <h2>{result.title}</h2>
              {result.hierarchy && result.hierarchy.lvl1 && <p>{result.hierarchy.lvl1}</p>}
              {result._snippetResult?.content?.value && (
                <p dangerouslySetInnerHTML={{ __html: result._snippetResult.content.value }} />
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default SearchResults;