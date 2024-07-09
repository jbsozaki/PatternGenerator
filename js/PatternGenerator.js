

//定数
const COLOR_TABLE = ["red", "blue", "green", "fuchsia", "teal", "lime", "olive"];
const BG_MODE_None = 0;
const BG_MODE_CROSS = 1;
const BG_MODE_WARD = 2;
const BG_MODE_FILE = 3;
//------------------------------------------------------------------
const ALPHABET_WORDS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";


//######################################################################################
// パラメータデータ クラス
//######################################################################################
class Parameter {
	nAllWidth;
	nAllHeight;
	nScreenNumX;
	nScreenNumY;
	nWidth;
	nHeight;
	nBrandingWidth;
	nBrandingHeight;
	nMaskLeft;
	nMaskRight;
	nMaskTop;
	nMaskBottom;
}
//------------------------------------------------------------------
// メンバ変数
let m_canvas;
let m_context;
let m_prmLastGen;   // 前回生成した際のパラメータ
let m_nAllWidth;
let m_nAllHeight;
let m_nScreenNumX;
let m_nScreenNumY;
let m_nWidth;
let m_nHeight;
let m_nBrandingWidth;
let m_nBrandingHeight;
let m_nMaskLeft;
let m_nMaskRight;
let m_nMaskTop;
let m_nMaskBottom;
let m_arrayImg;
let m_arrayIsLoadedImg;
let m_nLastGenerateBGMode;
let m_nLastScreenNum;

//------------------------------------------------------------------
// Onload
window.onload = () => {
    m_nLastGenerateBGMode = BG_MODE_None;
    m_nBgMode = BG_MODE_CROSS;
    m_arrayImg = new Array();
    m_arrayIsLoadedImg = new Array();

    GetCurrentParameters();    // 現在の設定値を取得
    m_nLastScreenNum = 0;
    ReCreateFileSelectControls();
    m_nLastScreenNum = m_nScreenNumX * m_nScreenNumY;
    
    //SaveCanvas(m_canvas, "all.png");
    // イベントリスナー登録
    document.querySelector("#btn1").addEventListener("click", clickDownloadButton);
    document.querySelector("#btn-draw").addEventListener("click", clickDrawButton);
    document.querySelector("#radio-1").addEventListener("change", changeRadio);
    document.querySelector("#radio-2").addEventListener("change", changeRadio);
    document.querySelector("#radio-3").addEventListener("change", changeRadio);
    document.querySelector("#screen-num-x").addEventListener("change", changeScreenNumInput);
    document.querySelector("#screen-num-y").addEventListener("change", changeScreenNumInput);
    document.querySelector("#all-width").addEventListener("change", changeInputDefault);
    document.querySelector("#all-height").addEventListener("change", changeInputDefault);
    document.querySelector("#screen-width").addEventListener("change", changeInputDefault);
    document.querySelector("#screen-height").addEventListener("change", changeInputDefault);
    document.querySelector("#mask-left").addEventListener("change", changeInputDefault);
    document.querySelector("#mask-right").addEventListener("change", changeInputDefault);
    document.querySelector("#mask-top").addEventListener("change", changeInputDefault);
    document.querySelector("#mask-bottom").addEventListener("change", changeInputDefault);
}

//------------------------------------------------------------------

// 画像生成 ボタンクリック
function clickDrawButton() {
    console.log("click");
    GetCurrentParameters();

    // 描画 保存用
    m_nLastGenerateBGMode = GetBackgroundMode();
    m_canvas = document.querySelector('#canvas'); // Canvasの取得
    m_context = m_canvas.getContext('2d'); // Canvasからコンテキスを取得
    DrawPattern(m_canvas, 1.0);

    // 描画 表示用
    canvas = document.querySelector('#canvas2'); // Canvasの取得
    let dbRate = window.innerWidth / m_nAllWidth;
    if(1.0 < dbRate) {
        dbRate = 1.0;
    }
    DrawPattern(canvas, dbRate);

    // select
    SetSelectOption();

    // download button enable
    SetStyleDisplay("canvas2", "block");
    SetStyleDisplay("btn1", "block");
    SetStyleDisplay("select", "block");
}

