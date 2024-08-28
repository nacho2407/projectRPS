const ws = null;

document.addEventListener('DOMContentLoaded', function() {
        var div_start = document.getElementById('div_start');
        var div_pair = document.getElementById('div_pair');

        var btn_start = document.getElementById('btn_start');

        btn_start.addEventListener('click', function() {
                div_start.style.display = 'none';
                div_pair.style.display = 'block';
                game_start();
        });
});

function game_start()
{
        // 작성 예정
}
