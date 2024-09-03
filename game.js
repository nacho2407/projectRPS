const VERSION = "0.0.1"

const SERVER_ADDR = 'ws://localhost';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 10000;

const btn_pair = document.getElementById('btn_pair');

const div_pair = document.getElementById('div_pair');
const div_selecting = document.getElementById('div_selecting');
const div_selecting_pool = document.getElementById('div_selecting_pool');
const div_game = document.getElementById('div_game');
const div_game_playground = document.getElementById('div_game_playground');

const p_pair = document.getElementById('p_pair');
const p_selecting = document.getElementById('p_selecting');
const p_selecting_timer = document.getElementById('p_selecting_timer');
const p_selecting_hand = document.getElementById('p_selecting_hand');
const p_game_opponent = document.getElementById('p_game_opponent');
const p_game_timer = document.getElementById('p_game_timer');
const p_game_my = document.getElementById('p_game_my');
const p_game_turn = document.getElementById('p_game_turn');
const p_game_win = document.getElementById('p_game_win');
const p_game_lose = document.getElementById('p_game_lose');

let ws;

let is_ready = false;

let json_message;
let timer;
let selecting_btns = [];
let game_btns = [];

document.addEventListener('DOMContentLoaded', () => {
        btn_pair.addEventListener('click', () => {
                if(!is_ready) {
                        is_ready = true;

                        ws.send(JSON.stringify({
                                type: 'ready'
                        }));

                        btn_pair.textContent = '상대 준비 대기중...';
                } else {
                        is_ready = false;

                        ws.send(JSON.stringify({
                                type: 'unready'
                        }));

                        btn_pair.textContent = '게임 준비';
                }
        });

        connect_server();
});