// Download ボタンクリック
function clickDownloadButton() {
    m_canvas = document.querySelector('#canvas'); // Canvasの取得

    let elem = document.querySelector('#select'); // Canvasの取得
    let nSelectIndex = elem.selectedIndex;

    if(nSelectIndex == 0) {
        if(m_nLastGenerateBGMode == BG_MODE_FILE) {
            DrawPattern(m_canvas, 1.0); // 背景表示が画像ファイルのモードの場合、再描画してから保存する
        }
        SaveCanvas(m_canvas, "all.png");
    } else {
        let nIndexX = parseInt((nSelectIndex - 1) % m_nScreenNumX);
        let nIndexY = parseInt((nSelectIndex - 1) / m_nScreenNumX);
        if(m_nLastGenerateBGMode != BG_MODE_FILE) {
            SaveCropCanvas(m_canvas, GetPositionX(nIndexX), GetPositionY(nIndexY), m_nWidth, m_nHeight, "vp_" + nSelectIndex +".png");
        } else {
            context = m_canvas.getContext('2d'); // Canvasからコンテキスを取得
            context.fillStyle = 'gray'; // 描画の塗り色を決める
            context.fillRect(0, 0, m_nAllWidth, m_nAllHeight);    // 背景色グレー
            // 背景が画像ファイルの場合再描画
            DrawBackgroundImage(context, nIndexX, nIndexY, 1.0);
            // マスク描画
            DrawMask(context, 1.0);
            // 中心線描画
            DrawCenterLine(context, 1.0);
            // スクリーンごとのRect描画
            DrawScreenBorder(context, 1.0);
            SaveCropCanvas(m_canvas, GetPositionX(nIndexX), GetPositionY(nIndexY), m_nWidth, m_nHeight, "vp_" + nSelectIndex +".png");
        }
    }
}

// ラジオボタンチェックイベント
function changeRadio() {
    console.log("change radio");
    GetCurrentParameters();    // 現在の設定値を取得
    let nMode = GetBackgroundMode();
    if(nMode == BG_MODE_FILE) {
        SetDisabledFileSelectControls(false);
    } else {
        SetDisabledFileSelectControls(true);
    }
    changeInputDefault();
}

// スクリーン数設定INPUT変更イベント
function changeScreenNumInput() {
    console.log("changeScreenNumInput");
    GetCurrentParameters();    // 現在の設定値を取得
    ReCreateFileSelectControls();
    m_nLastScreenNum = m_nScreenNumX * m_nScreenNumY;

    changeInputDefault();
}

// INPUT変更共通処理
function changeInputDefault() {
    SetStyleDisplay("canvas2", "none");
    SetStyleDisplay("btn1", "none");
    SetStyleDisplay("select", "none");
}

//------------------------------------------------------------------
// style.display 設定
function SetStyleDisplay(strId, strDisplay) {
    let elem = document.querySelector('#' + strId); // Canvasの取得
    if(elem != null) {
        elem.style.display = strDisplay;
    }
}
// SELECT要素設定
function SetSelectOption() {
    let elem = document.querySelector('#select'); // Canvasの取得
    let strHtml = "<option id='opt_0'>全体</option>";
    let nNo = 1;
    for (let x = 0; x < m_nScreenNumX; x++)
    {
        for (let y = 0; y < m_nScreenNumY; y++)
        {
            strHtml += "<option id='opt_"+nNo+"'>プロジェクタ "+nNo+"</option>";
            nNo++;
        }
    }
    elem.innerHTML = strHtml;
    elem.style.display = "block";
}

// 背景モード取得
function GetBackgroundMode() {
    let nMode = BG_MODE_CROSS;
    let elemRadio1 = document.querySelector('#radio-1');
    let elemRadio2 = document.querySelector('#radio-2');
    let elemRadio3 = document.querySelector('#radio-3');
    if(elemRadio1.checked == true) {
        nMode = BG_MODE_CROSS;
    } else if(elemRadio2.checked == true) {
        nMode = BG_MODE_WARD;
    } else if(elemRadio3.checked == true) {
        nMode = BG_MODE_FILE;
    } 
    return nMode;
}

