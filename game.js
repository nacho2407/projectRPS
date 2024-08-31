const VERSION = "0.0.1"

const SERVER_ADDR = 'ws://localhost';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 60000;

const btn_pair = document.getElementById('btn_pair');

const div_pair = document.getElementById('div_pair');
const div_selecting = document.getElementById('div_selecting');
const div_selecting_cards = document.getElementById('div_selecting_cards');
const div_game = document.getElementById('div_game');

const p_pair = document.getElementById('p_pair');
const p_selecting = document.getElementById('p_selecting');
const p_selecting_timer = document.getElementById('p_selecting_timer');
const p_selecting_cards = document.getElementById('p_selecting_cards');
const p_game_opponent = document.getElementById('p_game_opponent');
const p_game_timer = document.getElementById('p_game_timer');
const p_game_turn = document.getElementById('p_game_turn');
const p_game_win = document.getElementById('p_game_win');
const p_game_lose = document.getElementById('p_game_lose');

const span_game_playground = document.getElementById('span_game_playground');

let ws;

let is_ready = false;

let json_message;
let selecting_btns = [];
let timer;
let game_btns = [];

function connect_server()
{
        ws = new WebSocket(SERVER_ADDR + ':' + SERVER_PORT);

        const connection_timeout = setTimeout(() => {
                        ws.close();
                        
                        p_pair.innerHTML = '서버가 응답하지 않습니다.<br><br>다시 시도하십시오.';
                }, NETWORK_TIMEOUT);

        ws.onopen = () => {
                clearTimeout(connection_timeout);
                
                p_pair.innerHTML = '서버 접속 성공.<br><br>상대를 찾는 중...';
        };

        ws.onerror = () => {
                clearTimeout(connection_timeout);

                p_pair.innerHTML = '서버가 응답하지 않습니다.<br><br>다시 시도하십시오.';
        };

        ws.onmessage = (event) => {
                const message = event.data;

                try {
                        json_message = JSON.parse(message);
                
                        switch(json_message.type) {
                                case 'selecting':
                                        if(json_message.cur_turn == 1) {
                                                div_pair.style.display = 'none';
                                                div_selecting.style.display = 'block';

                                                for(let i = 0; i < json_message.selecting_pool.length; i++) {
                                                        const btn = document.createElement('button');
                                                        btn.textContent = json_message.selecting_pool[i].suit + ' ' + json_message.selecting_pool[i].number;
                                                        btn.style.width = '50px';
                                                        btn.style.height = '50px';
                                                        btn.id = 'btn_selecting' + i;
        
                                                        btn.addEventListener("click", () => {
                                                                clearInterval(timer);
        
                                                                for(let i = 0; i < json_message.selecting_pool.length; i++) {
                                                                        const btn = document.getElementById('btn_selecting' + i);
                                                                        btn.disabled = true;
                                                                }
                
                                                                if(json_message.cur_turn >= json_message.max_turn) {
                                                                        p_selecting.innerHTML = '상대의 선택을 기다리는 중...';
                                                                        p_selecting_cards.innerHTML = '나의 선택: { ' + json_message.cards.map(card => `${card.suit} ${card.number}`).join(', ') + ', ' + json_message.selecting_pool[num].suit + ' ' + json_message.selecting_pool[num].number + ' }';
                                                                        div_selecting_cards.style.display = 'none';
                                                                } else {
                                                                        p_selecting.innerHTML = '로딩중...';
                                                                        p_selecting_timer.innerHTML = '남은 시간: 0초';
                                                                }
                
                                                                ws.send(JSON.stringify({
                                                                        type: 'selecting',
                                                                        card: json_message.selecting_pool[i],
                                                                        cur_turn: json_message.cur_turn,
                                                                        max_turn: json_message.max_turn
                                                                }));
                                                        });
        
                                                        selecting_btns.push(btn);

                                                        div_selecting_cards.appendChild(btn);
                                                }
                                        } else {
                                                for(let i = 0; i < json_message.selecting_pool.length; i++) {
                                                        const btn = document.getElementById('btn_selecting' + i);
                                                        btn.textContent = json_message.selecting_pool[i].suit + ' ' + json_message.selecting_pool[i].number;
                                                        btn.disabled = false;
                                                }
                                        }

                                        p_selecting.innerHTML = '개수: ' + json_message.cur_turn + '/' + json_message.max_turn;

                                        let selecting_time_limit = json_message.time_limit;
                                        p_selecting_timer.innerHTML = '남은 시간: ' + selecting_time_limit + '초';
                                        timer = setInterval(() => {
                                                p_selecting_timer.innerHTML = '남은 시간: ' + (--selecting_time_limit) + '초';

                                                if(selecting_time_limit < 0)
                                                        selecting_btns[Math.floor(Math.random() * selecting_btns.length)].click();
                                        }, 1000);

                                        p_selecting_cards.innerHTML = '나의 선택: { ' + json_message.cards.map(card => `${card.suit} ${card.number}`).join(', ') + ' }';

                                        break;
                                case 'game':
                                        if(json_message.cur_turn == 1) {
                                                div_selecting.style.display = 'none';
                                                div_game.style.display = 'block';

                                                for(let i = 0; i < json_message.cards.length; i++) {
                                                        const btn = document.createElement('button');
                                                        btn.textContent = json_message.cards[i].suit + ' ' + json_message.cards[i].number;
                                                        btn.style.width = '50px';
                                                        btn.style.height = '50px';
                                                        btn.id = 'btn_game_card' + i;
        
                                                        btn.addEventListener("click", () => {
                                                                clearInterval(timer);

                                                                for(let i = 0; i < json_message.cards.length; i++) {
                                                                        const btn = document.getElementById('btn_game_card' + i);
                                                                        btn.disabled = true;
                                                                }

                                                                game_btns.splice(game_btns.findIndex(btn => btn.id == 'btn_game_card' + i), 1);
                                                                span_game_playground.removeChild(btn);
        
                                                                ws.send(JSON.stringify({
                                                                        type: 'game',
                                                                        card: json_message.cards[i]
                                                                }));
                                                        });
        
                                                        game_btns.push(btn);

                                                        span_game_playground.appendChild(btn);
                                                }
                                        } else {
                                                // 아래 부분 맞는지 확인. 차라리 버튼 다 삭제하고 다시 만드는게 더 나을수도?
                                                for(let i = 0; i < json_message.cards.length; i++) {
                                                        const btn = document.getElementById('btn_game_card' + i);
                                                        btn.textContent = json_message.cards[i].suit + ' ' + json_message.cards[i].number;
                                                        btn.disabled = false;
                                                }
                                        }

                                        p_game_opponent.innerHTML = '상대: ' + json_message.opponent;
                                        p_game_timer.innerHTML = '남은 시간: ' + json_message.time_limit + '초';

                                        p_game_turn.innerHTML = '턴: ' + json_message.cur_turn + '/' + json_message.max_turn;
                                        p_game_win.innerHTML = '승: ' + json_message.win;
                                        p_game_lose.innerHTML = '패: ' + json_message.lose;

                                        let game_time_limit = json_message.time_limit;
                                        p_game_timer.innerHTML = '남은 시간: ' + game_time_limit + '초';
                                        timer = setInterval(() => {
                                                p_game_timer.innerHTML = '남은 시간: ' + (--game_time_limit) + '초';

                                                if(game_time_limit < 0)
                                                        game_btns[Math.floor(Math.random() * game_btns.length)].click();
                                        }, 1000);

                                        break;
                        }
                } catch (e) {
                        switch(message) {
                                case 'paired':
                                        p_pair.innerHTML = 'Here Comes a New Challenger!';
                                        btn_pair.style.display = 'block';

                                        break;
                        }
                }
        };
}

document.addEventListener('DOMContentLoaded', () => {
        btn_pair.addEventListener('click', () => {
                if(!is_ready) {
                        is_ready = true;

                        ws.send('ready');

                        btn_pair.textContent = '상대 준비 대기중...';
                } else {
                        is_ready = false;

                        ws.send('unready');

                        btn_pair.textContent = '게임 준비';
                }
        });

        connect_server();
});
