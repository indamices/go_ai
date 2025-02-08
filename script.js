const canvas = document.getElementById('go-board');
const ctx = canvas.getContext('2d');
const gridSize = 19;
// 修改 cellSize 的计算方式：使用 (gridSize + 1) 作为除数，让棋盘边缘留出空隙
const cellSize = canvas.width / (gridSize + 1);
const pieceRadius = cellSize * 0.4;
const boardMargin = cellSize; // 使用 cellSize 作为边距，保持线条与棋盘边缘有一定距离

let boardState = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
let currentPlayer = 'black'; // 用户执黑棋先手
let lastCapturedPosition = null;

// 新增：记录历史棋盘状态，用于劫争规则
let boardHistory = [];

// 新增：锁定标志，防止在AI思考时用户继续落子
let isProcessingMove = false;

function drawBoard() {
    ctx.fillStyle = '#DDBB77';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    for (let i = 0; i < gridSize; i++) {
        ctx.beginPath();
        // 修改横线起始和结束坐标，使用 boardMargin 作为边距
        ctx.moveTo(boardMargin, boardMargin + cellSize * i); // 修改后的横线 Y 坐标
        ctx.lineTo(canvas.width - boardMargin, boardMargin + cellSize * i); // 修改后的横线 Y 坐标
        ctx.stroke();

        ctx.beginPath();
        // 修改竖线起始和结束坐标，使用 boardMargin 作为边距
        ctx.moveTo(boardMargin + cellSize * i, boardMargin); // 修改后的竖线 X 坐标
        ctx.lineTo(boardMargin + cellSize * i, canvas.height - boardMargin); // 修改后的竖线 X 坐标
        ctx.stroke();
    }
}

function drawPiece(row, col, color) {
    const x = boardMargin + cellSize * col; // 修改后的棋子 X 坐标
    const y = boardMargin + cellSize * row; // 修改后的棋子 Y 坐标

    ctx.beginPath();
    ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function getBoardPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 修改后的 getBoardPosition 函数，考虑 boardMargin 和 cellSize
    let col = Math.round((x - boardMargin) / cellSize);
    let row = Math.round((y - boardMargin) / cellSize);

    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) {
        return null;
    }
    return { row: row, col: col };
}

function getLiberties(row, col, color) {
    let liberties = 0;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
            if (boardState[nr][nc] === null) {
                liberties++;
            }
        }
    }
    return liberties;
}

function getGroup(row, col, color, visited) {
    if (
        row < 0 ||
        row >= gridSize ||
        col < 0 ||
        col >= gridSize ||
        visited[row][col] ||
        boardState[row][col] !== color
    ) {
        return [];
    }

    visited[row][col] = true;
    let group = [{ row: row, col: col }];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        group = group.concat(getGroup(nr, nc, color, visited));
    }
    return group;
}

function calculateGroupLiberties(group) {
    let groupLiberties = 0;
    const visitedLiberties = Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill(false));

    for (const piece of group) {
        const row = piece.row;
        const col = piece.col;
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;

            if (
                nr >= 0 &&
                nr < gridSize &&
                nc >= 0 &&
                nc < gridSize &&
                !visitedLiberties[nr][nc]
            ) {
                if (boardState[nr][nc] === null) {
                    groupLiberties++;
                    visitedLiberties[nr][nc] = true;
                }
            }
        }
    }
    return groupLiberties;
}

function capturePieces(row, col, color) {
    const opponentColor = color === 'black' ? 'white' : 'black';
    const directions = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
    ];
    let capturedPieces = 0;
    let capturedKoPosition = null;

    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;

        if (
            nr >= 0 &&
            nr < gridSize &&
            nc >= 0 &&
            nc < gridSize &&
            boardState[nr][nc] === opponentColor
        ) {
            const visited = Array(gridSize)
                .fill(null)
                .map(() => Array(gridSize).fill(false));
            const opponentGroup = getGroup(nr, nc, opponentColor, visited);
            const groupLiberties = calculateGroupLiberties(opponentGroup);

            if (groupLiberties === 0) {
                if (opponentGroup.length === 1) {
                    // 记录劫争位置
                    capturedKoPosition = { row: nr, col: nc };
                }
                capturedPieces += opponentGroup.length;
                for (const piece of opponentGroup) {
                    boardState[piece.row][piece.col] = null;
                }
            }
        }
    }
    return {
        capturedCount: capturedPieces,
        capturedKoPosition: capturedKoPosition,
    };
}

async function getAiMoveFromBackend(move) {
    const apiUrl = '/api/move'; // Flask API 接口地址 (相对于前端网页)

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                move: move,
                board_state: boardState,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.ai_move; // 返回 AI 的落子建议 {row, col}
    } catch (error) {
        // 捕获 fetch 请求错误 (例如网络错误) 和 JSON 解析错误
        console.error('Error fetching AI move:', error);
        alert('Failed to get AI move from backend.'); // 简单错误提示
        return null; // 返回 null 表示获取 AI 落子失败
    }
}

