//定数
const COLOR_TABLE = [
    "red",
    "blue",
    "green",
    "fuchsia",
    "teal",
    "lime",
    "olive",
];
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
    nMode;
    arrayImg;
    arrayIsLoadedImg;
    isDrawVpNo;
    isDrawLine;
}
//------------------------------------------------------------------
// メンバ変数
let m_canvas;
let m_context;
let m_prmLastGen; // 前回生成した際のパラメータ
let m_arrayImg; // 現在選択されている画像ファイルの配列
let m_arrayIsLoadedImg; // 上記のロード完了フラグ
let m_nCrntFileSelectNum;

//------------------------------------------------------------------
// Onload
window.onload = () => {
    m_nBgMode = BG_MODE_CROSS;
    m_nCrntFileSelectNum = 0;
    m_arrayImg = new Array();
    m_arrayIsLoadedImg = new Array();

    ReCreateFileSelectControls();

    //SaveCanvas(m_canvas, "all.png");
    // イベントリスナー登録
    document
        .querySelector("#btn1")
        .addEventListener("click", clickDownloadButton);
    document
        .querySelector("#btn-draw")
        .addEventListener("click", clickDrawButton);
    document.querySelector("#radio-1").addEventListener("change", changeRadio);
    document.querySelector("#radio-2").addEventListener("change", changeRadio);
    document.querySelector("#radio-3").addEventListener("change", changeRadio);
    document
        .querySelector("#screen-num-x")
        .addEventListener("change", changeScreenNumInput);
    document
        .querySelector("#screen-num-y")
        .addEventListener("change", changeScreenNumInput);
    document
        .querySelector("#all-width")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#all-height")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#screen-width")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#screen-height")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#mask-left")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#mask-right")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#mask-top")
        .addEventListener("change", changeInputDefault);
    document
        .querySelector("#mask-bottom")
        .addEventListener("change", changeInputDefault);
};

//------------------------------------------------------------------

// 画像生成 ボタンクリック
function clickDrawButton() {
    console.log("click");
    m_prmLastGen = GetCurrentParameters();

    // 描画 保存用
    m_canvas = document.querySelector("#canvas"); // Canvasの取得
    m_context = m_canvas.getContext("2d"); // Canvasからコンテキスを取得
    DrawPattern(m_canvas, m_prmLastGen, 1.0);

    // 描画 表示用
    canvas = document.querySelector("#canvas2"); // Canvasの取得
    let dbRate = window.innerWidth / m_prmLastGen.nAllWidth;
    if (1.0 < dbRate) {
        dbRate = 1.0;
    }
    DrawPattern(canvas, m_prmLastGen, dbRate);

    // select
    SetSelectOption();

    // download button enable
    SetStyleDisplay("canvas2", "block");
    SetStyleDisplay("btn1", "block");
    SetStyleDisplay("select", "block");
}

// Download ボタンクリック
function clickDownloadButton() {
    m_canvas = document.querySelector("#canvas"); // Canvasの取得

    let elem = document.querySelector("#select"); // Canvasの取得
    let nSelectIndex = elem.selectedIndex;

    if (nSelectIndex == 0) {
        if (m_prmLastGen.nMode == BG_MODE_FILE) {
            DrawPattern(m_canvas, m_prmLastGen, 1.0); // 背景表示が画像ファイルのモードの場合、再描画してから保存する
        }
        SaveCanvas(m_canvas, "all.png");
    } else {
        let nIndexX = parseInt((nSelectIndex - 1) % m_prmLastGen.nScreenNumX);
        let nIndexY = parseInt((nSelectIndex - 1) / m_prmLastGen.nScreenNumX);
        if (m_prmLastGen.nMode != BG_MODE_FILE) {
            SaveCropCanvas(
                m_canvas,
                GetPositionX(nIndexX, m_prmLastGen),
                GetPositionY(nIndexY, m_prmLastGen),
                m_prmLastGen.nWidth,
                m_prmLastGen.nHeight,
                "vp_" + nSelectIndex + ".png"
            );
        } else {
            context = m_canvas.getContext("2d"); // Canvasからコンテキスを取得
            context.fillStyle = "gray"; // 描画の塗り色を決める
            context.fillRect(
                0,
                0,
                m_prmLastGen.nAllWidth,
                m_prmLastGen.nAllHeight
            ); // 背景色グレー
            // 背景が画像ファイルの場合再描画
            DrawBackgroundImage(context, m_prmLastGen, nIndexX, nIndexY, 1.0);
            // マスク描画
            DrawMask(context, m_prmLastGen, 1.0);
            // 中心線描画
            DrawCenterLine(context, m_prmLastGen, 1.0);
            // スクリーンごとのRect描画
            DrawScreenBorder(context, m_prmLastGen, 1.0);
            SaveCropCanvas(
                m_canvas,
                GetPositionX(nIndexX, m_prmLastGen),
                GetPositionY(nIndexY, m_prmLastGen),
                m_prmLastGen.nWidth,
                m_prmLastGen.nHeight,
                "vp_" + nSelectIndex + ".png"
            );
        }
    }
}

