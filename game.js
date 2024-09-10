const VERSION = "0.1.0"

const SERVER_ADDR = 'ws://jmj0ok.iptime.org';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 10000;
const WAITING_TIME = 3;

const btn_pair = document.getElementById('btn_pair');

const div_pair = document.getElementById('div_pair');
const div_selecting = document.getElementById('div_selecting');
const div_selecting_pool = document.getElementById('div_selecting_pool');
const div_game = document.getElementById('div_game');
const div_game_playground = document.getElementById('div_game_playground');

const p_forfeiture = document.getElementById('p_forfeiture');
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

let interval;
let selecting_btns = [];
let game_btns = [];
let timer;

let json_message;
let match_message;
let pool_message;
let game_message;
let result_message;

let div_final;
let btn_final;

let is_ready = false;

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

        timer = setTimeout(() => {
                ws.close();
                
                p_pair.innerHTML = '연결 시간 초과.<br><br>다시 시도하십시오.';
        }, NETWORK_TIMEOUT);

        ws.onopen = () => {
                clearTimeout(timer);
                
                p_pair.innerHTML = '서버 접속 성공.<br><br>상대를 찾는 중...';
        };

        ws.onerror = () => {
                clearTimeout(timer);

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
                                p_forfeiture.style.display = 'none';

                                pool_message = json_message;

                                p_selecting.innerHTML = '개수: ' + pool_message.cur_turn + '/' + pool_message.max_turn;

                                let selecting_time_limit = pool_message.time_limit;
                                p_selecting_timer.innerHTML = '남은 시간: ' + selecting_time_limit + '초';
                                
                                if(pool_message.cur_turn == 1) {
                                        let wait = WAITING_TIME;
                                        p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br><br>' + WAITING_TIME;
                                        div_pair.style.display = 'none';
                                        p_waiting.style.display = 'block';
                                        interval = setInterval(() => {
                                                p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br><br>' + (--wait);

                                                if(wait <= 0) {
                                                        clearInterval(interval);

                                                        show_pool(pool_message.pool, selecting_time_limit);
                                        
                                                        p_waiting.style.display = 'none';
                                                        div_selecting.style.display = 'block';
                                                }
                                        }, 1000);
                                } else {
                                        show_pool(pool_message.pool, selecting_time_limit);
                                }

                                p_selecting_hand.innerHTML = '나의 선택: { ' + pool_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ' }';

                                break;
                        case 'game':
                                game_message = json_message;

                                let game_time_limit = game_message.time_limit;
                                p_game_timer.innerHTML = '남은 시간: ' + game_time_limit + '초';

                                if(game_message.cur_turn == 1) {
                                        let wait = WAITING_TIME
                                        p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br><br>' + wait;

                                        div_selecting.style.display = 'none';
                                        div_selecting_pool.style.display = 'block';
                                        p_waiting.style.display = 'block';

                                        interval = setInterval(() => {
                                                p_waiting.innerHTML = '잠시 후 게임이 시작됩니다.<br><br>' + (--wait);

                                                if(wait <= 0) {
                                                        clearInterval(interval)

                                                        show_hand(game_message.hand, game_time_limit);
                                                
                                                        p_waiting.style.display = 'none';
                                                        div_game.style.display = 'block';
                                                }
                                        }, 1000);

                                } else {
                                        p_game_opponent.innerHTML = '상대 선택 중...';
                                        p_game_my.innerHTML = '나의 선택';

                                        show_hand(game_message.hand, game_time_limit);
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
                                        ws.send(JSON.stringify({
                                                type: 'next'
                                        }));
                                }, WAITING_TIME * 1000);

                                break;
                        case 'final':
                                final_message = json_message;
                                
                                div_game.style.display = 'none';
                                
                                /* It won't show up if you just write it at the end of the HTML.
                                   Probably due to the style of div_game. */
                                div_final = document.createElement('div');
                                div_final.id = 'div_final';
                                div_final.style.display = 'none';
                                div_final.innerHTML = '<p>게임 종료!</p>\
                                        <p id="p_final">최종 결과</p>\
                                        <table style="text-align: center;">\
                                                <tr id="tr_final_turn">\
                                                        <th>턴</th>\
                                                </tr>\
                                                <tr id="tr_final_my">\
                                                        <th>내 선택</th>\
                                                </tr>\
                                                <tr id="tr_final_result">\
                                                        <th>결과</th>\
                                                </tr>\
                                                <tr id="tr_final_opponent">\
                                                        <th>상대 선택</th>\
                                                </tr>\
                                        </table>\
                                        <br>\
                                        <button id="btn_final">다시하기</button>';

                                document.body.appendChild(div_final);

                                btn_final = document.getElementById('btn_final');
                                
                                const p_final = document.getElementById('p_final');
                                const tr_final_turn = document.getElementById('tr_final_turn');
                                const tr_final_my = document.getElementById('tr_final_my');
                                const tr_final_result = document.getElementById('tr_final_result');
                                const tr_final_opponent = document.getElementById('tr_final_opponent');

                                p_final.innerHTML = '최종 결과 - ' + final_message.final;

                                for(let i = 1; i <= final_message.log.length; i++) {
                                        const td = document.createElement('td');
                                        td.textContent = i;
                                        tr_final_turn.appendChild(td);
                                }

                                for(const card of final_message.log) {
                                        const td = document.createElement('td');
                                        td.textContent = card.suit + ' ' + card.number;
                                        tr_final_my.appendChild(td);
                                }

                                for(const result of final_message.results) {
                                        const td = document.createElement('td');
                                        td.textContent = result;
                                        tr_final_result.appendChild(td);
                                }

                                for(const card of final_message.opponent_log) {
                                        const td = document.createElement('td');
                                        td.textContent = card.suit + ' ' + card.number;
                                        tr_final_opponent.appendChild(td);
                                }

                                btn_final.addEventListener('click', () => {
                                        document.body.removeChild(div_final);

                                        p_pair.innerHTML = '상대를 찾는 중...';
                                        btn_pair.textContent = '게임 준비';
                                        btn_pair.style.display = 'none';

                                        is_ready = false;

                                        div_pair.style.display = 'block';

                                        ws.send(JSON.stringify({
                                                type: 'again'
                                        }));
                                });

                                div_final.style.display = 'block';

                                break;
                        case 'forfeited':
                                p_forfeiture.innerHTML = '비정상적인 접근입니다. 다시 접속하십시오.';

                                div_selecting.style.display = 'none';
                                div_game.style.display = 'none';

                                p_forfeiture.style.display = 'block';

                                break;
                        case 'opponent_leave':
                                clearInterval(interval);
                                clearTimeout(timer);

                                div_pair.style.display = 'none';
                                p_waiting.style.display = 'none';
                                div_selecting.style.display = 'none';

                                p_pair.innerHTML = '상대를 찾는 중...';
                                btn_pair.textContent = '게임 준비';
                                btn_pair.style.display = 'none';

                                is_ready = false;

                                p_forfeiture.style.display = 'block';
                                div_pair.style.display = 'block';

                                ws.send(JSON.stringify({
                                        type: 'again'
                                }));

                                break;
                        case 'opponent_forfeited':
                                clearInterval(interval);
                                clearTimeout(timer);
                                
                                p_waiting.style.display = 'none';
                                div_game.style.display = 'none';

                                div_final = document.createElement('div');
                                div_final.id = 'div_final';
                                div_final.style.display = 'none';
                                div_final.innerHTML = '<p>상대방이 게임을 떠났습니다.</p>\
                                        <p id="p_final">최종 결과: 승리!</p>\
                                        <br>\
                                        <button id="btn_final">다시하기</button>';

                                document.body.appendChild(div_final);

                                btn_final = document.getElementById('btn_final');

                                btn_final.addEventListener('click', () => {
                                        document.body.removeChild(div_final);

                                        p_pair.innerHTML = '상대를 찾는 중...';
                                        btn_pair.textContent = '게임 준비';
                                        btn_pair.style.display = 'none';

                                        is_ready = false;

                                        div_pair.style.display = 'block';

                                        ws.send(JSON.stringify({
                                                type: 'again'
                                        }));
                                });

                                div_final.style.display = 'block';

                                break;
                        default:
                                console.log('Unknown message type: ' + json_message.type);
                };
        };
}

