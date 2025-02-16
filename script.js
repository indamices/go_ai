const canvas = document.getElementById('goBoard');
const ctx = canvas.getContext('2d');
const coordinatesDiv = document.getElementById('coordinates');
const moveInput = document.getElementById('moveInput');
const submitMoveButton = document.getElementById('submitMove');

const gridSize = 25; // 栅格大小
const boardSize = 19; // 棋盘大小
const stoneRadius = gridSize / 2 - 2; // 棋子半径
const starPoints = [ // 星位坐标
    { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
    { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
    { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
];

let board = []; // 棋盘状态
for (let i = 0; i < boardSize; i++) {
    board[i] = new Array(boardSize).fill(0); // 0: 空, 1: 黑子, 2: 白子
}

let currentPlayer = 1; // 1: 黑子 (用户), 2: 白子 (AI/另一用户)

function drawBoard() {
    ctx.fillStyle = '#DDBEA9'; // 棋盘背景色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    for (let i = 0; i < boardSize; i++) {
        // 绘制纵线
        ctx.beginPath();
        ctx.moveTo((i + 1) * gridSize, gridSize);
        ctx.lineTo((i + 1) * gridSize, boardSize * gridSize); // 纵线终点改回 boardSize * gridSize
        ctx.stroke();

        // 绘制横线
        ctx.beginPath();
        ctx.moveTo(gridSize, (i + 1) * gridSize);
        ctx.lineTo(boardSize * gridSize, (i + 1) * gridSize);
        ctx.stroke();
    }

    // 绘制星位
    ctx.fillStyle = 'black';
    starPoints.forEach(star => {
        ctx.beginPath();
        ctx.arc((star.x + 1) * gridSize, (star.y + 1) * gridSize, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawStone(x, y, color) {
    ctx.fillStyle = color === 1 ? 'black' : 'white';
    ctx.beginPath();
    ctx.arc((x + 1) * gridSize, (y + 1) * gridSize, stoneRadius, 0, 2 * Math.PI);
    ctx.fill();
}

function getBoardPosition(event) {
    const rect = canvas.getBoundingClientRect();
    let x = Math.round((event.clientX - rect.left - gridSize) / gridSize);
    let y = Math.round((event.clientY - rect.top - gridSize) / gridSize);

    return { x: x, y: y };
}

function isValidMove(x, y) {
    return x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[y][x] === 0;
}

function placeStone(x, y, player) {
    if (isValidMove(x, y)) {
        board[y][x] = player;
        drawStone(x, y, player);
        displayCoordinates(x, y, player);
        currentPlayer = 3 - currentPlayer; // 切换玩家
        if (currentPlayer === 2) {
            // 轮到白棋 (AI/另一用户)
            moveInput.disabled = false;
            submitMoveButton.disabled = false;
        } else {
            moveInput.disabled = true;
            submitMoveButton.disabled = true;
        }
    }
}

function displayCoordinates(x, y, player) {
    const colChar = String.fromCharCode('A'.charCodeAt(0) + x);
    const rowNum = boardSize - y;
    const playerColor = player === 1 ? '黑棋' : '白棋';
    coordinatesDiv.textContent = `${playerColor}落子坐标: ${colChar}${rowNum}`;
}

canvas.addEventListener('click', function(event) {
    if (currentPlayer === 1) { // 只有轮到黑棋时才响应点击
        const pos = getBoardPosition(event);
        placeStone(pos.x, pos.y, currentPlayer);
    }
});

submitMoveButton.addEventListener('click', function() {
    if (currentPlayer === 2) { // 只有轮到白棋时才响应提交
        const move = moveInput.value.toUpperCase();
        const x = move.charCodeAt(0) - 'A'.charCodeAt(0);
        const y = boardSize - parseInt(move.substring(1));

        if (isValidMove(x, y)) {
            placeStone(x, y, currentPlayer);
            moveInput.value = ''; // 清空输入框
        } else {
            alert('无效的落子位置!');
        }
    }
});

drawBoard(); // 初始化棋盘

// 禁用白棋输入框和按钮，等待用户先落子
moveInput.disabled = true;
submitMoveButton.disabled = true;