// ファイル選択コントロール再生成
function ReCreateFileSelectControls() {
    let elem = document.querySelector('#divSelectFile'); // divの取得
    let nMode = GetBackgroundMode();
    let nNewScreenNum = m_nScreenNumX * m_nScreenNumY;
    
    if(m_nLastScreenNum < nNewScreenNum) {
        // スクリーンが増えた場合
        for(let i = m_nLastScreenNum; i <  nNewScreenNum; i++) {
            let strId = "selectFile" + (i + 1);
            let input = document.createElement( 'input' );
            input.type = 'file';
            input.id = strId;
            input.accept = '.png,.jpeg,.jpg';
            input.style.display = 'block';
            if(nMode == BG_MODE_FILE) {
                input.disabled = false;
            } else {
                input.disabled = true;
            }
            input.addEventListener("change", function(evt){
                m_arrayIsLoadedImg[i] = false;
                var file = evt.target.files; // fileの取得
                var reader = new FileReader();
               
                if (0 < file.length) {
                    reader.readAsDataURL(file[0]); // fileの要素をdataURL形式で読み込む
                
                    // ファイルを読み込んだ時に実行する
                    reader.onload = function(){
                        var dataUrl = reader.result; // 読み込んだファイルURL
                        m_arrayImg[i] = new Image(); // 画像
                        m_arrayImg[i].src = dataUrl;
                        // 画像が読み込んだ時に実行する
                        m_arrayImg[i].onload = function() {
                            // canvasに画像ソースを設定する
                            m_arrayIsLoadedImg[i] = true;
                        }
                    }
                } else {
                    m_arrayIsLoadedImg[i] = false;
                }
                changeInputDefault();
            }, false);
            elem.appendChild(input);
            console.log("add input");
        }
    } else if(nNewScreenNum < m_nLastScreenNum) {
        // スクリーンが減った場合
        for(let i = nNewScreenNum; i < m_nLastScreenNum; i++) {
            let strId = "selectFile" + (i + 1);
            let input = document.querySelector('#' + strId);
            if(input != null) {
                elem.removeChild(input);
                console.log("remove input");
            }
        }
    }
}

// ファイル選択コントロール 有効/無効設定
function SetDisabledFileSelectControls(isDisabled) {
    let nNo = 1;
    for (let x = 0; x < m_nScreenNumX; x++) {
        for (let y = 0; y < m_nScreenNumY; y++) {
            let strId = "selectFile" + nNo;
            let elem = document.querySelector('#' + strId); // divの取得
            if(elem != null) {
                elem.disabled = isDisabled;
            }
            nNo++;
        }
    }
}

//------------------------------------------------------------------
// 設定値取得
function GetCurrentParameters() {
    //let pram = new Parameter();
    m_nAllWidth = GetElementValue("all-width");
    m_nAllHeight = GetElementValue("all-height");
    m_nScreenNumX = GetElementValue("screen-num-x");
    m_nScreenNumY = GetElementValue("screen-num-y");
    m_nWidth = GetElementValue("screen-width");
    m_nHeight = GetElementValue("screen-height");
    m_nMaskLeft = GetElementValue("mask-left");
    m_nMaskRight = GetElementValue("mask-right");
    m_nMaskTop = GetElementValue("mask-top");
    m_nMaskBottom = GetElementValue("mask-bottom");
    m_nBrandingWidth = 0;
    m_nBrandingHeight = 0;
    if (1 < m_nScreenNumX) {
        m_nBrandingWidth = (m_nWidth * m_nScreenNumX - m_nAllWidth) / (m_nScreenNumX - 1);
        if(m_nBrandingWidth < 0) {
            m_nBrandingWidth = 0;
        }
    }
    if (1 < m_nScreenNumY)
    {
        m_nBrandingHeight = (m_nHeight * m_nScreenNumY - m_nAllHeight) / (m_nScreenNumY - 1);
        if(m_nBrandingHeight < 0 ) {
            m_nBrandingHeight = 0;
        }
    }
}

// 要素のValue取得
function GetElementValue(strElemId) {
    let elem = document.getElementById(strElemId);
    return elem.value;
}