// ラジオボタンチェックイベント
function changeRadio() {
    console.log("change radio");
    let nMode = GetBackgroundMode();
    if (nMode == BG_MODE_FILE) {
        SetDisabledFileSelectControls(false);
    } else {
        SetDisabledFileSelectControls(true);
    }
    changeInputDefault();
}

// スクリーン数設定INPUT変更イベント
function changeScreenNumInput() {
    console.log("changeScreenNumInput");
    GetCurrentParameters(); // 現在の設定値を取得
    ReCreateFileSelectControls();

    changeInputDefault();
}

// INPUT変更共通処理
function changeInputDefault() {
    /*
    SetStyleDisplay("canvas2", "none");
    SetStyleDisplay("btn1", "none");
    SetStyleDisplay("select", "none");
    */
}

//------------------------------------------------------------------
// style.display 設定
function SetStyleDisplay(strId, strDisplay) {
    let elem = document.querySelector("#" + strId); // Canvasの取得
    if (elem != null) {
        elem.style.display = strDisplay;
    }
}
// SELECT要素設定
function SetSelectOption() {
    let elem = document.querySelector("#select"); // Canvasの取得
    let strHtml = "<option id='opt_0'>全体</option>";
    let nNo = 1;
    for (let x = 0; x < m_prmLastGen.nScreenNumX; x++) {
        for (let y = 0; y < m_prmLastGen.nScreenNumY; y++) {
            strHtml +=
                "<option id='opt_" +
                nNo +
                "'>プロジェクタ " +
                nNo +
                "</option>";
            nNo++;
        }
    }
    elem.innerHTML = strHtml;
    elem.style.display = "block";
}

// 背景モード取得
function GetBackgroundMode() {
    let nMode = BG_MODE_CROSS;
    let elemRadio1 = document.querySelector("#radio-1");
    let elemRadio2 = document.querySelector("#radio-2");
    let elemRadio3 = document.querySelector("#radio-3");
    if (elemRadio1.checked == true) {
        nMode = BG_MODE_CROSS;
    } else if (elemRadio2.checked == true) {
        nMode = BG_MODE_WARD;
    } else if (elemRadio3.checked == true) {
        nMode = BG_MODE_FILE;
    }
    return nMode;
}

// 表示・非表示選択 ラジオ値取得
function GetShowRadioValue(strShowInputId) {
    let isShow = false;
    let elemRadio1 = document.querySelector("#" + strShowInputId);
    if (elemRadio1.checked == true) {
        isShow = true;
    }
    return isShow;
}

// ファイル選択コントロール再生成
function ReCreateFileSelectControls() {
    let elem = document.querySelector("#divSelectFile"); // divの取得
    let nMode = GetBackgroundMode();
    let prm = GetCurrentParameters();
    let nNewFileSelectNum = prm.nScreenNumX * prm.nScreenNumY;

    if (m_nCrntFileSelectNum < nNewFileSelectNum) {
        // スクリーンが増えた場合
        for (let i = m_nCrntFileSelectNum; i < nNewFileSelectNum; i++) {
            let strId = "selectFile" + (i + 1);
            let input = document.createElement("input");
            input.type = "file";
            input.id = strId;
            input.accept = ".png,.jpeg,.jpg";
            input.style.display = "block";
            if (nMode == BG_MODE_FILE) {
                input.disabled = false;
            } else {
                input.disabled = true;
            }
            input.addEventListener(
                "change",
                function (evt) {
                    m_arrayIsLoadedImg[i] = false;
                    var file = evt.target.files; // fileの取得
                    var reader = new FileReader();

                    if (0 < file.length) {
                        reader.readAsDataURL(file[0]); // fileの要素をdataURL形式で読み込む

                        // ファイルを読み込んだ時に実行する
                        reader.onload = function () {
                            var dataUrl = reader.result; // 読み込んだファイルURL
                            m_arrayImg[i] = new Image(); // 画像
                            m_arrayImg[i].src = dataUrl;
                            // 画像が読み込んだ時に実行する
                            m_arrayImg[i].onload = function () {
                                // canvasに画像ソースを設定する
                                m_arrayIsLoadedImg[i] = true;
                            };
                        };
                    } else {
                        m_arrayIsLoadedImg[i] = false;
                    }
                    changeInputDefault();
                },
                false
            );
            elem.appendChild(input);
            console.log("add input");
        }
    } else if (nNewFileSelectNum < m_nCrntFileSelectNum) {
        // スクリーンが減った場合
        for (let i = nNewFileSelectNum; i < m_nCrntFileSelectNum; i++) {
            let strId = "selectFile" + (i + 1);
            let input = document.querySelector("#" + strId);
            if (input != null) {
                elem.removeChild(input);
                console.log("remove input");
            }
        }
    }

    m_nCrntFileSelectNum = nNewFileSelectNum;
}