function connect_server()
{
        ws = new WebSocket(SERVER_ADDR + ':' + SERVER_PORT);

        const connection_timeout = setTimeout(() => {
                ws.close();
                
                p_pair.innerHTML = '연결 시간 초과.<br><br>다시 시도하십시오.';
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
                json_message = JSON.parse(event.data);
        
                switch(json_message.type) {
                        case 'match':
                                p_pair.innerHTML = 'Here Comes a New Challenger! - ' + json_message.opponent;
                                btn_pair.style.display = 'block';

                                break;
                        case 'pool':
                                p_selecting.innerHTML = '개수: ' + json_message.cur_turn + '/' + json_message.max_turn;

                                let selecting_time_limit = json_message.time_limit;
                                p_selecting_timer.innerHTML = '남은 시간: ' + selecting_time_limit + '초';
                                
                                if(json_message.cur_turn == 1) {
                                        div_pair.style.display = 'none';
                                        div_selecting.style.display = 'block';

                                        for(let i = 0; i < json_message.pool.length; i++) {
                                                const btn = document.createElement('button');
                                                btn.textContent = json_message.pool[i].suit + ' ' + json_message.pool[i].number;
                                                btn.style.width = '75px';
                                                btn.style.height = '75px';
                                                btn.style.marginRight = '5px';
                                                btn.id = 'btn_selecting' + i;

                                                btn.addEventListener("click", () => {
                                                        clearInterval(timer);

                                                        for(let i = 0; i < json_message.pool.length; i++) {
                                                                const btn = document.getElementById('btn_selecting' + i);
                                                                btn.disabled = true;
                                                        }
        
                                                        if(json_message.cur_turn >= json_message.max_turn) {
                                                                p_selecting.innerHTML = '상대의 선택을 기다리는 중...';
                                                                p_selecting_hand.innerHTML = '나의 선택: { ' + json_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ', ' + json_message.pool[i].suit + ' ' + json_message.pool[i].number + ' }';
                                                                div_selecting_pool.style.display = 'none';
                                                        } else {
                                                                p_selecting.innerHTML = '로딩중...';
                                                                p_selecting_timer.innerHTML = '남은 시간: 0초';
                                                        }
        
                                                        ws.send(JSON.stringify({
                                                                type: 'pool_select',
                                                                card: json_message.pool[i]
                                                        }));
                                                });

                                                selecting_btns.push(btn);

                                                div_selecting_pool.appendChild(btn);
                                        }
                                } else {
                                        for(let i = 0; i < json_message.pool.length; i++) {
                                                const btn = document.getElementById('btn_selecting' + i);
                                                btn.textContent = json_message.pool[i].suit + ' ' + json_message.pool[i].number;
                                                btn.disabled = false;
                                        }
                                }

                                timer = setInterval(() => {
                                        p_selecting_timer.innerHTML = '남은 시간: ' + (--selecting_time_limit) + '초';

                                        if(selecting_time_limit <= 0)
                                                selecting_btns[Math.floor(Math.random() * selecting_btns.length)].click();
                                }, 1000);

                                p_selecting_hand.innerHTML = '나의 선택: { ' + json_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ' }';

                                break;
                        case 'game':
                                p_game_timer.innerHTML = '남은 시간: ' + json_message.time_limit + '초';

                                let game_time_limit = json_message.time_limit;
                                p_game_timer.innerHTML = '남은 시간: ' + game_time_limit + '초';

                                if(json_message.cur_turn == 1) {
                                        // 게임 시작까지 대기 시간 넣기
                                        
                                        div_selecting.style.display = 'none';
                                        div_game.style.display = 'block';

                                        for(let i = 0; i < json_message.hand.length; i++) {
                                                const btn = document.createElement('button');
                                                btn.textContent = json_message.hand[i].suit + ' ' + json_message.hand[i].number;
                                                btn.style.width = '75px';
                                                btn.style.height = '75px';
                                                btn.style.marginRight = '5px';
                                                btn.id = 'btn_game_card' + i;

                                                btn.addEventListener("click", () => {
                                                        clearInterval(timer);

                                                        for(let i = 0; i < json_message.hand.length; i++) {
                                                                const btn = document.getElementById('btn_game_card' + i);
                                                                btn.disabled = true;
                                                        }

                                                        // 카드의 고유번호만 이용하도록 변경
                                                        p_game_my.innerHTML = '나의 선택: ' + json_message.hand[i].suit + ' ' + json_message.hand[i].number;

                                                        game_btns.splice(game_btns.findIndex(btn => btn.id == 'btn_game_card' + i), 1);
                                                        div_game_playground.removeChild(btn);

                                                        ws.send(JSON.stringify({
                                                                type: 'game_select',
                                                                card: json_message.hand[i]
                                                        }));
                                                });

                                                game_btns.push(btn);

                                                div_game_playground.appendChild(btn);
                                        }
                                } else {
                                        // 서버에서 핸드를 다시 받아 버튼 재설정
                                }

                                timer = setInterval(() => {
                                        p_game_timer.innerHTML = '남은 시간: ' + (--game_time_limit) + '초';
                                        
                                        if(game_time_limit <= 0)
                                                game_btns[Math.floor(Math.random() * game_btns.length)].click();
                                }, 1000);

                                p_game_turn.innerHTML = '턴: ' + json_message.cur_turn + '/' + json_message.max_turn;
                                p_game_win.innerHTML = '승: ' + json_message.win;
                                p_game_lose.innerHTML = '패: ' + json_message.lose;

                                break;
                        case 'pending':
                                p_game_opponent.innerHTML = '상대 선택 완료';

                                break;
                        case 'result':
                                p_game_opponent.innerHTML = '상대 선택: ' + json_message.opponent.suit + ' ' + json_message.opponent.number;

                                if(json_message.result == 'win') {
                                        p_game_timer.innerHTML = '승리';
                                        p_game_win.innerHTML = '승: ' + json_message.win;
                                } else {
                                        p_game_timer.innerHTML = '패배';
                                        p_game_lose.innerHTML = '패: ' + json_message.lose;
                                }

                                timer = setTimeout(() => {
                                        // 다음 턴
                                }, 3000);

                                break;
                        default:
                                console.log('Unknown message type: ' + json_message.type);
                };
        };
}

// 카드 고유번호로 카드 객체를 찾는 함수 추가
