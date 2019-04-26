const ImageCoverCanvas = require('./canvas')
const { createCanvas, loadImage } = require('canvas')
var canvasOptions = {
    canRedraw: false,
    drawImageCoverFlag: true
};
function drawCanvas (data) {
    console.log(JSON.stringify(data));
    return new Promise(function (resolve, reject) {
        var fileUrl = data.fileUrl;
        loadImage(fileUrl).then((image) => {
            const canvas = createCanvas(image.width, image.height);
            canvasOptions.img = image;
            canvasOptions.width = image.width;
            canvasOptions.height = image.height;
            canvasOptions.realWidth = image.width;
            canvasOptions.realHeight = image.height;
            const canvasInfo = new ImageCoverCanvas(canvas, canvasOptions);
            setSizeByImageWidth(image.width, canvasInfo);
            canvasInfo.dealResultData(data);
            canvasInfo.canReDraw = true;
            canvasInfo.redraw();
            var base64Data = canvas.toDataURL().replace('data:image/png;base64,', '');
            resolve(base64Data);
        }).catch(err => {
            reject('图片处理错误：' + err);
        })
    })
}

function setSizeByImageWidth (width, canvasInfo) {
    scale = width / 768;
    if (scale <= 1) return;
    canvasInfo.multiCalc(canvasInfo.opts, scale, 'initImageScale');
    canvasInfo.multiCalc(canvasInfo.opts, scale, 'fontSizeScale');
    return canvasInfo;
}
module.exports = drawCanvas;

