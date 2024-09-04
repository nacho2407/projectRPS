const VERSION = "0.0.1"

const SERVER_ADDR = 'ws://localhost';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 10000;
const WAITING_TIME = 3;

const btn_pair = document.getElementById('btn_pair');

const div_pair = document.getElementById('div_pair');
const div_selecting = document.getElementById('div_selecting');
const div_selecting_pool = document.getElementById('div_selecting_pool');
const div_game = document.getElementById('div_game');
const div_game_playground = document.getElementById('div_game_playground');

const p_pair = document.getElementById('p_pair');
const p_waiting = document.getElementById('p_waiting');
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

let timer;
let selecting_btns = [];
let game_btns = [];

let json_message;
let match_message;
let pool_message;
let game_message;
let result_message;

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
                                match_message = json_message;

                                p_pair.innerHTML = 'Here Comes a New Challenger! - ' + match_message.opponent;
                                btn_pair.style.display = 'block';

                                break;
                        case 'pool':
                                pool_message = json_message;

                                p_selecting.innerHTML = '개수: ' + pool_message.cur_turn + '/' + pool_message.max_turn;

                                let selecting_time_limit = pool_message.time_limit;
                                p_selecting_timer.innerHTML = '남은 시간: ' + selecting_time_limit + '초';
                                
                                if(pool_message.cur_turn == 1) {
                                        let wait = WAITING_TIME;
                                        p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br>남은 시간 : ' + WAITING_TIME + '초';
                                        div_pair.style.display = 'none';
                                        p_waiting.style.display = 'block';
                                        timer = setInterval(() => {
                                                p_pair.innerHTML = '잠시 후 게임이 시작됩니다.<br>남은 시간 : ' + --wait + '초';

                                                if(wait <= 0) {
                                                        clearInterval(timer);

                                                        for(let i = 0; i < pool_message.pool.length; i++) {
                                                                const btn = document.createElement('button');
                                                                btn.textContent = pool_message.pool[i].suit + ' ' + pool_message.pool[i].number;
                                                                btn.style.width = '75px';
                                                                btn.style.height = '75px';
                                                                btn.style.marginRight = '5px';
                                                                btn.id = 'btn_selecting' + i;
                
                                                                btn.addEventListener("click", () => {
                                                                        clearInterval(timer);
                
                                                                        for(let i = 0; i < pool_message.pool.length; i++) {
                                                                                const btn = document.getElementById('btn_selecting' + i);
                                                                                btn.disabled = true;
                                                                        }
                        
                                                                        if(pool_message.cur_turn >= pool_message.max_turn) {
                                                                                p_selecting.innerHTML = '상대의 선택을 기다리는 중...';
                                                                                p_selecting_hand.innerHTML = '나의 선택: { ' + pool_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ', ' + pool_message.pool[i].suit + ' ' + pool_message.pool[i].number + ' }';
                                                                                div_selecting_pool.style.display = 'none';
                                                                        } else {
                                                                                p_selecting.innerHTML = '로딩중...';
                                                                                p_selecting_timer.innerHTML = '남은 시간: 0초';
                                                                        }
                        
                                                                        ws.send(JSON.stringify({
                                                                                type: 'pool_select',
                                                                                card: pool_message.pool[i]
                                                                        }));
                                                                });
                
                                                                selecting_btns.push(btn);
                
                                                                div_selecting_pool.appendChild(btn);
                                                        }
                                        
                                                        p_waiting.style.display = 'none';
                                                        div_selecting.style.display = 'block';

                                                        timer = setInterval(() => {
                                                                p_selecting_timer.innerHTML = '남은 시간: ' + (--selecting_time_limit) + '초';
                        
                                                                if(selecting_time_limit <= 0)
                                                                        selecting_btns[Math.floor(Math.random() * selecting_btns.length)].click();
                                                        }, 1000);
                                                }
                                        }, 1000);
                                } else {
                                        for(let i = 0; i < pool_message.pool.length; i++) {
                                                const btn = document.getElementById('btn_selecting' + i);
                                                btn.textContent = pool_message.pool[i].suit + ' ' + pool_message.pool[i].number;
                                                btn.disabled = false;
                                        }
                                        
                                        timer = setInterval(() => {
                                                p_selecting_timer.innerHTML = '남은 시간: ' + (--selecting_time_limit) + '초';
        
                                                if(selecting_time_limit <= 0)
                                                        selecting_btns[Math.floor(Math.random() * selecting_btns.length)].click();
                                        }, 1000);
                                }

                                p_selecting_hand.innerHTML = '나의 선택: { ' + pool_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ' }';

                                break;
                        case 'game':
                                game_message = json_message;

                                let game_time_limit = game_message.time_limit;
                                p_game_timer.innerHTML = '남은 시간: ' + game_time_limit + '초';

                                if(game_message.cur_turn == 1) {
                                        let wait = WAITING_TIME
                                        p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br>남은 시간: ' + wait + '초';
                                        div_selecting.style.display = 'none';
                                        p_waiting.style.display = 'block';
                                        timer = setInterval(() => {
                                                // 시간 제한 부분 추가
                                                for(let i = 0; i < game_message.hand.length; i++) {
                                                        const btn = document.createElement('button');
                                                        btn.textContent = game_message.hand[i].suit + ' ' + game_message.hand[i].number;
                                                        btn.style.width = '75px';
                                                        btn.style.height = '75px';
                                                        btn.style.marginRight = '5px';
                                                        btn.id = 'btn_game_card' + i;
        
                                                        btn.addEventListener("click", () => {
                                                                clearInterval(timer);
        
                                                                for(let i = 0; i < game_message.hand.length; i++) {
                                                                        const btn = document.getElementById('btn_game_card' + i);
                                                                        btn.disabled = true;
                                                                }
        
                                                                // 카드의 고유번호만 이용하도록 변경
                                                                p_game_my.innerHTML = '나의 선택: ' + game_message.hand[i].suit + ' ' + game_message.hand[i].number;
        
                                                                game_btns.splice(game_btns.findIndex(btn => btn.id == 'btn_game_card' + i), 1);
                                                                div_game_playground.removeChild(btn);
        
                                                                ws.send(JSON.stringify({
                                                                        type: 'game_select',
                                                                        card: game_message.hand[i]
                                                                }));
                                                        });
        
                                                        game_btns.push(btn);
        
                                                        div_game_playground.appendChild(btn);
                                                }
                                        
                                                p_waiting.style.display = 'none';
                                                div_game.style.display = 'block';

                                                timer = setInterval(() => {
                                                        p_game_timer.innerHTML = '남은 시간: ' + (--game_time_limit) + '초';
                                                        
                                                        if(game_time_limit <= 0)
                                                                game_btns[Math.floor(Math.random() * game_btns.length)].click();
                                                }, 1000);
                                        }, 1000);

                                } else {
                                        // 서버에서 핸드를 다시 받아 버튼 재설정
                                        timer = setInterval(() => {
                                                p_game_timer.innerHTML = '남은 시간: ' + (--game_time_limit) + '초';
                                                
                                                if(game_time_limit <= 0)
                                                        game_btns[Math.floor(Math.random() * game_btns.length)].click();
                                        }, 1000);
                                }

                                p_game_turn.innerHTML = '턴: ' + game_message.cur_turn + '/' + game_message.max_turn;
                                p_game_win.innerHTML = '승: ' + game_message.win;
                                p_game_lose.innerHTML = '패: ' + game_message.lose;

                                break;
                        case 'pending':
                                p_game_opponent.innerHTML = '상대 선택 완료';

                                break;
                        case 'result':
                                result_message = json_message;

                                p_game_opponent.innerHTML = '상대 선택: ' + result_message.opponent.suit + ' ' + result_message.opponent.number;

                                if(result_message.result == 'win') {
                                        p_game_timer.innerHTML = '승리';
                                        p_game_win.innerHTML = '승: ' + result_message.win;
                                } else {
                                        p_game_timer.innerHTML = '패배';
                                        p_game_lose.innerHTML = '패: ' + result_message.lose;
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
