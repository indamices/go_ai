from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/move', methods=['POST'])
def get_ai_move():
    """
    接收前端发送的用户落子信息，调用围棋 AI 模型 API，
    获取 AI 的落子建议，并返回给前端。
    (目前 AI 模型 API 接入部分先留空，只返回一个占位符)
    """
    data = request.get_json()
    user_move = data.get('move')  # 获取用户落子信息 (例如 {row: 3, col: 4})
    board_state = data.get('board_state') # 获取当前棋盘状态 (二维数组)

    print(f"收到用户落子: {user_move}")
    print(f"当前棋盘状态: {board_state}")

    #  TODO:  在这里调用围棋 AI 模型 API，获取 AI 的落子建议
    #...  AI 模型 API 调用代码...

    #  目前先返回一个占位符 AI 落子建议 (例如，AI 总是下在棋盘中心点)
    ai_move = {'row': 9, 'col': 9}  #  假设棋盘中心点坐标为 (9, 9)

    response = {
        'ai_move': ai_move
    }
    return jsonify(response)  #  将 AI 落子建议以 JSON 格式返回给前端


if __name__ == '__main__':
    app.run(debug=True, port=5000) #  在 5000 端口启动 Flask 应用，debug 模式方便开发