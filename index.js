const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

const JSON_FILE = 'audiovault_entries.json';

const main = async () => {
    const options = {
        method: 'GET',
        url: 'https://www.audiovault.net/',
        headers: {
            'cache-control': 'no-cache',
        }
    };

    try {
        const response = await axios.request(options);
        await retrieveTableItemsWithCheerio(response.data);
    } catch (error) {
        console.error(error);
    }
}

const retrieveTableItemsWithCheerio = async (audiovaultHTMLString) => {
    let movies = [];
    let shows = [];

    const $ = cheerio.load(audiovaultHTMLString);

    $('table').eq(0).find('tr').slice(1).each(function (i, elem) {
        const id = $(this).children().eq(0).text().trim();
        const name = $(this).children().eq(1).text().trim();

        if (id && name) {
            shows.push({
                id: id,
                name: name,
            });
        }
    });

    $('table').eq(1).find('tr').slice(1).each(function (i, elem) {
        const id = $(this).children().eq(0).text().trim();
        const name = $(this).children().eq(1).text().trim();

        if (id && name) {
            movies.push({
                id: id,
                name: name,
                timestamp: Date.now(),
            });
        }
    });

    const newAudiovaultEntries = await removeEntriesPresentInJSON(movies, shows);
    movies = newAudiovaultEntries.movies;
    shows = newAudiovaultEntries.shows;

    console.log(`Successfully retrieved ${shows.length} new shows, and ${movies.length} new movie entries from Audiovault's HTML.`);

    try {
        await addToNotebrook(movies, shows);
        await updateJsonFile(newAudiovaultEntries);
    } catch (error) {
        console.error('Failed to post to Notebrook, not updating JSON file:', error);
    }
};

const removeEntriesPresentInJSON = async (movies, shows) => {
    if (!fs.existsSync(JSON_FILE)) {
        fs.writeFileSync(JSON_FILE, JSON.stringify({
            movies: [],
            shows: [],
        }));
    }

    const json = JSON.parse(fs.readFileSync(JSON_FILE));

    const newMovies = movies.filter(movie => !json.movies.find(oldMovie => movie.id === oldMovie.id));
    const newShows = shows.filter(show => !json.shows.find(oldShow => show.id === oldShow.id));

    return {
        movies: newMovies,
        shows: newShows,
    };
};

const updateJsonFile = async (newEntries) => {
    const json = JSON.parse(fs.readFileSync(JSON_FILE));
    fs.writeFileSync(JSON_FILE, JSON.stringify({
        movies: [...json.movies, ...newEntries.movies],
        shows: [...json.shows, ...newEntries.shows],
    }));
};

const addToNotebrook = async (movies, shows) => {
    if (movies.length == 0 && shows.length == 0) {
        console.log('Nothing to do.');
        return;
    }
    require('dotenv').config();

    for (const movie of movies) {
        await postToNotebrook(movie.name);
    }

    for (const show of shows) {
        await postToNotebrook(show.name);
    }

    console.log('Successfully posted to Notebrook');
};

const postToNotebrook = async (message) => {
    const options = {
        method: 'POST',
        url: `${process.env.API_URL}/channels/${process.env.CHANNEL_ID}/messages`,
        headers: {
            'content-type': 'application/json',
            'authorization': `${process.env.TOKEN}`,
        },
        data: JSON.stringify({
            content: message,
        })
    };

    try {
        await axios.request(options);
        console.log(`Successfully posted ${message} to Notebrook`);
    } catch (error) {
        throw new Error(`Failed to post ${message} to notebrook with ${error}`)
    }
};

main();