// ファイル選択コントロール 有効/無効設定
function SetDisabledFileSelectControls(isDisabled) {
    let nNo = 1;
    for (let i = 0; i < m_nCrntFileSelectNum; i++) {
        let strId = "selectFile" + (i + 1);
        let elem = document.querySelector("#" + strId); // divの取得
        if (elem != null) {
            elem.disabled = isDisabled;
        }
    }
}

//------------------------------------------------------------------
// 設定値取得 (返却値 : Parameter)
function GetCurrentParameters() {
    let pram = new Parameter();
    pram.nAllWidth = GetElementValue("all-width");
    pram.nAllHeight = GetElementValue("all-height");
    pram.nScreenNumX = GetElementValue("screen-num-x");
    pram.nScreenNumY = GetElementValue("screen-num-y");
    pram.nWidth = GetElementValue("screen-width");
    pram.nHeight = GetElementValue("screen-height");
    pram.nMaskLeft = GetElementValue("mask-left");
    pram.nMaskRight = GetElementValue("mask-right");
    pram.nMaskTop = GetElementValue("mask-top");
    pram.nMaskBottom = GetElementValue("mask-bottom");
    pram.nBrandingWidth = 0;
    pram.nBrandingHeight = 0;
    if (1 < pram.nScreenNumX) {
        pram.nBrandingWidth =
            (pram.nWidth * pram.nScreenNumX - pram.nAllWidth) /
            (pram.nScreenNumX - 1);
        if (pram.nBrandingWidth < 0) {
            pram.nBrandingWidth = 0;
        }
    }
    if (1 < pram.nScreenNumY) {
        pram.nBrandingHeight =
            (pram.nHeight * pram.nScreenNumY - pram.nAllHeight) /
            (pram.nScreenNumY - 1);
        if (pram.nBrandingHeight < 0) {
            pram.nBrandingHeight = 0;
        }
    }
    pram.nMode = GetBackgroundMode();

    pram.isDrawVpNo = GetShowRadioValue("vp-radio-1");
    pram.isDrawLine = GetShowRadioValue("line-radio-1");
    pram.arrayImg = m_arrayImg.concat();
    pram.arrayIsLoadedImg = m_arrayIsLoadedImg.concat();
    return pram;
}

// 要素のValue取得
function GetElementValue(strElemId) {
    let elem = document.getElementById(strElemId);
    return elem.value;
}

