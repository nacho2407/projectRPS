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

const p_pair = document.getElementById('p_pair');

let ws;

let is_ready = false;

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
                    const json_message = JSON.parse(message);
            
                    switch(json_message.type) {
                        case 'selecting':
                                if(json_message.cur_turn == 1) {
                                        div_pair.style.display = 'none';
                                        div_selecting.style.display = 'block';
                                }

                                p_selecting.innerHTML = '턴 ' + json_message.cur_turn + '/' + json_message.max_turn;

                                btn_selecting1.textContent = json_message.cards[0].suit + ' ' + json_message.cards[0].number;
                                btn_selecting2.textContent = json_message.cards[1].suit + ' ' + json_message.cards[1].number;
                                btn_selecting3.textContent = json_message.cards[2].suit + ' ' + json_message.cards[2].number;

                                // 시간 제한 추가 및 버튼 이벤트 추가/삭제

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
