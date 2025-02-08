const canvas = document.getElementById('go-board');
const ctx = canvas.getContext('2d');
const gridSize = 19; // 19x19 棋盘
const cellSize = canvas.width / gridSize;
const pieceRadius = cellSize * 0.4; // 棋子半径

let boardState = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)); // 初始化棋盘状态，null 表示空，'black' 或 'white' 表示棋子颜色

let currentPlayer = 'black'; // 假设用户执黑棋先行

function drawBoard() {
    ctx.fillStyle = '#DDBB77'; // 棋盘颜色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    for (let i = 0; i < gridSize; i++) {
        // 绘制竖线
        ctx.beginPath();
        ctx.moveTo(cellSize * i + cellSize/2, cellSize/2);
        ctx.lineTo(cellSize * i + cellSize/2, canvas.height - cellSize/2);
        ctx.stroke();

        // 绘制横线
        ctx.beginPath();
        ctx.moveTo(cellSize/2, cellSize * i + cellSize/2);
        ctx.lineTo(canvas.width - cellSize/2, cellSize * i + cellSize/2);
        ctx.stroke();
    }
    // 绘制星位 (可以先省略，后续添加)
}

function drawPiece(row, col, color) {
    const x = cellSize * col + cellSize/2;
    const y = cellSize * row + cellSize/2;

    ctx.beginPath();
    ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function getBoardPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let col = Math.floor(x / cellSize);
    let row = Math.floor(y / cellSize);

    // 边界检查
    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) {
        return null; // 点击位置超出棋盘
    }
    return {row: row, col: col};
}


canvas.addEventListener('click', function(event) {
    const boardPos = getBoardPosition(event);
    if (boardPos) {
        const row = boardPos.row;
        const col = boardPos.col;

        if (boardState[row][col] === null) { // 检查位置是否为空
            boardState[row][col] = currentPlayer; // 更新棋盘状态
            drawPiece(row, col, currentPlayer); // 绘制棋子
            currentPlayer = (currentPlayer === 'black') ? 'white' : 'black'; // 切换玩家 (目前只是模拟，AI 执白棋的逻辑还没接入)
        } else {
            alert("该位置已经有棋子，请选择其他位置落子!"); // 简单提示，位置已被占用
        }
    }
});


drawBoard(); // 页面加载时绘制棋盘
