// date.js

function date() {
    var term = this;

    var currentDate = new Date();
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' };
    var formattedDate = currentDate.toLocaleDateString('en-US', options);

    term.echo(formattedDate);
}
