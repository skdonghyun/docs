import React from 'react';
import Layout from '@theme/Layout';
import SearchResults from '@site/src/components/SearchResults';

function SearchResultsPage() {
    return (
        <Layout title="Search Results">
            <main className="container margin-vert--lg">
                <SearchResults />
            </main>
        </Layout>
    );
}

export default SearchResultsPage;