async function handleUserMove(row, col) {
    if (isProcessingMove) {
        // 如果当前正在处理其他落子，忽略新的点击
        return;
    }

    if (boardState[row][col] === null) {
        if (
            lastCapturedPosition &&
            row === lastCapturedPosition.row &&
            col === lastCapturedPosition.col
        ) {
            alert(
                '劫! 根据围棋规则，您不能立即反提，必须先在棋盘其他地方落一子（应劫）才可以再次提劫。'
            );
            return;
        }

        // 临时锁定，防止在处理过程中用户继续操作
        isProcessingMove = true;

        // 临时放置棋子
        boardState[row][col] = currentPlayer;
        drawPiece(row, col, currentPlayer);

        // 捕获对方棋子
        const captureResult = capturePieces(row, col, currentPlayer);
        const capturedCount = captureResult.capturedCount;
        const capturedKoPosition = captureResult.capturedKoPosition;

        // 检查自己是否有气
        const visitedForOwnGroup = Array(gridSize)
            .fill(null)
            .map(() => Array(gridSize).fill(false));
        const ownGroup = getGroup(row, col, currentPlayer, visitedForOwnGroup);
        const ownLiberties = calculateGroupLiberties(ownGroup);

        if (ownLiberties === 0 && capturedCount === 0) {
            // 撤销落子
            boardState[row][col] = null;
            alert(
                '自杀! 您的落子没有气且没有捕获任何对方棋子。'
            );
            // 解除锁定
            isProcessingMove = false;
            return;
        }

        // 劫争历史检查
        const currentState = JSON.stringify(boardState);
        if (boardHistory.includes(currentState)) {
            // 撤销落子
            boardState[row][col] = null;
            alert(
                '非法落子！该位置导致棋盘状态重复（违反劫争规则）。'
            );
            // 解除锁定
            isProcessingMove = false;
            return;
        }

        // 添加当前状态到历史记录
        boardHistory.push(currentState);

        // 绘制更新
        drawBoard(); // 每次落子后都重绘棋盘和棋子，确保棋盘更新
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (boardState[r][c]) {
                    drawPiece(r, c, boardState[r][c]);
                }
            }
        }

        if (capturedCount > 0 && capturedKoPosition) {
            lastCapturedPosition = capturedKoPosition;
        } else {
            lastCapturedPosition = null;
        }

        // 切换玩家
        const movedPlayerColor = currentPlayer;
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black'; // 切换到 AI (白棋)

        // 重要: 获取 AI 落子建议并执行 AI 落子
        if (currentPlayer === 'white') {
            const aiMove = await getAiMoveFromBackend({ row: row, col: col }); // 将用户落子位置传递给后端 (可选，后端可能需要根据用户落子判断)
            if (aiMove) {
                const aiRow = aiMove.row;
                const aiCol = aiMove.col;

                if (boardState[aiRow][aiCol] === null) {
                    boardState[aiRow][aiCol] = currentPlayer; // AI 落子 (currentPlayer 此时已经是 'white')
                    drawPiece(aiRow, aiCol, currentPlayer); // 绘制 AI 棋子
                    const aiCaptureResult = capturePieces(aiRow, aiCol, currentPlayer); // AI 落子后也检查提子
                    const aiCapturedCount = aiCaptureResult.capturedCount;
                    const aiCapturedKoPosition = aiCaptureResult.capturedKoPosition;

                    // 检查 AI 自己是否有气
                    const visitedForAiGroup = Array(gridSize)
                        .fill(null)
                        .map(() => Array(gridSize).fill(false));
                    const aiGroup = getGroup(aiRow, aiCol, currentPlayer, visitedForAiGroup);
                    const aiLiberties = calculateGroupLiberties(aiGroup);

                    if (aiLiberties === 0 && aiCapturedCount === 0) {
                        // 撤销 AI 落子
                        boardState[aiRow][aiCol] = null;
                        alert(
                            'AI 进行了自杀落子。这应该不可能发生。'
                        );
                        // 切换回用户
                        currentPlayer = movedPlayerColor;
                        // 解除锁定
                        isProcessingMove = false;
                        return;
                    }

                    // 劫争历史检查
                    const aiCurrentState = JSON.stringify(boardState);
                    if (boardHistory.includes(aiCurrentState)) {
                        // 撤销 AI 落子
                        boardState[aiRow][aiCol] = null;
                        alert(
                            'AI 的落子导致棋盘状态重复（违反劫争规则）。这应该不可能发生。'
                        );
                        // 切换回用户
                        currentPlayer = movedPlayerColor;
                        // 解除锁定
                        isProcessingMove = false;
                        return;
                    }

                    // 添加 AI 落子后的状态到历史记录
                    boardHistory.push(aiCurrentState);

                    // 更新绘图
                    drawBoard(); // 重新绘制棋盘
                    for (let r = 0; r < gridSize; r++) {
                        for (let c = 0; c < gridSize; c++) {
                            if (boardState[r][c]) {
                                drawPiece(r, c, boardState[r][c]);
                            }
                        }
                    }

                    if (aiCapturedCount > 0 && aiCapturedKoPosition) {
                        lastCapturedPosition = aiCapturedKoPosition;
                    } else {
                        lastCapturedPosition = null;
                    }

                    // 切换回用户
                    currentPlayer = movedPlayerColor;
                } else {
                    console.warn(
                        'AI 返回了一个无效的落子位置（已被占用）：',
                        aiMove
                    );
                    currentPlayer = movedPlayerColor; // 切换回之前的玩家
                    alert(
                        'AI 返回了一个无效的落子位置（已被占用），请重新落子！'
                    );
                }
            } else {
                // 获取 AI 落子失败，切换回用户，让用户继续操作
                currentPlayer = movedPlayerColor;
                alert('AI 无法进行落子，请继续游戏。');
            }
        }

        // 解除锁定
        isProcessingMove = false;
    } else {
        alert('该位置已经有棋子，请选择其他位置落子!');
    }
}

function userClickHandler(event) {
    if (isProcessingMove) {
        // 如果当前正在处理其他落子，忽略新的点击
        return;
    }

    const boardPos = getBoardPosition(event);
    if (boardPos) {
        const row = boardPos.row;
        const col = boardPos.col;
        handleUserMove(row, col); // 调用 async 的事件处理函数
    }
}

// 绑定事件处理器
canvas.addEventListener('click', userClickHandler);

// 初始绘制棋盘
drawBoard();