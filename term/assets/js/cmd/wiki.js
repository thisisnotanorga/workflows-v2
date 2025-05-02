// wiki.js

function wiki(query) {
    var term = this;

    if (!query) {
        term.error('Please provide a query. Usage: wiki <query>');
        return;
    }
    $.ajax({
        url: `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&redirects=true&titles=${encodeURIComponent(query)}`,
        dataType: 'jsonp',
        success: function (data) {
            var pageId = Object.keys(data.query.pages)[0];
            var extract = data.query.pages[pageId].extract;

            if (extract) {
                var cleanText = extract.replace(/<\/?[^>]+(>|$)/g, "");

    
                var title = data.query.pages[pageId].title;

                var wikiLink = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

                term.echo(`${cleanText}\n\nWikipedia link: ${wikiLink}`);
            } else {
                term.error('No information found for the given query.');
            }
        },
        error: function () {
            term.error('Failed to fetch data from Wikipedia.');
        }
    });
}
