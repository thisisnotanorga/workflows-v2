//Comments.js | Comment system for noskid

function spawnCommentSystem(event) {
    event.preventDefault();

    const commentwin = ClassicWindow.createWindow({
        title: 'Comments',
        width: 500,
        height: 400,
        x: Math.round((window.innerWidth - 500) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        content: `<div>Loading comments...</div>`,
        theme: 'dark',
        resizable: false,
    });

    let footer = commentwin.querySelector('.window-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'window-footer';
        commentwin.appendChild(footer);
    }

    const newCommentBtn = document.createElement('button');
    newCommentBtn.textContent = 'New Comment';
    newCommentBtn.addEventListener('click', () => spawnNewCommentForm());
    footer.prepend(newCommentBtn);

    loadComments(commentwin);
    return commentwin;
}

function loadComments(commentwin) {
    fetch('/api/comments')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network error when fetching comments');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                displayComments(commentwin, data);
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            const errorMsg = `
                <div>
                    <p>Error loading comments: ${error.message}</p>
                    <button>Retry</button>
                </div>
            `;
            updateComments(commentwin, errorMsg);

            const retryBtn = commentwin.querySelector('button');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadComments(commentwin));
            }

            log('Error loading comments: ' + error.message, 'error');
        });
}

function displayComments(window, comments) {
    if (comments.length === 0) {
        const content = `<div><p>No comments yet. Be the first to comment!</p></div>`;
        updateComments(window, content);
        return;
    }

    const commentsHTML = comments.map(comment => {
        const userLiked = comment.user_reaction === 'like';
        const userDisliked = comment.user_reaction === 'dislike';

        return cs(`
        <div class="comment" data-id="${comment.id}">
            <bold>${comment.author || 'Anonymous'}</bold>
            <span>${formatDate(comment.date)}</span>
            <p>${comment.content}</p>
            <div class="reactions">
                <button class="like-btn ${userLiked ? 'active' : ''}" onclick="handleReaction(${comment.id}, '${userLiked ? 'none' : 'like'}')">
                    + ${comment.likes || 0}
                </button>
                <button class="dislike-btn ${userDisliked ? 'active' : ''}" onclick="handleReaction(${comment.id}, '${userDisliked ? 'none' : 'dislike'}')">
                    - ${comment.dislikes || 0}
                </button>
            </div>
            <hr>
        </div>
        `);
    }).join('');

    const container = document.createElement('div');
    container.innerHTML = commentsHTML;

    const style = document.createElement('style');
    style.textContent = `
        .comment { margin-bottom: 10px; }
        .reactions { margin: 5px 0; }
        .reactions button { margin-right: 5px; cursor: pointer; }
        .reactions button.active { font-weight: bold; background: #444; }
    `;
    container.prepend(style);

    updateComments(window, container);
    log('Comments loaded successfully', 'success');
}

function updateComments(window, content) {
    if (content instanceof HTMLElement) {
        ClassicWindow.updateWindowContent(window, content);
    } else {
        const newContent = document.createElement('div');
        newContent.innerHTML = content;
        ClassicWindow.updateWindowContent(window, newContent);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function handleReaction(commentId, reactionType) {
    fetch(`/api/comments?action=${reactionType}&id=${commentId}`) //to lazy to mess with post requests
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error handling reaction');
                });
            }
            return response.json();
        })
        .then(data => {
            const commentElement = document.querySelector(`.comment[data-id="${commentId}"]`);
            if (commentElement) {
                const likeBtn = commentElement.querySelector('.like-btn');
                const dislikeBtn = commentElement.querySelector('.dislike-btn');

                likeBtn.textContent = `+ ${data.likes || 0}`;
                dislikeBtn.textContent = `- ${data.dislikes || 0}`;

                likeBtn.classList.toggle('active', data.user_reaction === 'like');
                dislikeBtn.classList.toggle('active', data.user_reaction === 'dislike');

                likeBtn.setAttribute('onclick', `handleReaction(${commentId}, '${data.user_reaction === 'like' ? 'none' : 'like'}')`);
                dislikeBtn.setAttribute('onclick', `handleReaction(${commentId}, '${data.user_reaction === 'dislike' ? 'none' : 'dislike'}')`);
            }

            log('Reaction updated successfully', 'success');
        })
        .catch(error => {
            alert('Error: ' + error.message);
            log('Error handling reaction: ' + error.message, 'error');
        });
}

function spawnNewCommentForm() {
    const newCommentWin = ClassicWindow.createWindow({
        title: 'New Comment',
        width: 400,
        height: 300,
        x: Math.round((window.innerWidth - 400) / 2),
        y: Math.round((window.innerHeight - 300) / 2),
        content: `
            <div>
                <form>
                    <div>
                        <label for="author">Your name:</label>
                        <input type="text" id="author" placeholder="Anonymous">
                    </div>
                    <div>
                        <label for="content">Comment:</label>
                        <textarea id="content" required rows="5" placeholder="Write your comment here..."></textarea>
                    </div>
                    <div>
                        <button type="submit">Send</button>
                        <button type="button" class="cancel">Cancel</button>
                    </div>
                </form>
            </div>
        `,
        theme: 'dark',
        resizable: false,
        statusText: 'Writing a new comment',
    });

    const form = newCommentWin.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitComment(form, newCommentWin);
    });

    const cancelBtn = newCommentWin.querySelector('.cancel');
    cancelBtn.addEventListener('click', () => {
        ClassicWindow.closeWindow(newCommentWin);
    });

    return newCommentWin;
}

function submitComment(form, window) {
    const author = form.querySelector('#author').value.trim() || 'Anonymous';
    const content = form.querySelector('#content').value.trim();

    if (!content) {
        alert('Comment content cannot be empty.');
        return;
    }

    const buttons = form.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);

    const commentData = {
        author: author,
        content: content
    };

    fetch('/api/comments/index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error sending comment');
                });
            }
            return response.json();
        })
        .then(data => {
            log('Comment added successfully', 'success');

            ClassicWindow.closeWindow(window);

            document.querySelectorAll('.window').forEach(win => {
                if (win.querySelector('.window-title').textContent === 'Comments') {
                    loadComments(win);
                }
            });
        })
        .catch(error => {
            log('Error sending comment: ' + error.message, 'error');
            alert('Error: ' + error.message);

            buttons.forEach(btn => btn.disabled = false);
        });
}