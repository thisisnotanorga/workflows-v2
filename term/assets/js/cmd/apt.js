// apt.js

function apt(package) {
    this.error(`Failed to install ${package}:\nError: apt: command not found\nTry installing apt with apt/install apt`);
}