// パターン描画
function DrawPattern(canvas, prm, dbRate) {
    context = canvas.getContext("2d"); // Canvasからコンテキスを取得
    SetCanvasSize(canvas, prm.nAllWidth * dbRate, prm.nAllHeight * dbRate);

    // 背景描画
    let nBgMode = GetBackgroundMode();
    if (nBgMode == BG_MODE_CROSS) {
        context.fillStyle = "black"; // 描画の塗り色を決める
        context.fillRect(0, 0, prm.nAllWidth * dbRate, prm.nAllHeight * dbRate);
    } else if (nBgMode == BG_MODE_WARD) {
        context.fillStyle = "white"; // 描画の塗り色を決める
        context.fillRect(0, 0, prm.nAllWidth * dbRate, prm.nAllHeight * dbRate);
        let nFontSize = 48;
        let strText = ALPHABET_WORDS;
        for (
            let i = 0;
            i < parseInt((prm.nAllWidth / nFontSize / 26) * 2);
            i++
        ) {
            strText += strText;
        }
        //let strText = "AB";
        for (let i = 0; i < parseInt((prm.nAllHeight / nFontSize) * 2); i++) {
            DrawText(
                context,
                0,
                nFontSize * dbRate * i + nFontSize * dbRate,
                strText,
                "black",
                nFontSize * dbRate,
                "left"
            );
            strText = strText.substring(3);
        }
    } else if (nBgMode == BG_MODE_FILE) {
        // 画像ファイル描画
        context.fillStyle = "gray"; // 描画の塗り色を決める
        context.fillRect(0, 0, prm.nAllWidth * dbRate, prm.nAllHeight * dbRate); // アスペクト比が異なる場合マスク色を描画
        context.globalAlpha = 1.0;
        let nNo = 1;
        for (let x = 0; x < prm.nScreenNumX; x++) {
            for (let y = 0; y < prm.nScreenNumY; y++) {
                DrawBackgroundImage(context, prm, x, y, dbRate);
                nNo++;
            }
        }
    }

    // マスク描画
    DrawMask(context, prm, dbRate);

    // クロスハッチ描画
    if (nBgMode == BG_MODE_CROSS) {
        let nCellSize = 60;
        for (let x = 0; x < prm.nAllWidth / nCellSize; x++) {
            for (let y = 0; y < prm.nAllHeight / nCellSize; y++) {
                context.strokeStyle = "white";
                context.strokeRect(
                    x * nCellSize * dbRate,
                    y * nCellSize * dbRate,
                    nCellSize * dbRate,
                    nCellSize * dbRate
                );
            }
        }
    }
    if (prm.isDrawLine == true) {
        // 中心線描画
        DrawCenterLine(context, prm, dbRate);
    }

    // スクリーンごとのRect描画
    DrawScreenBorder(context, prm, dbRate);
}

// スクリーン背景画像描画
function DrawBackgroundImage(context, prm, nXIndex, nYIndex, dbRate) {
    let nIndex = parseInt(nYIndex * prm.nScreenNumX) + nXIndex;
    if (prm.arrayIsLoadedImg[nIndex] == true) {
        let nImgWidth = prm.arrayImg[nIndex].width;
        let nImgHeight = prm.arrayImg[nIndex].height;
        // アスペクト比を保持して拡大
        if (prm.nWidth / prm.nHeight < nImgWidth / nImgHeight) {
            let nImgWidthFit = prm.nWidth;
            let nImgHeightFit = (nImgHeight * prm.nWidth) / nImgWidth;
            let nImgPosX = GetPositionX(nXIndex, prm);
            let nImgPosY =
                GetPositionY(nYIndex, prm) + (prm.nHeight - nImgHeightFit) / 2;
            context.drawImage(
                prm.arrayImg[nIndex],
                nImgPosX * dbRate,
                nImgPosY * dbRate,
                nImgWidthFit * dbRate,
                nImgHeightFit * dbRate
            );
        } else {
            let nImgWidthFit = (nImgWidth * prm.nHeight) / nImgHeight;
            let nImgHeightFit = prm.nHeight;
            let nImgPosX =
                GetPositionX(nXIndex, prm) + (prm.nWidth - nImgWidthFit) / 2;
            let nImgPosY = GetPositionY(nYIndex, prm);
            context.drawImage(
                prm.arrayImg[nIndex],
                nImgPosX * dbRate,
                nImgPosY * dbRate,
                nImgWidthFit * dbRate,
                nImgHeightFit * dbRate
            );
        }
    }
}

// 中心線描画
function DrawCenterLine(context, prm, dbRate) {
    // 中心線描画
    context.fillStyle = "yellow"; // 描画の塗り色を決める
    context.fillRect(
        0,
        (prm.nAllHeight * dbRate) / 2 - 1,
        prm.nAllWidth * dbRate,
        2
    );
    context.fillRect(
        (prm.nAllWidth * dbRate) / 2 - 1,
        0,
        2,
        prm.nAllHeight * dbRate
    );
}