// パターン描画
function DrawPattern(canvas, dbRate) {
    context = canvas.getContext('2d'); // Canvasからコンテキスを取得
    SetCanvasSize(canvas, m_nAllWidth * dbRate, m_nAllHeight * dbRate);

    // 背景描画
    let nBgMode = GetBackgroundMode();
    if(nBgMode == BG_MODE_CROSS) {
        context.fillStyle = 'black'; // 描画の塗り色を決める
        context.fillRect(0, 0, m_nAllWidth * dbRate, m_nAllHeight * dbRate);
    } else if(nBgMode == BG_MODE_WARD) {
        context.fillStyle = 'white'; // 描画の塗り色を決める
        context.fillRect(0, 0, m_nAllWidth * dbRate, m_nAllHeight * dbRate);
        let nFontSize = 48;
        let strText = ALPHABET_WORDS;
        for(let i = 0; i < parseInt(m_nAllWidth / nFontSize / 26 * 2); i++) {
            strText += strText;
        }
        //let strText = "AB";
        for(let i = 0; i < parseInt(m_nAllHeight / nFontSize * 2); i++) {
            DrawText(context, 0, nFontSize * dbRate * i + nFontSize * dbRate , strText, "black", nFontSize * dbRate, "left");
            strText = strText.substring(3);
        }
    } else if(nBgMode == BG_MODE_FILE) {
        // 画像ファイル描画
        context.fillStyle = 'gray'; // 描画の塗り色を決める
        context.fillRect(0, 0, m_nAllWidth * dbRate, m_nAllHeight * dbRate);    // アスペクト比が異なる場合マスク色を描画
        context.globalAlpha = 1.0;
        let nNo = 1;
        for (let x = 0; x < m_nScreenNumX; x++)
        {
            for (let y = 0; y < m_nScreenNumY; y++)
            {
                DrawBackgroundImage(context, x, y, dbRate);
                nNo++;
            }
        }
    }
    
    // マスク描画
    DrawMask(context, dbRate);

    // クロスハッチ描画
    if(nBgMode == BG_MODE_CROSS) {
        let nCellSize = 60;
        for (let x = 0; x < m_nAllWidth / nCellSize; x++)
        {
            for (let y = 0; y < m_nAllHeight / nCellSize; y++)
            {
                context.strokeStyle = "white";
                context.strokeRect(x * nCellSize * dbRate, y * nCellSize * dbRate, nCellSize * dbRate, nCellSize * dbRate);
            }
        }
    }
    
    // 中心線描画
    DrawCenterLine(context, dbRate);
    // スクリーンごとのRect描画
    DrawScreenBorder(context, dbRate);
}

// スクリーン背景画像描画
function DrawBackgroundImage(context, nXIndex, nYIndex, dbRate) {
    let nIndex = parseInt(nYIndex * m_nScreenNumX) + nXIndex;
    if(m_arrayIsLoadedImg[nIndex] == true) {
        let nImgWidth = m_arrayImg[nIndex].width;
        let nImgHeight = m_arrayImg[nIndex].height;
        // アスペクト比を保持して拡大
        if(m_nWidth / m_nHeight < nImgWidth / nImgHeight) {
            let nImgWidthFit = m_nWidth;
            let nImgHeightFit = nImgHeight * m_nWidth / nImgWidth;
            let nImgPosX = GetPositionX(nXIndex);
            let nImgPosY = GetPositionY(nYIndex) + (m_nHeight - nImgHeightFit) / 2;
            context.drawImage(m_arrayImg[nIndex], nImgPosX * dbRate, nImgPosY * dbRate, nImgWidthFit * dbRate, nImgHeightFit * dbRate);
        } else {
            let nImgWidthFit = nImgWidth * m_nHeight / nImgHeight;
            let nImgHeightFit = m_nHeight;
            let nImgPosX = GetPositionX(nXIndex) + (m_nWidth - nImgWidthFit) / 2;
            let nImgPosY = GetPositionY(nYIndex);
            context.drawImage(m_arrayImg[nIndex], nImgPosX * dbRate, nImgPosY * dbRate, nImgWidthFit * dbRate, nImgHeightFit * dbRate);
        }
    }
}

// 中心線描画
function DrawCenterLine(context, dbRate) {
    // 中心線描画
    context.fillStyle = 'yellow'; // 描画の塗り色を決める
    context.fillRect(0, m_nAllHeight * dbRate / 2 - 1, m_nAllWidth * dbRate, 2);
    context.fillRect(m_nAllWidth * dbRate / 2 - 1 , 0, 2, m_nAllHeight * dbRate);
}