function show_pool(pool, time_limit)
{
        for(const btn of selecting_btns)
                div_selecting_pool.removeChild(btn);
        selecting_btns = [];

        for(let i = 0; i < pool_message.pool.length; i++) {
                const btn = document.createElement('button');
                btn.textContent = pool[i].suit + ' ' + pool[i].number;
                btn.style.width = '75px';
                btn.style.height = '75px';
                btn.style.marginRight = '5px';
                btn.id = 'btn_selecting' + i;

                btn.addEventListener("click", () => {
                        clearInterval(interval);

                        for(let i = 0; i < pool.length; i++) {
                                const btn = document.getElementById('btn_selecting' + i);
                                btn.disabled = true;
                        }

                        if(pool_message.cur_turn >= pool_message.max_turn) {
                                p_selecting.innerHTML = '상대의 선택을 기다리는 중...';
                                p_selecting_hand.innerHTML = '나의 선택: { ' + pool_message.hand.map(card => `${card.suit} ${card.number}`).join(', ') + ', ' + pool[i].suit + ' ' + pool[i].number + ' }';
                                div_selecting_pool.style.display = 'none';
                        } else {
                                p_selecting.innerHTML = '로딩중...';
                                p_selecting_timer.innerHTML = '남은 시간: 0초';
                        }

                        ws.send(JSON.stringify({
                                type: 'pool_select',
                                card: pool[i].eigen
                        }));
                });

                selecting_btns.push(btn);

                div_selecting_pool.appendChild(btn);
        }

        interval = setInterval(() => {
                p_selecting_timer.innerHTML = '남은 시간: ' + (--time_limit) + '초';

                if(time_limit <= 0)
                        selecting_btns[Math.floor(Math.random() * selecting_btns.length)].click();
        }, 1000);
}

function show_hand(hand, time_limit)
{
        for(const btn of game_btns)
                div_game_playground.removeChild(btn);
        game_btns = [];

        for(let i = 0; i < hand.length; i++) {
                const btn = document.createElement('button');
                btn.textContent = hand[i].suit + ' ' + hand[i].number;
                btn.style.width = '75px';
                btn.style.height = '75px';
                btn.style.marginRight = '5px';
                btn.id = 'btn_game_card' + i;

                btn.addEventListener("click", () => {
                        clearInterval(interval);

                        for(const card of game_btns)
                                card.disabled = true;

                        p_game_my.innerHTML = '나의 선택: ' + hand[i].suit + ' ' + hand[i].number;

                        game_btns.splice(game_btns.findIndex(btn => btn.id == 'btn_game_card' + i), 1);
                        div_game_playground.removeChild(btn);

                        ws.send(JSON.stringify({
                                type: 'game_select',
                                card: hand[i].eigen
                        }));
                });

                game_btns.push(btn);

                div_game_playground.appendChild(btn);
        }

        interval = setInterval(() => {
                p_game_timer.innerHTML = '남은 시간: ' + (--time_limit) + '초';
                
                if(time_limit <= 0)
                        game_btns[Math.floor(Math.random() * game_btns.length)].click();
        }, 1000);
}
