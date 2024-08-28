const SERVER_ADDR = 'ws://localhost';
const SERVER_PORT = 8080;

const NETWORK_TIMEOUT = 60000;

const btn_pair = document.getElementById('btn_pair');
const div_pair = document.getElementById('div_pair');
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
                    
                    // JSON 파일인 경우
                    // 카드 덱 받아서 처리하기
                } catch (e) {
                    if (message === 'paired') {
                        p_pair.innerHTML = 'Here Comes a New Challenger!';
                        btn_pair.style.display = 'block';
                    }
                }
            };
}
