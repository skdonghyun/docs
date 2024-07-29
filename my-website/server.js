const express = require('express');
const path = require('path');
const LunrSearchAdapter = require('./src/theme/SearchBar/LunrSearchAdapter');

const app = express();
const port = process.env.PORT || 3000;

// Initialize your LunrSearchAdapter
const searchAdapter = new LunrSearchAdapter(/* your configuration here */);

// Serve static files from the Docusaurus build
app.use(express.static(path.join(__dirname, 'build')));

// API endpoint for search
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    try {
        const results = await searchAdapter.search(query);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while searching' });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back Docusaurus's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});