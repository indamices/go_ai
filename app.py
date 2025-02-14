from flask import Flask, request, jsonify, send_from_directory
import os
import config
import google.generativeai as genai
import json
import re

app = Flask(__name__, static_folder='static')

# Configure the Gemini API client
genai.configure(api_key=config.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# 棋局历史记录
game_history = []

def is_valid_move(row, col, board_state):
    """
    判断 AI 的落子位置是否合法
    """
    if row < 0 or row >= 19 or col < 0 or col >= 19:
        return False
    if board_state[row][col] is not None:
        return False
    return True

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html', mimetype='text/html')

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

    ai_move = {'row': 9, 'col': 9}  # 默认落子位置

    for i in range(3):  # 尝试 3 次
        # 构建与 Gemini API 通信的 prompt
        prompt = f"""
        Hello, I will play a game of Go on a 19x19 board with you. I will tell you the position where I place my black stone, and you will play against me with white stones. We will follow the standard Go game rules. Do not play on positions that I have already played on or positions that already have stones. Follow the standard Go rules to play against me. You will try your best to win the game within the rules.

        Current board state: {board_state}
        """

        # 将棋局历史记录添加到 prompt 中
        prompt += "\n".join(game_history)

        prompt += f"""
        My move: {user_move}
        Please provide your move in JSON format, for example: {{'row': 9, 'col': 9}}
        """

        # Send the prompt to the Gemini API
        response = model.generate_content(prompt)
        print(f"Gemini API Response: {response.text}")

        # 解析 Gemini API 返回的落子位置
        try:
            # 使用正则表达式替换单引号为双引号
            json_string = re.sub(r"'(.*?)'", r'"\1"', response.text)
            ai_move = json.loads(json_string)
            if not isinstance(ai_move, dict) or 'row' not in ai_move or 'col' not in ai_move:
                raise ValueError("Invalid AI move format")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing AI move: {e}")
            ai_move = {'row': 9, 'col': 9}  # 如果解析失败，则返回一个占位符 AI 落子建议
            continue

        # 判断 AI 的落子位置是否合法
        if is_valid_move(ai_move['row'], ai_move['col'], board_state):
            break  # 如果落子位置合法，则跳出循环
        else:
            print("Invalid AI move, retrying...")
            game_history.append("Invalid AI move, retrying...") # 记录无效落子
            continue # 如果落子位置不合法，则重新尝试

    # 将用户的落子位置添加到棋局历史记录中
    game_history.append(f"您的落子位置为：{user_move}")

    # 将 AI 的落子位置添加到棋局历史记录中
    game_history.append(f"AI 的落子位置为：{ai_move}")

    response = {
        'ai_move': ai_move
    }
    return jsonify(response)  #  将 AI 落子建议以 JSON 格式返回给前端


if __name__ == '__main__':
    app.run(debug=True, port=5000) #  在 5000 端口启动 Flask 应用，debug 模式方便开发
