
const thrift = require("thrift");
const CanvasServer = require('./gen-nodejs/CanvasServer.js');
const CanvasType = require('./gen-nodejs/canvas_types.js');
const StartSever = (config = {})=>{    
    const server = thrift.createServer(CanvasServer, {
        draw: function (opts, result) {
            try {
                const options = JSON.parse(opts);            
                const drawCanvas = require("./app.js");
                const promiz = drawCanvas(options);
                promiz.then(function (res) {
                    result(null, res);
                }).catch(function (err) {
                    result(null, "promizError:" + err.toString());
                });
            } catch (err) {
                result(null, "tryError:" + err.toString());
            }
        }
    });
    server.listen(9091,()=>{
        console.log('drawCanvasServer is listening:9091')
    });
    server.on('error', console.error);
}
export default StartSever;