const VERSION = "0.0.1"

const SERVER_ADDR = 'ws://localhost';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 60000;

const btn_pair = document.getElementById('btn_pair');
const btn_selecting1 = document.getElementById('btn_selecting1');
const btn_selecting2 = document.getElementById('btn_selecting2');
const btn_selecting3 = document.getElementById('btn_selecting3');

const div_pair = document.getElementById('div_pair');
const div_selecting = document.getElementById('div_selecting');
const div_selecting_cards = document.getElementById('div_selecting_cards');

const p_pair = document.getElementById('p_pair');
const p_selecting = document.getElementById('p_selecting');
const p_selecting_timer = document.getElementById('p_selecting_timer');
const p_selecting_cards = document.getElementById('p_selecting_cards');

let ws;

let is_ready = false;
let is_loading = true;

let json_message;
let timer;

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
                                        is_loading = false;
                                        
                                        if(json_message.cur_turn == 1) {
                                                div_pair.style.display = 'none';
                                                div_selecting.style.display = 'block';
                                        }

                                        p_selecting.innerHTML = '개수: ' + json_message.cur_turn + '/' + json_message.max_turn;

                                        btn_selecting1.textContent = json_message.selecting_pool[0].suit + ' ' + json_message.selecting_pool[0].number;
                                        btn_selecting2.textContent = json_message.selecting_pool[1].suit + ' ' + json_message.selecting_pool[1].number;
                                        btn_selecting3.textContent = json_message.selecting_pool[2].suit + ' ' + json_message.selecting_pool[2].number;

                                        const select = function(num) {
                                                if(is_loading)
                                                        return;

                                                is_loading = true;

                                                clearInterval(timer);

                                                if(json_message.cur_turn >= json_message.max_turn) {
                                                        p_selecting.innerHTML = '상대의 선택을 기다리는 중...';
                                                        p_selecting_cards.innerHTML = '나의 선택: { ' + json_message.cards.map(card => `${card.suit} ${card.number}`).join(', ') + ', ' + json_message.selecting_pool[num].suit + ' ' + json_message.selecting_pool[num].number + ' }';
                                                        div_selecting_cards.style.display = 'none';
                                                } else {
                                                        p_selecting.innerHTML = '로딩중...';
                                                        p_selecting_timer.innerHTML = '남은 시간: 0초';
                                                        btn_selecting1.innerHTML = '로딩중...';
                                                        btn_selecting2.innerHTML = '로딩중...';
                                                        btn_selecting3.innerHTML = '로딩중...';
                                                }

                                                ws.send(JSON.stringify({
                                                        type: 'selecting',
                                                        card: json_message.selecting_pool[num],
                                                        cur_turn: json_message.cur_turn,
                                                        max_turn: json_message.max_turn
                                                }));
                                        }

                                        btn_selecting1.addEventListener("click", () => { select(0); });
                                        btn_selecting2.addEventListener("click", () => { select(1); });
                                        btn_selecting3.addEventListener("click", () => { select(2); });

                                        let time_limit = json_message.time_limit;
                                        p_selecting_timer.innerHTML = '남은 시간: ' + time_limit + '초';
                                        timer = setInterval(() => {
                                                p_selecting_timer.innerHTML = '남은 시간: ' + (--time_limit) + '초';

                                                if(time_limit < 0)
                                                        select(Math.floor(Math.random() * 3));
                                        }, 1000);

                                        p_selecting_cards.innerHTML = '나의 선택: { ' + json_message.cards.map(card => `${card.suit} ${card.number}`).join(', ') + ' }';

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