// スクリーンの表示範囲を描画
function DrawScreenBorder(context, dbRate) {
    let nColorIndex = 0;
    context.lineWidth = 5 * dbRate;
    for (let y = 0; y < m_nScreenNumY; y++)
    {
        for (let x = 0; x < m_nScreenNumX; x++)
        {
            let nPosX = GetPositionX(x);
            let nPosY = GetPositionY(y);

            context.strokeStyle = COLOR_TABLE[nColorIndex];
            //console.log("x:" + nPosX + ", y:" + nPosY);
            context.strokeRect(nPosX * dbRate, nPosY * dbRate, m_nWidth * dbRate, m_nHeight * dbRate);
            context.strokeRect(nPosX * dbRate, nPosY * dbRate, m_nWidth / 2 * dbRate, m_nHeight * dbRate);

            // Text
            strText = String(x + y * m_nScreenNumX + 1);
            DrawText(context, (nPosX + m_nWidth / 2 - 10) * dbRate, (nPosY + m_nHeight / 2 - 10) * dbRate, strText, COLOR_TABLE[nColorIndex], 250*dbRate, "right");
            nColorIndex++;
            if (COLOR_TABLE.length <= nColorIndex)
            {
                nColorIndex = 0;
            }
        }
    }
}

// マスク描画
function DrawMask(context, dbRate) {
    context.fillStyle = 'gray'; // 描画の塗り色を決める
    context.fillRect(0, 0, m_nMaskLeft * dbRate, m_nAllHeight * dbRate); // 左
    context.fillRect((m_nAllWidth - m_nMaskRight )* dbRate , 0, m_nMaskRight * dbRate, m_nAllHeight * dbRate); // 右
    context.fillRect(0, 0, m_nAllWidth * dbRate, m_nMaskTop * dbRate); // 上
    context.fillRect(0, (m_nAllHeight - m_nMaskBottom) * dbRate, m_nAllWidth * dbRate, m_nMaskBottom * dbRate); // 下
}

// 画面X位置取得
function GetPositionX(nXIndex) {
    let nPosX = 0;
    if (m_nScreenNumX * m_nWidth < m_nAllWidth) {
        let nDiff = 0;
        nDiff = (m_nAllWidth - m_nScreenNumX * m_nWidth) / 2;
        nPosX = m_nWidth * nXIndex - m_nBrandingWidth * nXIndex + nDiff;
    } else {
        if (nXIndex == m_nScreenNumX - 1) {
            nPosX = m_nAllWidth - m_nWidth;
        } else {
            nPosX = m_nWidth * nXIndex - m_nBrandingWidth * nXIndex;
        }
    }
    return nPosX;
}
// 画面Y位置取得
function GetPositionY(nYIndex) {
    let nPosY = 0; 
    if (m_nScreenNumY * m_nHeight < m_nAllHeight) {
        let nDiff = 0;
        nDiff = (m_nAllHeight - m_nScreenNumY * m_nHeight) / 2;
        nPosY = m_nHeight * nYIndex - m_nBrandingHeight * nYIndex + nDiff;
    } else {
        if (nYIndex == m_nScreenNumY - 1) {
            nPosY = m_nAllHeight - m_nHeight;
        } else {
            nPosY = m_nHeight * nYIndex - m_nBrandingHeight * nYIndex;
        }
    }
    return nPosY;
}

// テキスト描画
function DrawText(context, nPosX, nPosY, strText, strColor, nFontSize, strTextAlign) {
    context.fillStyle = strColor; // 描画の塗り色を決める
    context.font = "" + nFontSize + "px MS ゴシック";
    context.textAlign = strTextAlign;
    context.fillText(strText, nPosX, nPosY);
}

// Canvas サイズ設定
function SetCanvasSize(canvas, nWidth, nHeight) {
    canvas.width=nWidth;
    canvas.height=nHeight;
}

// キャンバスを切り抜いて保存
function SaveCropCanvas(canvasBase, nX, nY, nWidth, nHeight, strFileName) {
    contextBase = canvasBase.getContext('2d'); // Canvasからコンテキスを取得

    // 一時的にCanvas生成
    let canvas = document.createElement( 'canvas' );
    document.body.appendChild( canvas );
    let context = canvas.getContext('2d');
    SetCanvasSize(canvas, nWidth, nHeight);
    var image = contextBase.getImageData(nX, nY, nWidth, nHeight);
    context.putImageData(image, 0, 0);
    SaveCanvas(canvas, strFileName);
    document.body.removeChild( canvas );
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