// スクリーンの表示範囲を描画
function DrawScreenBorder(context, prm, dbRate) {
    let nColorIndex = 0;
    context.lineWidth = 5 * dbRate;
    context.globalAlpha = 0.9;

    for (let y = 0; y < prm.nScreenNumY; y++) {
        for (let x = 0; x < prm.nScreenNumX; x++) {
            let nPosX = GetPositionX(x, prm);
            let nPosY = GetPositionY(y, prm);

            context.strokeStyle = COLOR_TABLE[nColorIndex];
            //console.log("x:" + nPosX + ", y:" + nPosY);
            if (prm.isDrawLine == true) {
                context.strokeRect(
                    nPosX * dbRate,
                    nPosY * dbRate,
                    prm.nWidth * dbRate,
                    prm.nHeight * dbRate
                );
                context.strokeRect(
                    nPosX * dbRate,
                    nPosY * dbRate,
                    (prm.nWidth / 2) * dbRate,
                    prm.nHeight * dbRate
                );
            }

            // Text
            if (prm.isDrawVpNo == true) {
                strText = String(x + y * prm.nScreenNumX + 1);
                DrawText(
                    context,
                    (nPosX + prm.nWidth / 2 - 10) * dbRate,
                    (nPosY + prm.nHeight / 2 - 10) * dbRate,
                    strText,
                    COLOR_TABLE[nColorIndex],
                    250 * dbRate,
                    "right"
                );
            }
            nColorIndex++;
            if (COLOR_TABLE.length <= nColorIndex) {
                nColorIndex = 0;
            }
        }
    }
    context.globalAlpha = 1.0;
}

// マスク描画
function DrawMask(context, prm, dbRate) {
    context.fillStyle = "gray"; // 描画の塗り色を決める
    context.fillRect(0, 0, prm.nMaskLeft * dbRate, prm.nAllHeight * dbRate); // 左
    context.fillRect(
        (prm.nAllWidth - prm.nMaskRight) * dbRate,
        0,
        prm.nMaskRight * dbRate,
        prm.nAllHeight * dbRate
    ); // 右
    context.fillRect(0, 0, prm.nAllWidth * dbRate, prm.nMaskTop * dbRate); // 上
    context.fillRect(
        0,
        (prm.nAllHeight - prm.nMaskBottom) * dbRate,
        prm.nAllWidth * dbRate,
        prm.nMaskBottom * dbRate
    ); // 下
}

// 画面X位置取得
function GetPositionX(nXIndex, prm) {
    let nPosX = 0;
    if (prm.nScreenNumX * prm.nWidth < prm.nAllWidth) {
        let nDiff = 0;
        nDiff = (prm.nAllWidth - prm.nScreenNumX * prm.nWidth) / 2;
        nPosX = prm.nWidth * nXIndex - prm.nBrandingWidth * nXIndex + nDiff;
    } else {
        if (nXIndex == prm.nScreenNumX - 1) {
            nPosX = prm.nAllWidth - prm.nWidth;
        } else {
            nPosX = prm.nWidth * nXIndex - prm.nBrandingWidth * nXIndex;
        }
    }
    return nPosX;
}
// 画面Y位置取得
function GetPositionY(nYIndex, prm) {
    let nPosY = 0;
    if (prm.nScreenNumY * prm.nHeight < prm.nAllHeight) {
        let nDiff = 0;
        nDiff = (prm.nAllHeight - prm.nScreenNumY * prm.nHeight) / 2;
        nPosY = prm.nHeight * nYIndex - prm.nBrandingHeight * nYIndex + nDiff;
    } else {
        if (nYIndex == prm.nScreenNumY - 1) {
            nPosY = prm.nAllHeight - prm.nHeight;
        } else {
            nPosY = prm.nHeight * nYIndex - prm.nBrandingHeight * nYIndex;
        }
    }
    return nPosY;
}

// テキスト描画
function DrawText(
    context,
    nPosX,
    nPosY,
    strText,
    strColor,
    nFontSize,
    strTextAlign
) {
    context.fillStyle = strColor; // 描画の塗り色を決める
    context.font = "" + nFontSize + "px MS ゴシック";
    context.textAlign = strTextAlign;
    context.fillText(strText, nPosX, nPosY);
}

// Canvas サイズ設定
function SetCanvasSize(canvas, nWidth, nHeight) {
    canvas.width = nWidth;
    canvas.height = nHeight;
}

// キャンバスを切り抜いて保存
function SaveCropCanvas(canvasBase, nX, nY, nWidth, nHeight, strFileName) {
    contextBase = canvasBase.getContext("2d"); // Canvasからコンテキスを取得

    // 一時的にCanvas生成
    let canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    let context = canvas.getContext("2d");
    SetCanvasSize(canvas, nWidth, nHeight);
    var image = contextBase.getImageData(nX, nY, nWidth, nHeight);
    context.putImageData(image, 0, 0);
    SaveCanvas(canvas, strFileName);
    document.body.removeChild(canvas);
}

// 画像保存
function SaveCanvas(canvas, strFileName) {
    let img = canvas.toDataURL();
    let a = document.createElement("a");
    a.href = img;
    a.download = strFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
