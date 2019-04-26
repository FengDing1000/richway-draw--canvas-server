//
// Autogenerated by Thrift Compiler (0.9.3)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
var thrift = require('thrift');
var Thrift = thrift.Thrift;
var Q = thrift.Q;


var ttypes = module.exports = {};
Canvas = module.exports.Canvas = function(args) {
  this.opts = null;
  if (args) {
    if (args.opts !== undefined && args.opts !== null) {
      this.opts = args.opts;
    }
  }
};
Canvas.prototype = {};
Canvas.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 1:
      if (ftype == Thrift.Type.STRING) {
        this.opts = input.readString();
      } else {
        input.skip(ftype);
      }
      break;
      case 0:
        input.skip(ftype);
        break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

Canvas.prototype.write = function(output) {
  output.writeStructBegin('Canvas');
  if (this.opts !== null && this.opts !== undefined) {
    output.writeFieldBegin('opts', Thrift.Type.STRING, 1);
    output.writeString(this.opts);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

