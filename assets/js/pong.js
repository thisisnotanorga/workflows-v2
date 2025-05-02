//Pong.js | Pong is goated


function pongGame() {
    const container = document.createElement('div');
    container.style.width = '600px';
    container.style.height = '400px';
    container.style.position = 'relative';
    container.style.backgroundColor = '#000';
    container.style.overflow = 'hidden';

    const pongWindow = ClassicWindow.createWindow({
        title: 'Pong Game',
        content: container,
        width: 650,
        height: 490,
        x: Math.round((window.innerWidth - 500) / 2),
        y: Math.round((window.innerHeight - 400) / 2),
        statusText: 'Use W/S keys to control your paddle. First to 10 points wins!',
        onClose: () => {
            stopGame = true;
            cancelAnimationFrame(animationId);
        }
    });

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const paddleWidth = 10;
    const paddleHeight = 80;
    const ballSize = 10;
    const winScore = 10; //score to win

    let stopGame = false;
    let animationId;
    let aiBaseDifficulty = 0.4; // 0 (easy) to 1 (impossible)
    let aiDifficulty = aiBaseDifficulty;
    let gameOver = false;

    let fps = 0;
    let fpsCounter = 0;
    let lastFpsUpdate = 0;

    const game = {
        player: {
            x: 20,
            y: canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            score: 0,
            speed: 8,
            dy: 0
        },
        ai: {
            x: canvas.width - 20 - paddleWidth,
            y: canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            score: 0,
            speed: 5,
            reactionDelay: 3
        },
        ball: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: ballSize,
            dx: 5,
            dy: 5,
            speed: 5
        }
    };

    const keys = {};

    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;

        if (gameOver && e.key === "p") {
            resetGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    function drawPaddle(x, y, width, height) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x, y, width, height);
    }

    function drawBall(x, y, size) {
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawScore() {
        ctx.fillStyle = '#FFF';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.player.score, canvas.width / 4, 50);
        ctx.fillText(game.ai.score, 3 * canvas.width / 4, 50);
    }

    function drawNet() {
        ctx.fillStyle = '#FFF';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = '#FFF';
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawGameOver() {
        const winner = game.player.score >= winScore ? "YOU WIN!" : "AI WINS!";

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(winner, canvas.width / 2, canvas.height / 2 - 24);

        ctx.font = '24px Arial';
        ctx.fillText("Press P to play again", canvas.width / 2, canvas.height / 2 + 24);
    }

    function updateAI() {
        let targetY = game.ball.y - (game.ai.height / 2);

        const scoreDiff = game.player.score - game.ai.score;
        const difficultyAdjustment = Math.min(0.3, Math.max(0, scoreDiff * 0.03));
        aiDifficulty = Math.min(0.85, aiBaseDifficulty + difficultyAdjustment);

        const maxRandomOffset = (1 - aiDifficulty) * 120;
        const randomOffset = (Math.random() * maxRandomOffset) - (maxRandomOffset / 2);
        targetY += randomOffset;

        const speedFactor = Math.min(1, game.ball.speed / 15);
        const predictionError = (1 - aiDifficulty) * 60 * speedFactor;
        targetY += (Math.random() * predictionError) - (predictionError / 2);

        if (Math.random() > 0.9 + aiDifficulty * 0.1) {
            targetY = game.ai.y + (Math.random() > 0.5 ? 30 : -30);
        }

        if (game.ball.dx > 0 || game.ball.x > canvas.width * 0.7) {
            const aiSpeedFactor = 0.5 + (aiDifficulty * 0.5);

            if (game.ai.y + (game.ai.height / 2) < targetY + 10) {
                game.ai.y += game.ai.speed * aiSpeedFactor;
            } else if (game.ai.y + (game.ai.height / 2) > targetY - 10) {
                game.ai.y -= game.ai.speed * aiSpeedFactor;
            }
        } else {
            if (game.ai.y + (game.ai.height / 2) < canvas.height / 2 - 40) {
                game.ai.y += game.ai.speed * 0.3;
            } else if (game.ai.y + (game.ai.height / 2) > canvas.height / 2 + 40) {
                game.ai.y -= game.ai.speed * 0.3;
            }
        }

        if (game.ai.y < 0) {
            game.ai.y = 0;
        } else if (game.ai.y > canvas.height - game.ai.height) {
            game.ai.y = canvas.height - game.ai.height;
        }
    }

    function update() {
        if (game.player.score >= winScore || game.ai.score >= winScore) {
            gameOver = true;
            return;
        }

        if (keys['w'] || keys['W']) {
            game.player.dy = -game.player.speed;
        } else if (keys['s'] || keys['S']) {
            game.player.dy = game.player.speed;
        } else {
            game.player.dy = 0;
        }

        game.player.y += game.player.dy;

        if (game.player.y < 0) {
            game.player.y = 0;
        } else if (game.player.y > canvas.height - game.player.height) {
            game.player.y = canvas.height - game.player.height;
        }

        updateAI();

        game.ball.x += game.ball.dx;
        game.ball.y += game.ball.dy;

        if (game.ball.y - game.ball.size < 0 || game.ball.y + game.ball.size > canvas.height) {
            game.ball.dy *= -1;
        }

        if (
            game.ball.x - game.ball.size <= game.player.x + game.player.width &&
            game.ball.x - game.ball.size > game.player.x &&
            game.ball.y >= game.player.y &&
            game.ball.y <= game.player.y + game.player.height
        ) {
            game.ball.dx *= -1;
            game.ball.x = game.player.x + game.player.width + game.ball.size;

            const hitPosition = (game.ball.y - game.player.y) / game.player.height;
            game.ball.dy = 10 * (hitPosition - 0.5);

            adjustBallSpeed();
        }

        if (
            game.ball.x + game.ball.size >= game.ai.x &&
            game.ball.x + game.ball.size < game.ai.x + game.ai.width &&
            game.ball.y >= game.ai.y &&
            game.ball.y <= game.ai.y + game.ai.height
        ) {
            game.ball.dx *= -1;
            game.ball.x = game.ai.x - game.ball.size;

            const hitPosition = (game.ball.y - game.ai.y) / game.ai.height;
            game.ball.dy = 10 * (hitPosition - 0.5);

            adjustBallSpeed();
        }

        if (game.ball.x < 0) {
            game.ai.score++;
            resetBall();
        } else if (game.ball.x > canvas.width) {
            game.player.score++;
            resetBall();
        }

        fpsCounter++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
            fps = Math.round(fpsCounter * 1000 / (now - lastFpsUpdate));
            fpsCounter = 0;
            lastFpsUpdate = now;
        }

        const statusText = `Score: ${game.player.score}-${game.ai.score} | FPS: ${fps} | First to ${winScore} wins | AI Difficulty: ${Math.round(aiDifficulty * 100)}%`;
        ClassicWindow.updateStatusText(pongWindow, statusText);
    }

    function adjustBallSpeed() {
        const speedIncrease = 0.2;
        if (game.ball.dx > 0) {
            game.ball.dx += speedIncrease;
        } else {
            game.ball.dx -= speedIncrease;
        }

        const maxSpeed = 15;
        if (Math.abs(game.ball.dx) > maxSpeed) {
            game.ball.dx = maxSpeed * Math.sign(game.ball.dx);
        }
    }

    function resetBall() {
        game.ball.x = canvas.width / 2;
        game.ball.y = canvas.height / 2;

        game.ball.speed = 5;

        game.ball.dx = game.ball.speed * (Math.random() > 0.5 ? 1 : -1);
        game.ball.dy = (Math.random() * 4 - 2);
    }

    function resetGame() {
        game.player.score = 0;
        game.ai.score = 0;
        aiDifficulty = aiBaseDifficulty;

        resetBall();

        gameOver = false;
    }

    function gameLoop() {
        if (stopGame) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!gameOver) {
            update();
        }

        drawPaddle(game.player.x, game.player.y, game.player.width, game.player.height);
        drawPaddle(game.ai.x, game.ai.y, game.ai.width, game.ai.height);
        drawBall(game.ball.x, game.ball.y, game.ball.size);
        drawScore();
        drawNet();

        if (gameOver) {
            drawGameOver();
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    resetBall();
    lastFpsUpdate = performance.now();
    gameLoop();

    return pongWindow;
}