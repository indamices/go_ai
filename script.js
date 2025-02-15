const canvas = document.getElementById('goBoard');
const ctx = canvas.getContext('2d');
const coordinatesDiv = document.getElementById('coordinates');
const moveInput = document.getElementById('moveInput');
const submitMoveButton = document.getElementById('submitMove');
const historyList = document.getElementById('historyList');
const revertButton = document.getElementById('revertButton');

class GameState {
    constructor(board = null, moveRecord = [], currentPlayer = 1, moveNumber = 0) {
        this.board = board || this.createEmptyBoard();
        this.moveRecord = moveRecord;
        this.currentPlayer = currentPlayer;
        this.moveNumber = moveNumber;
        this.legalMoves = this.calculateLegalMoves(); // 初始化 legalMoves
        this.boardHistory = [this.board.map(row => [...row])]; // 初始化 boardHistory
        console.log('GameState constructor - boardHistory:', this.boardHistory); // 添加 log
    }

    createEmptyBoard() {
        let board = [];
        for (let i = 0; i < boardSize; i++) {
            board[i] = new Array(boardSize).fill(0);
        }
        return board;
    }

    calculateLegalMoves() {
        // TODO: Implement legal move calculation logic
        return []; // Placeholder for now
    }
}

const gridSize = 25; // 栅格大小
const boardSize = 19; // 棋盘大小
const stoneRadius = gridSize / 2 - 2; // 棋子半径
const starPoints = [ // 星位坐标
    { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
    { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
    { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
];

let gameState = new GameState(); // 使用 GameState 类
let board = gameState.board; // 使用 gameState.board
let currentPlayer = gameState.currentPlayer; // 使用 gameState.currentPlayer
let moveCounter = gameState.moveNumber; // 使用 gameState.moveNumber
let moveHistory = gameState.moveHistory; // 使用 gameState.moveHistory (同步全局 moveHistory 变量，虽然可能不是必须，但保持一致性)
let boardHistory = gameState.boardHistory; // 使用 gameState.boardHistory (同步全局 boardHistory 变量，同上)
let selectedMoveIndex = gameState.selectedMoveIndex; // 使用 gameState.selectedMoveIndex （同步全局 selectedMoveIndex 变量，同上）

console.log('gameState at top level:', gameState); // 添加 console.log 输出 gameState

function drawBoard() {
    console.log('drawBoard - gameState:', gameState);
    console.log('drawBoard - gameState.boardHistory:', gameState.boardHistory); // 检查 gameState.boardHistory
    ctx.fillStyle = '#DDBEA9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    for (let i = 0; i < boardSize; i++) {
        // 绘制纵线
        ctx.beginPath();
        ctx.moveTo((i + 1) * gridSize, gridSize);
        ctx.lineTo((i + 1) * gridSize, boardSize * gridSize);
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

function displayMoveNumber(x, y, moveNumber) {
    ctx.fillStyle = currentPlayer === 1 ? 'white' : 'black'; // 根据棋子颜色设置文字颜色
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(moveNumber, (x + 1) * gridSize, (y + 1) * gridSize);
}

function getBoardPosition(event) {
    const rect = canvas.getBoundingClientRect();
    let x = Math.round((event.clientX - rect.left - gridSize) / gridSize);
    let y = Math.round((event.clientY - rect.top - gridSize) / gridSize);

    return { x: x, y: y };
}

function isValidMove(x, y) {
    console.log('isValidMove - gameState:', gameState); // 检查 gameState 的值
    return x >= 0 && x < boardSize && y >= 0 && y < boardSize && gameState.board[y][x] === 0;
}

function placeStone(x, y, player) {
    console.log('placeStone - gameState:', gameState); // 检查 gameState 的值
    console.log('placeStone - gameState.boardHistory:', gameState.boardHistory); // 检查 gameState.boardHistory 的值
    if (isValidMove(x, y)) {
        gameState.boardHistory.push(gameState.board.map(row => [...row])); // 保存落子前的棋盘状态
        gameState.moveCounter++; // 增加步数计数器
        gameState.board = gameState.boardHistory[gameState.boardHistory.length - 1].map(row => [...row]); // 使用最新的棋盘快照
        gameState.board[y][x] = player;
        drawStone(x, y, player);
        displayMoveNumber(x, y, gameState.moveCounter);
        const colChar = String.fromCharCode('A'.charCodeAt(0) + x);
        const rowNum = boardSize - y;
        const move = `${colChar}${rowNum}`;
        const playerColor = player === 1 ? '黑棋' : '白棋';
        gameState.moveHistory.push({ move: move, player: playerColor, boardState: gameState.board.map(row => [...row]) });
        moveHistory = gameState.moveHistory; // 更新全局 moveHistory
        displayMoveHistory(move, gameState.moveCounter, playerColor);
        displayCoordinates(x, y, player, gameState.moveCounter);
        gameState.currentPlayer = 3 - gameState.currentPlayer;
        currentPlayer = gameState.currentPlayer;
        moveCounter = gameState.moveCounter;
        board = gameState.board;
        if (currentPlayer === 2) {
            // 轮到白棋 (AI/另一用户)
            moveInput.disabled = false;
            submitMoveButton.disabled = false;
        } else {
            // 轮到黑棋
            moveInput.disabled = true;
            submitMoveButton.disabled = true;
        }
        if (gameState.moveHistory.length > 0) {
            revertButton.disabled = false;
        }
    } else {
        console.log('Invalid move'); // 添加 log for invalid move
    }
}

function displayMoveHistory(move, moveNumber, playerColor) {
    const historyItem = document.createElement('li');
    historyItem.textContent = `第${moveNumber}手 ${playerColor} ${move}`;
    historyItem.addEventListener('click', function() {
        selectedMoveIndex = parseInt(historyItem.textContent.split('手')[0].substring(1)) - 1;
        historyList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        historyItem.classList.add('selected');
    });
    historyList.appendChild(historyItem);
}

function redrawBoard(boardState) {
    console.log('redrawBoard - gameState:', gameState); // 检查 gameState 的值
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    gameState.board = boardState; // 更新 gameState 的 board
    board = gameState.board;
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            if (gameState.board[y][x] !== 0) {
                drawStone(x, y, gameState.board[y][x]);
            }
        }
    }
    // 重新绘制所有手数
    for (let i = 0; i < gameState.moveHistory.length; i++) {
        const moveItem = gameState.moveHistory[i];
        const moveCoords = moveItem.move;
        const xCoord = moveCoords.charCodeAt(0) - 'A'.charCodeAt(0);
        const yCoord = boardSize - parseInt(moveCoords.substring(1));
        if (gameState.board[yCoord][xCoord] !== 0 && i <= gameState.moveCounter - 1) {
            displayMoveNumber(xCoord, yCoord, i + 1);
        }
    }
}


function displayCoordinates(x, y, player, moveNumber) {
    const colChar = String.fromCharCode('A'.charCodeAt(0) + x);
    const rowNum = boardSize - y;
    const playerColor = player === 1 ? '黑棋' : '白棋';
    coordinatesDiv.textContent = `${playerColor}落子坐标: ${colChar}${rowNum}，第 ${moveNumber} 手`;
}

canvas.addEventListener('click', function(event) {
    console.log('canvas.addEventListener - this:', this); // 检查 this 的指向
    console.log('canvas.addEventListener - gameState:', gameState); // 检查 gameState 的值
    if (gameState.currentPlayer === 1) { // 只有轮到黑棋时才响应点击
        const pos = getBoardPosition(event);
        placeStone(pos.x, pos.y, gameState.currentPlayer);
    }
});

submitMoveButton.addEventListener('click', function() {
    console.log('submitButton.addEventListener - this:', this); // 检查 this 的指向
    console.log('submitButton.addEventListener - gameState:', gameState); // 检查 gameState 的值
    submitMove();
});

moveInput.addEventListener('keydown', function(event) {
        event.preventDefault(); // 防止默认的回车提交行为
        submitMove();
    }
);

function submitMove() {
    if (currentPlayer === 2) {
        const move = moveInput.value.toUpperCase();
        const x = move.charCodeAt(0) - 'A'.charCodeAt(0);
        const y = boardSize - parseInt(move.substring(1));

        if (isValidMove(x, y)) {
            placeStone(x, y, currentPlayer);
            moveInput.value = '';
        } else {
            alert('无效的落子位置!');
        }
    }
}

revertButton.addEventListener('click', function() {
    console.log('revertButton.addEventListener - this:', this); // 检查 this 的指向
    console.log('revertButton.addEventListener - gameState:', gameState); // 检查 gameState 的值
    if (selectedMoveIndex !== -1) {
        gameState.board = moveHistory[selectedMoveIndex].boardState;
        board = gameState.board;
        gameState.currentPlayer = moveHistory[selectedMoveIndex].player === '黑棋' ? 2 : 1;
        currentPlayer = gameState.currentPlayer;
        gameState.moveCounter = selectedMoveIndex + 1;
        moveCounter = gameState.moveCounter;
        redrawBoard(gameState.board);
        historyList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        selectedMoveIndex = -1;
        if (gameState.moveHistory.length <= 0) {
            revertButton.disabled = true;
        }
    }
});


drawBoard();

// 禁用白棋输入框和按钮，等待用户先落子
moveInput.disabled = true;
submitMoveButton.disabled = true;
