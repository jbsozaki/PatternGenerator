

// メンバ変数
let m_canvas;
let m_context;

// 仮:定数
const WIDTH = 3840;
const HEIGHT = 1200;


//------------------------------------------------------------------
// Onload
window.onload = () => {
    
    DrawPatter();

    //SaveCanvas(m_canvas, "all.png");
    
    //CopyCanvas();
}

function DrawPatter() {
    m_canvas = document.querySelector('.canvas'); // Canvasの取得
    m_context = m_canvas.getContext('2d'); // Canvasからコンテキスを取得

    SetCanvasSize(m_canvas, WIDTH, HEIGHT);

    // 背景描画
    m_context.fillStyle = 'black'; // 描画の塗り色を決める
    m_context.fillRect(0, 0, WIDTH, HEIGHT); // 位置とサイズを決めて描画

    m_context.strokeStyle = "white";
    m_context.strokeRect(20, 10, 160, 100);

    m_context.strokeStyle = "yellow";
    m_context.strokeRect(420, 10, 160, 100);

    document.querySelector("#btn1").addEventListener("click", clickDownloadButton);
    document.querySelector("#btn-draw").addEventListener("click", clickButton);
}

// キャンバスコピー
function CopyCanvas() {
    let canvas = document.createElement( 'canvas' );
    document.body.appendChild( canvas );
    let context = canvas.getContext('2d');
    SetCanvasSize(canvas, 500, 500);
    var image = m_context.getImageData(20, 20, 100, 100);
    context.putImageData(image, 100, 100);
    SaveCanvas(canvas, "trim.png");
    document.body.removeChild( canvas );
}

// Canvas サイズ設定
function SetCanvasSize(canvas, nWidth, nHeight) {
    canvas.width=nWidth;
    canvas.height=nHeight;
}

// Download ボタンクリック
function clickDownloadButton() {
    SaveCanvas(m_canvas, "all.png");
}

// Download ボタンクリック
function clickDownloadButton() {
    SaveCanvas(m_canvas, "all.png");
}

// 画像保存
function SaveCanvas(canvas, strFileName) {
    let img = canvas.toDataURL();
    let a = document.createElement( 'a' );
    a.href = img;
    a.download = strFileName;
    document.body.appendChild( a );
    a.click();
    document.body.removeChild( a );
}

//  未使用 : オブジェクト生成待ち
/*
function waitForElement(selector, intervalMs, timeoutMs, callback) {
    const startTimeInMs = Date.now();
    findLoop();
    function findLoop() {
        if (document.querySelector(selector) != null) {
            callback();
            return;
        } else {
            setTimeout(() => {
                if (timeoutMs && Date.now() - startTimeInMs > timeoutMs) return;
                findLoop();
            }, intervalMs);
        }
    }
}
    */