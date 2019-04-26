
var project_config_formaterDataObj = {
	formaterPercent: function (value, num, unit) {
		if (!value) return '' + (90 + Math.random() * 10).toFixed(num) + unit + '%';
		return '' + (Number(value) * 100).toFixed(num) + unit;
	},
	formaterToFixed: function (value, num, unit) {
		if (!value) return '0.00' + unit;
		if (!isNaN(value)) {
			return '' + Number(value).toFixed(num) + unit;
		} else {
			return value;
		}
	}
}
/*
  {
        // 对应的绘制类型
        typeName:"polygonInfo",
        // drawType:[]
        labelNameList: [ '水域', '漂浮垃圾', '水体颜色' ],
        type: 'points',
        labelList: [
            [ 'water_seg', 'water_area', 'ruler', 'water_city' ],
            [ 'rubbish_seg', 'rubbish_area' ],
            [ 'water_color' ]
        ],
    }, 
*/
var project_config = {
	drawDataList: [
		{
			// 对应的绘制类型
			typeName: "rectInfo",
			// drawType:[],
			colorInfo: {
				defaultColor: '#f00',
				secchi_up: '#0f0',
				person: '#0f0'
			},
			labelNameList: ['船', '游泳', '钓鱼', '赛氏盘', '非法闯入', '安全帽'],
			labelList: [
				'boat', 'swim', 'fishing', ['secchi_up', 'secchi_down'],
				['intruder', 'person'], 'helmet_detect'
			],
		},
		{
			// 对应的绘制类型
			typeName: "virtualRulerInfo",
			// drawType:[],
			colorInfo: {
				defaultColor: '#f00'
			},
			labelNameList: ['水尺'],
			labelList: [
				['gauge', 'water_gauge', 'ruler', 'water_city']
			],
		}, {
			// 对应的绘制类型
			typeName: "lineInfo",
			// drawType:[],
			colorInfo: {
				defaultColor: '#f00'
			},
			labelNameList: ['水闸'],
			labelList: ['sluice_gauge'],
		}, {
			// 对应的绘制类型
			typeName: "irregularRectInfo",
			// drawType:[],
			colorInfo: {
				defaultColor: '#f00'
			},
			labelNameList: ['关键点'],
			labelList: [
				'keypoints'
			],
		}],
	virtualShowLabelData: [{
		label: '置信度:',
		field: 'score',
		unit: '%',
		formaterFn: project_config_formaterDataObj.formaterPercent
	},
	{
		label: '距坝顶:',
		field: 'gaugeLen',
		unit: 'm',
		formaterFn: project_config_formaterDataObj.formaterToFixed
	},
	{
		label: '水深:',
		field: 'gaugeDeeph',
		unit: 'm',
		formaterFn: project_config_formaterDataObj.formaterToFixed
	},
	{
		label: '水位:',
		field: 'gaugeRz',
		unit: 'm',
		formaterFn: project_config_formaterDataObj.formaterToFixed
	},
	{
		label: '水尺读数:',
		field: 'gaugeRead',
		unit: 'm',
		formaterFn: project_config_formaterDataObj.formaterToFixed
	}
	]
};
var CanvasUtils = {
	// 节流防抖函数 执行函数 延时 立即执行
	throttleDuration: function (method, delay, duration) {
		delay = delay || 60;
		duration = duration || 60;
		var timer = null;
		var context;
		var begin = new Date();
		return function () {
			context = this;
			current = new Date();
			args = arguments;
			clearTimeout(timer);
			if (current - begin >= duration) {
				method.apply(context, args);
				begin = current;
			} else {
				timer = setTimeout(function () {
					method.apply(context, args);
					time = null;
				}, delay);
			}
		};
	},
	// 随机生成颜色
	getRandomColor: function () {
		return '#' + (function (color) {
			return (color += '0123456789abcdef'[Math.floor(Math.random() * 16)]) &&
				(color.length == 6) ? color : arguments.callee(color);
		})('');
	},
	// 自定义合并对象
	deepObjectMerge: function (defaultOpts, target) {
		for (var key in target) {
			if (defaultOpts[key] && this.dyTypeOf(defaultOpts[key]) === 'object') {
				defaultOpts[key] = this.deepObjectMerge(defaultOpts[key], target[key]);
			} else if (defaultOpts[key] && this.dyTypeOf(defaultOpts[key]) === 'array') {
				defaultOpts[key] = (typeof target[key] !== 'undefined' && target[key].length > 0) ? target[key] : defaultOpts[key];
			} else {
				defaultOpts[key] = typeof target[key] !== 'undefined' ? target[key] : defaultOpts[key];
			}
		}
		return defaultOpts;
	},
	depthClone: function (opts) {
		return JSON.parse(JSON.stringify(opts));
	},
	isDom: function (ele) {
		var isDOM = (typeof HTMLElement === 'object') ?
			ele instanceof HTMLElement :
			ele && typeof ele === 'object' && ele.nodeType === 1 && typeof ele.nodeName === 'string';
		return isDOM;
	},
	// 确定数据类型
	dyTypeOf: function (target) {
		var ret = typeof target;
		var template = {
			"[object Array]": 'array',
			"[object Object]": 'object',
			"[object Number]": 'number - object',
			"[object Boolean]": 'boolean - object',
			"[object String]": 'string - object'
		};
		if (target === null) {
			return 'null';
		} else if (ret === 'object') {
			// 数组 对象 包装类 Object.prototype.toString
			var str = Object.prototype.toString.call(target);
			return template[str];
		} else {
			return ret;
		}
	},
	// 判断对象是否为空对象
	isEmptyObject: function (obj) {
		if (JSON.stringify(obj) == "{}") {
			return true;
		} else {
			return false;
		}
	},
	// 去掉空对象
	clearEmptyObject: function (opts) {
		for (var key in opts) {
			if (Object.hasOwnProperty.call(opts, key)) {
				if (this.dyTypeOf(opts[key]) === 'object') {
					if (this.isEmptyObject(opts[key])) {
						delete opts[key];
					} else {
						opts[key] = this.clearEmptyObject(opts[key]);
						if (this.isEmptyObject(opts[key])) {
							delete opts[key];
						}
					}
				}
			}
		}
		return opts || {};
	},
	// 数组根据对象字段排序
	sortBy: function (list, attr, rev) {
		function sortBy (attr, rev) {
			//第二个参数没有传递 默认升序排列
			if (rev == undefined) {
				rev = 1;
			} else {
				rev = (rev) ? 1 : -1;
			}

			return function (a, b) {
				a = a[attr];
				b = b[attr];
				if (a < b) {
					return rev * -1;
				}
				if (a > b) {
					return rev * 1;
				}
				return 0;
			}
		}
		return (list || []).sort(sortBy(attr, rev));
	},
	// 下划线 + 小写 转你为大写 [A-Z]
	lowerWorldTransFn: function (str) {
		//匹配文本进行替换
		var str = str.replace(/(_[a-z])/g, function ($1) {
			return $1.replace('_', '').toUpperCase();
		});
		return str;
	},
	// 大写转化为下划线 + 小写 [A-Z]
	upperWorldTransFn: function (str) {
		//匹配文本进行替换
		var str = str.replace(/([A-Z])/g, function ($1) {
			return '_' + $1.toLowerCase();
		});
		return str;
	},
	// 首字母大小写转换
	firstWorldTransFn: function (str, type) {
		//匹配文本进行替换
		var str = str.replace(/(\b\w)/g, function ($1) {
			//将匹配的文本首字母转换成大写
			if (type === 'upper') {
				return $1.substring(0, 1).toUpperCase() + $1.substring(1);
			} else {
				return $1.substring(0, 1).toLowerCase() + $1.substring(1);
			}
		});
		return str;
	},
	// 根据长度获取和角度获取偏移量
	getPositionByOptsL: function (x, y, l, deg, dl) {
		var resultPosition = {};
		resultPosition.x = x + l * dl * (Math.sin(deg * Math.PI / 180));
		resultPosition.y = y + l * dl * (Math.cos(deg * Math.PI / 180));
		return resultPosition;
	},
	// 获取鼠标旋转角度
	moveInfoRotate: function (orginP, startP, endP) {
		var centerP = {
			x: 0,
			y: 0
		}
		var startP = {
			x: startP.x - orginP.x,
			y: orginP.y - startP.y
		}
		var endP = {
			x: endP.x - orginP.x,
			y: orginP.y - endP.y
		}
		var lengthAB = Math.sqrt(Math.pow(centerP.x - startP.x, 2) +
			Math.pow(centerP.y - startP.y, 2)),
			lengthAC = Math.sqrt(Math.pow(centerP.x - endP.x, 2) +
				Math.pow(centerP.y - endP.y, 2)),
			lengthBC = Math.sqrt(Math.pow(startP.x - endP.x, 2) +
				Math.pow(startP.y - endP.y, 2));
		if (lengthAB === 0 || lengthAC === 0 || lengthBC === 0) return 0;
		var cosA = (Math.pow(lengthAB, 2) + Math.pow(lengthAC, 2) - Math.pow(lengthBC, 2)) /
			(2 * lengthAB * lengthAC);
		var angleA = Math.acos(cosA) * 180 / Math.PI;
		if ((startP.x - centerP.x) * (endP.y - centerP.y) - (endP.x - centerP.x) * (startP.y - centerP.y) < 0) {
			// console.log( "顺时针\n" );
			return -angleA;
		} else {
			// console.log( "逆时针\n" );
			return angleA;
		}
	},
	// 判断点是否在圆内
	pointInsideCircleFn: function (point, circle) {
		var r = circle.r || 0;
		if (r === 0) return false;
		var dx = circle.x - point.x;
		var dy = circle.y - point.y;
		return dx * dx + dy * dy <= r * r;
	},
	// 判断点是否在多边形内部
	pointInsidePolygonFn: function (point, vs) {
		var x = point.x,
			y = point.y;
		var inside = false;
		for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			var xi = vs[i].x,
				yi = vs[i].y;
			var xj = vs[j].x,
				yj = vs[j].y;

			var intersect = ((yi > y) != (yj > y)) &&
				(x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}
		return inside;
	},
	// 获取字符个数
	checkSum: function (chars) {
		var sum = 0;
		var len = 0;
		for (var i = 0; i < chars.length; i++) {
			var c = chars.charCodeAt(i);
			// 判断是不是汉字      		
			if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
				sum++;
				len++;
			} else {
				sum += 2;
			}
		}
		if (len == sum) sum += 1;
		return sum;
	},
	//圆角矩形
	roundRect: function (ctx, x, y, w, h, r) {
		var min_size = Math.min(w, h);
		if (r > min_size / 2) r = min_size / 2;
		// 开始绘制
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		return ctx;
	}
};
// 定义canvas对象
function ImageCoverCanvas (canvas, opts) {
	// 获取默认参数
	var defaultOpts = CanvasUtils.depthClone(this.defaultOpts);
	// 处理传入的参数
	this.canvas = canvas;
	// 和并参数
	this.opts = CanvasUtils.deepObjectMerge(defaultOpts, opts);
	if (this.opts.img) {
		this.imageInfo.img = this.opts.img;
	}
	// 获取canvas.ctx
	this.ctx = this.canvas.getContext("2d");
	// 初始化整个canvas
	this.init();
	// 返回便于链式调用
	return this;
}

ImageCoverCanvas.prototype = {
	defaultOpts: {
		// 是否图片加载完成立即绘制
		canRedraw: true,
		// 图片层级
		zIndex: 0,
		// 默认图片缩放尺度
		defaultImageScale: 1,
		// 当前缩放比例
		imageScale: 1,
		// 是否验证坐标合法度 只有在图片不能被缩放才有效
		vilidatePoint: false,
		// 缩放系数
		resizeScale: 0.02,
		// 画布实际宽高
		width: 0,
		height: 0,
		// 图片实际宽高
		realWidth: 0,
		realHeight: 0,
		// 是否绘制图片叠加图层
		drawImageCoverFlag: true,
		// 点击canvas才绘制       
		clickShowOnce: false,
		// 点击函数
		handleClick: null,
		// 缩放图片信息
		bgImageInfo: {
			width: 0,
			height: 0,
			isScale: false,
			x: 0,
			y: 0
		},
		// 图片叠加图层配置信息 
		// canDraw 是否可以绘制 
		// canTransform 是否可以进行 拖拽 平移 缩放操作
		// zIndex 画布触发操作的层级关系
		// stroke 是否显示线条 
		// fill 是否填充闭合区域
		// fillStyle 填充颜色 可以结合 fillOpacity 设置透明度
		// lineColor 线条颜色
		// 含有lineWidth 的都是表示线条宽度 即粗细
		// 含有lineLength 的都是表示线条长度
		// needCalcPointList 需要处理为 {x:1,y:1} 的形式
		// 含有fontWeight 都是文字的bold normal bolder
		imageCoverConfig: {
			// 水域绘制配置信息 
			polygonInfo: {
				canDraw: false,
				config: {
					// 通用多边形区域绘制 polygon
					commonPolygon: {
						name: "polygonInfo_commonPolygon",
						canDraw: true,
						stroke: true,
						fill: true,
						lineWidthList: [1],

						lineColorList: ["#ff00ff"],
						// label名称数组
						labelNameList: [],

						fillStyleList: ["255,192,203"],
						fillOpacityList: [0.3],
						// 所有的可以绘制的 points集合
						polygonList: []
					}
				}
			},
			// 不规则矩形框
			irregularRectInfo: {
				canDraw: false,
				config: {
					// 通用多边形区域绘制 polygon
					commonIrregularRect: {
						name: "polygonInfo_commonIrregularRect",
						canDraw: true,
						stroke: true,
						lineWidthList: [1],
						lineColorList: ["#f00"],
						// label名称数组
						labelNameList: [],
						fontSize: 16,
						// 左右边距
						paddingNum: 8,
						// 气泡框的高度
						labelPopHeight: 20,
						// 三角箭头
						paddingArrowNum: 4,
						// pop框的颜色
						labelPopColorList: ['#118ee9'],
						// pop框内文字颜色
						labelPopTextColorList: ['#fff'],
						// label名称
						labelPopNameList: ['0.00m'],
						// 是否显示label
						showLabelPopList: [false],
						// 所有的可以绘制的 points集合
						needCalcPointList: []
					}
				}
			},
			// 水闸绘制配置信息 
			lineInfo: {
				canDraw: false,
				config: {
					// 通用多边形区域绘制 polygon
					commonLine: {
						name: "lineInfo_commonLine",
						canDraw: true,
						stroke: true,
						lineWidthList: [1],

						lineColorList: ["#f00"],
						// label名称数组
						labelNameList: [],

						fontSize: 16,
						// 左右边距
						paddingNum: 8,
						// 三角箭头
						paddingArrowNum: 4,
						// 气泡框的高度
						labelPopHeight: 20,
						// pop框的颜色
						labelPopColorList: ['#118ee9'],
						// pop框内文字颜色
						labelPopTextColorList: ['#fff'],
						// labelPop名称
						labelPopNameList: ['0.00m'],
						// 是否显示label
						showLabelPopList: [false],
						// 所有的可以绘制的 points集合
						polygonList: []
					}
				}
			},
			// 水尺及其其他Rect绘制配置信息 
			rectInfo: {
				canDraw: false,
				config: {
					// 通用矩形区域绘制 rect
					commonRect: {
						name: "rectInfo_commonRect",
						type: '', // 默认为放在上面的 guideLine 引导线  左右 arrow
						canDraw: true,
						stroke: true,
						lineWidthList: [1],

						lineColorList: ["#f00"],
						// label名称数组
						labelNameList: [],

						fontSize: 16,
						// 左右边距
						paddingNum: 8,
						// 气泡框的高度
						labelPopHeight: 20,
						// 三角箭头
						paddingArrowNum: 0,
						// pop框的颜色
						labelPopColorList: ['#118ee9'],
						// pop框内文字颜色
						labelPopTextColorList: ['#fff'],
						// label名称
						labelPopNameList: [],
						// 是否显示label
						showLabelPopList: [false],
						// 所有的可以绘制的 points集合
						needCalcPointList: []
					}
				}
			},
			// 虚拟水尺配置信息
			virtualRulerInfo: {
				canDraw: false,
				config: {
					// 虚拟水尺配置信息 
					commonVirtualRuler: {
						name: "virtualRulerInfo_commonVirtualRuler",
						canDraw: true,
						type: 'fixed', // fixedWidth(固定宽度) fixedHeight(固定高度) noFixed(宽高自适应)
						defaultRulerWidth: 20,
						fontSizeCanResize: false,
						// 固定宽度是最大宽度
						fixedWidth: 210,
						// 固定高度时在答高度
						fixedHeight: 0,
						stroke: true,
						// 是否需要绘制原图返回的bbox坐标信息
						needRulerRect: true,
						// 当前尺子在图片的定位方式
						rulerPosition: 'right',
						lineColor: '#f00',
						virtualLineWidth: 1,
						// 尺子及box和mask的间距
						blankSpace: 10,
						fontSize: 16,
						// 尺子的倾斜度
						rotate: -3,
						// 文字旋转角度
						textRotate: 3,
						// 是否展示0.00
						showLabelText: false,
						needCalcPointList: [],
						// 遮罩框 配置信息
						rectMask: {
							name: 'virtualRulerInfo_rectMask',
							canDraw: true,
							canTransform: false,
							stroke: false,
							fill: true,
							lineColor: "#000",
							fillStyle: "0,0,0",
							fillOpacity: 0.3
						},
						// 虚拟水尺
						ruler: {
							name: 'virtualRulerInfo_ruler',
							canDraw: true,
							canTransform: false,
							ruleDirection: 'up',
							lineColor: '#fff',
							virtualLineLength: 10,
							maxVirtualLineLength: 20,
							virtualLineWidth: 2,
							maxVirtualLineWidth: 4,
							// 尺子向下的个数
							downRulerNum: 3,
							// 尺子中间长线旋转角度
							rulerLongLineRotate: 0,
							// 单个的刻度数长度
							rulerSpaceLength: 8
						},
						// 详情信息
						detailBoxInfo: {
							name: 'virtualRulerInfo_detailBoxInfo',
							canDraw: true,
							canTransform: false,
							itemSpace: 25,
							// 四个角每个方向的长度
							itemPointLength: 10,
							maxTextWidth: 80,
							virtualLineWidth: 1,
							lineColor: '#fff',
							fontSize: 16,
							fontWeight: 'bold',
							// title信息
							titleInfo: {
								text: '',
								color: '#3ff3ff',
								fontSize: 16
							},
							// 时间信息
							timeInfo: {
								text: '',
								color: '#fff',
								fontSize: 16
							},
							// 中间展示内容
							labelInfo: {
								labelColor: '#fff',
								valueColor: '#3ff3ff',
								fontSize: 16,
								// label 及其value列表
								list: []
							}
						}
					}
				}
			},
			// 预警配置信息
			wrnRulerInfo: {
				canDraw: false,
				config: {
					// 预警线尺度配置信息
					commonWrnRuler: {
						name: 'wrnRulerInfo_commonWrnRuler',
						stroke: true,
						canDraw: true,
						canTransform: false,
						zIndex: 1,
						// 预警尺旋转角度
						rotate: 0,
						ruleDirection: 'up',
						lineWidth: 2,
						lineColor: "#fff",
						// 默认预警尺基点坐标
						point: {},
						// 预警尺刻度
						itemLineInfo: {
							name: 'wrnRulerInfo_itemLineInfo',
							canTransform: false,
							maxLineLength: 15,
							// 每个刻度的长度
							spaceLength: 10,
							lineLength: 10,
							lineWidth: 2,
							lineColor: "#fff",
							// 总共几个刻度
							itemLineCount: 20,
							// 最低几个刻度
							minItemLineCount: 6,
						},
						// 预警线
						wrnLineInfo: {
							name: 'wrnRulerInfo_wrnLineInfo',
							canTransform: false,
							// 是否展示预警文字
							showWrnText: true,
							zIndex: 2,
							lineLength: 25,
							lineWidth: 4,
							// 默认的预警线的长度及其下标信息
							dWrnLineLengthList: [{
								index: 0,
								l: 20
							}, {
								index: 1,
								l: 20
							}, {
								index: 2,
								l: 20
							}],
							// 预警线两端的坐标信息
							pointList: [],
							fontSize: 16,
							// 文字是否可以随图片放大而变化
							fontSizeCanResize: true,
							// 默认文字信息
							textList: ['加强关注', '准备转移', '立即转移'],
							// 默认颜色信息
							colorList: ['#FEFD02', '#FE9900', '#D92D29'],
							// 默认预警线条数
							wrnLineCount: 3
						}
					}
				}
			}
		}
	},
	// 是否绘制触发事件轮廓
	outlineStroke: false,
	// 剥离可以绘画的配置
	canDrawData: {},
	// 可以变化的配置
	canTransformData: {},
	// 鼠标变化信息
	mouseInfo: {
		mouseMoveTypeData: null,
		mouseWheelTypeData: null,
		isMove: false,
		x: 0,
		y: 0,
		startP: null
	},
	// 手指变化信息
	touchInfo: {
		touchSDx: 0,
		touchEDx: 0
	},
	// 图片信息
	imageInfo: {
		img: null,
		currentItemResize: 0,
		resizeScale: 0,
		startP: null
	},
	// 配置信息展示容器
	currentShowContainer: null,
	// 鼠标滚轮信息
	wheelInfo: {
		wheelValue: 0
	},
	// 鼠标移动信息
	moveInfo: {
		x: 0,
		y: 0,
		rotate: 0
	},
	// 预警尺子最大长度
	maxRulerLength: 0,
	// 默认原有信息
	restoreOpts: null,
	// 清除原有信息
	clear: function () {
		this.defaultCanDrawData = {};
		this.canDrawData = {};
		this.canTransformData = {};
	},
	// 清除画布
	clearRect: function () {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	// 初始化 canvas
	init: function () {
		this.createImage();
	},
	// 重绘
	redraw: function () {
		this.clearRect();
		if (this.imageInfo.img) {
			this.drawBgImage();
		}
		if (this.opts.drawImageCoverFlag) {
			this.drawImageCover();
		}
	},
	// 绘制图片
	createImage: function () {
		if (this.imageInfo.img) {
			this.initCanvas();
			if (this.opts.canRedraw) {
				this.redraw();
			}
		}
	},
	// 画背景图片
	drawBgImage: function () {
		// drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
		// 前 4 个是定义图像源的切片位置和大小，后 4 个则是定义切片的目标显示位置和大小
		var bgImgW = this.opts.realWidth;
		var bgImgH = this.opts.realHeight;
		var canvasW = this.opts.width * this.opts.imageScale;
		var canvasH = this.opts.height * this.opts.imageScale;
		this.opts.bgImageInfo.width = canvasW;
		this.opts.bgImageInfo.height = canvasH;
		var canvasX = this.opts.bgImageInfo.x;
		var canvasY = this.opts.bgImageInfo.y;
		this.ctx.drawImage(this.imageInfo.img, 0, 0, bgImgW, bgImgH, canvasX, canvasY, canvasW, canvasH);
	},
	// 初始化canvas
	initCanvas: function () {
		this.canvas.width = this.opts.width;
		this.canvas.height = this.opts.height;
	},
	// 改变data对象 数据
	changeImageOpts: function (data, attrStr, itemAttrObj, setData) {
		for (key in data) {
			if (Object.hasOwnProperty.call(data, key)) {
				var attrList = attrStr.split(',');
				if (attrList.indexOf(key) != -1) {
					if (typeof setData !== 'undefined') {
						if (typeof itemAttrObj === 'string') {
							var itemAttrist = itemAttrObj.split(',');
							if (itemAttrist.length === 1) {
								itemAttrist.map(function (item) {
									data[key][item] = setData;
								})
							} else {
								itemAttrist.map(function (item) {
									data[key][item] = setData[item];
								})
							}
						} else {
							var itemAttrist = itemAttrObj[key].split(',');
							itemAttrist.map(function (item) {
								data[key][item] = setData[item];
							})
						}
					} else {
						data[key] = itemAttrObj;
					}
				} else {
					if (CanvasUtils.dyTypeOf(data[key]) === 'object') {
						this.changeImageOpts(data[key], attrStr, itemAttrObj, setData);
					} else if (CanvasUtils.dyTypeOf(data[key]) === 'array') {
						data[key] = data[key].map(function (item) {
							this.changeImageOpts(item, attrStr, itemAttrObj, setData);
							return item;
						}.bind(this))
					}
				}
			}
		}
		return data;
	},
	// 获取data对象某个数据 attrStr 属性逗号列表 属性对应的对象 或者 字符
	getImageOpts: function (attrStr, itemAttrObj, data, flag) {
		if (!data) {
			if (!CanvasUtils.isEmptyObject(this.canDrawData)) {
				data = this.canDrawData;
			}
		}
		var resultObj = {};
		var attrList = attrStr.split(',');
		for (key in data) {
			if (Object.hasOwnProperty.call(data, key)) {
				if (attrList.indexOf(key) != -1) {
					if (itemAttrObj) {
						if (CanvasUtils.dyTypeOf(itemAttrObj) === 'string') {
							var itemAttrist = itemAttrObj.split(',');
						} else {
							if (itemAttrObj[key]) {
								var itemAttrist = itemAttrObj[key].split(',');
							} else {
								var itemAttrist = [key];
							}
						}
						if (CanvasUtils.dyTypeOf(data[key]) === 'object') {
							itemAttrist.map(function (item) {
								if (flag) {
									if (key === item) {
										resultObj[item] = data[key];
									} else {
										resultObj[item] = data[key][item];
									}
								} else {
									if (!resultObj[key]) {
										resultObj[key] = {};
									}
									if (key === item) {
										resultObj[key] = data[key];
									} else {
										resultObj[key][item] = data[key][item];
									}
								}

							})
						} else {
							if (flag) {
								resultObj = data[key];
							} else {
								resultObj[key] = data[key];
							}
						}
					} else {
						resultObj = data[key];
					}
				} else {
					if (CanvasUtils.dyTypeOf(data[key]) === 'object') {
						var resultData = this.getImageOpts(attrStr, itemAttrObj, data[key], true);
						if (resultData) {
							if (CanvasUtils.dyTypeOf(resultData) === 'object') {
								if (!CanvasUtils.isEmptyObject(resultData)) {
									resultObj[key] = resultData;
								}
							} else {
								resultObj[key] = resultData;
							}
						}
					}
				}
			}
		}

		return resultObj;
	},
	// 绘制图片叠加图层
	drawImageCover: function () {
		if (CanvasUtils.isEmptyObject(this.canDrawData)) {
			var drawData = this.getOperateDataByPro(CanvasUtils.depthClone(this.opts), 'canDraw', true);
			var canDrawData = CanvasUtils.clearEmptyObject(drawData.imageCoverConfig);
			if (CanvasUtils.isEmptyObject(canDrawData)) return;
			this.canDrawData = this.multiCalc(canDrawData, this.opts.defaultImageScale, 'imageDefaultScale');
		}
		this.drawItemCover(this.canDrawData);
	},
	// 获取对应 key 和 value
	getOperateDataByPro: function (data, type, value) {
		var resultData = {};
		for (var key in data) {
			if (Object.hasOwnProperty.call(data, key)) {
				if (CanvasUtils.dyTypeOf(data[key]) === 'object') {
					resultData[key] = this.getOperateDataByPro(data[key], type, value);
				} else if (CanvasUtils.dyTypeOf(data[key]) === 'array') {
					resultData[key] = data[key].map(function (item) {
						return this.getOperateDataByPro(item, type, value);
					}.bind(this))
				} else {
					if (type === 'canDraw' && key === type) {
						if (data[type] === value) {
							if (data.config) {
								resultData = data.config;
								break;
							}
						} else {
							break;
						}
					}
				}
			}
		}
		return resultData;
	},
	// 绘制单个叠加图层
	drawItemCover: function (opts) {
		for (var key in opts) {
			if (Object.hasOwnProperty.call(opts, key)) {
				this['drawCover'](opts[key]);
			}
		}
	},
	// 计算筛选
	multiCalc: function (dataObj, calcData, type) {
		if (CanvasUtils.dyTypeOf(dataObj) === 'object') {
			dataObj = this.multiCalcFn(dataObj, calcData, type);
		} else if (CanvasUtils.dyTypeOf(dataObj) === 'array') {
			dataObj = dataObj.map(function (item) {
				return this.multiCalc(item, calcData, type);
			}.bind(this))
		}
		return dataObj;
	},
	// 统一计算处理
	multiCalcFn: function (dataObj, calcData, type) {
		for (var key in dataObj) {
			if (Object.hasOwnProperty.call(dataObj, key)) {
				if (CanvasUtils.dyTypeOf(dataObj[key]) === 'object') {
					dataObj[key] = this.multiCalcFn(dataObj[key], calcData, type);
				} else if (CanvasUtils.dyTypeOf(dataObj[key]) === 'array') {
					if (key === 'polygonList' || key === 'needCalcPointList') {
						var result = this.dealTransFormRule(dataObj[key], calcData, type, key);
						delete dataObj[key]
						key = 'pointList';
						dataObj[key] = result;
					} else {
						dataObj[key] = dataObj[key].map(function (item) {
							return this.multiCalc(item, calcData, type);
						}.bind(this))
					}
				} else {
					dataObj = this.dealTransFormRule(dataObj, calcData, type, key);
				}
			}
		}
		return dataObj;
	},
	transImageDefaultScaleList: ['x', 'y', 'r', 'l', 'lineWidth', 'lineLength', 'maxLineLength', 'spaceLength', 'polygonList', 'needCalcPointList', 'paddingNum', 'paddingArrowNum'],
	transImageScaleList: ['r', 'l', 'lineWidth', 'lineLength', 'maxLineLength', 'spaceLength'],
	transInitImageScale: ['r', 'l', 'lineWidth', 'lineLength', 'maxLineLength', 'spaceLength', 'fixedWidth', 'defaultRulerWidth', 'blankSpace', 'itemSpace', 'itemPointLength', 'rulerSpaceLength', 'virtualLineWidth', 'virtualLineLength', 'maxVirtualLineLength'],
	transFixedPointScaleList: ['point'],
	transImageMoveList: ['x', 'y'],
	transImageScaleMoveList: ['x', 'y'],
	transWrnRulerScaleList: ['itemLineCount'],
	transWrnRulerMoveList: ['x', 'y'],
	transWrnRulerRotateList: ['rotate'],
	transwrnLineMoveList: ['x', 'y'],
	// 处理变化函数。
	dealTransFormRule: function (dataObj, calcData, type, key) {
		if (key === 'fontSize' && type === 'fontSizeScale') {
			dataObj[key] = Number(dataObj[key]) * calcData;
		}
		if (this.transInitImageScale.indexOf(key) != -1 && type === 'initImageScale') {
			dataObj[key] = Number(dataObj[key]) * calcData;
		}
		if (this.transImageDefaultScaleList.indexOf(key) != -1 && type === 'imageDefaultScale') {
			if (key === 'polygonList' || key === 'needCalcPointList') {
				dataObj = this.dealPolygonListFn(dataObj, calcData);
				if (key === 'needCalcPointList') {
					dataObj = this.dealNeedCalcListFn(dataObj);
				}
			} else {
				dataObj[key] = Number(dataObj[key]) * calcData;
			}
		}
		if (this.transImageDefaultScaleList.indexOf(key) != -1 && type === 'fixedPointScale') {
			dataObj[key].x = Number(dataObj[key].x) * calcData;
			dataObj[key].y = Number(dataObj[key].y) * calcData;
		}
		if (this.transImageScaleList.indexOf(key) != -1 && type === 'imageScale') {
			dataObj[key] = Number(dataObj[key]) * calcData;
		}
		if (this.transImageMoveList.indexOf(key) != -1 && type === 'imageMove') {
			if (calcData[key]) {
				dataObj[key] = Number(dataObj[key]) + calcData[key];
			}
		}
		if (this.transImageScaleMoveList.indexOf(key) != -1 && type === 'imageScaleMove') {
			if (calcData > 0) {
				dataObj[key] = Number(dataObj[key]) + (Number(dataObj[key]) - this.opts.fixedScalePoint[key]) * this.imageInfo.resizeScale;
			} else {
				dataObj[key] = Number(dataObj[key]) - (Number(dataObj[key]) - this.opts.fixedScalePoint[key]) * this.imageInfo.resizeScale / (1 + this.imageInfo.resizeScale);
			}
		}
		if (this.transWrnRulerScaleList.indexOf(key) != -1 && type === 'rulerScale') {
			dataObj[key] = Number(dataObj[key]) + calcData;
			if (dataObj[key] <= dataObj.minItemLineCount) {
				dataObj[key] = dataObj.minItemLineCount;
			}
		}
		if (this.transWrnRulerMoveList.indexOf(key) != -1 && type === 'rulerMove') {
			if (calcData[key]) {
				dataObj[key] = Number(dataObj[key]) + calcData[key];
			}
		}
		if (this.transWrnRulerRotateList.indexOf(key) != -1 && type === 'rulerRotate') {
			if (key === 'rotate') {
				if (calcData[key]) {
					dataObj[key] += calcData[key];
					if (dataObj[key] > 180) {
						dataObj[key] = dataObj[key] - 360;
					}
					if (dataObj[key] < -180) {
						dataObj[key] = dataObj[key] + 360;
					}
				}
			}
		}
		return dataObj;
	},
	// 处理后端返回的point数据
	dealPolygonListFn: function (list, calcData) {
		var resultList = [];
		if (!list || list.length == 0) return resultList;

		if (CanvasUtils.dyTypeOf(list) === 'array') {
			(list || []).map(function (item, index, arr) {
				if (CanvasUtils.dyTypeOf(item) === 'array') {
					resultList.push(this.dealPolygonListFn(item, calcData));
				} else {
					if (index === 0) {
						resultList = this.dealPolygonItemListFn(list, calcData);
					}
				}
			}.bind(this))
		}
		return resultList;
	},
	// 处理后端返回的point数据
	dealPolygonItemListFn: function (data, calcData) {
		var itemData = {};
		(data || []).map(function (item, index, arr) {
			if (index === 0) {
				if (CanvasUtils.dyTypeOf(item) === 'object') {
					if (itemData.x) {
						itemData.x = Number(item.x) * calcData;
					}
					if (itemData.y) {
						itemData.y = Number(item.y) * calcData;
					}
				} else {
					itemData.x = Number(arr[0]) * calcData;
					itemData.y = Number(arr[1]) * calcData;
				}
			}
		}.bind(this))
		return itemData;
	},
	// 处理后端返回的bbox数据
	dealNeedCalcListFn: function (list) {
		var resultList = [];
		if (list.length === 0) return resultList;
		if (CanvasUtils.dyTypeOf(list[0]) === 'array') {
			(list || []).map(function (item) {
				var itemList = [];
				if (CanvasUtils.dyTypeOf(item[0]) === 'array') {
					item.map(function (pointItem) {
						if (pointItem.length >= 3) {
							pointItem.push(pointItem[0])
							itemList.push(pointItem);
						} else {
							itemList.push(this.getCompletePointList(pointItem));
						}
					}.bind(this))
				} else {
					if (item.length >= 3) {
						item.push(item[0])
						itemList = item;
					} else {
						itemList = this.getCompletePointList(item);
					}
				}
				resultList.push(itemList);
			}.bind(this))
		} else {
			if (list.length >= 3) {
				list.push(list[0])
				resultList.push(list);
			} else {
				resultList.push(this.getCompletePointList(list));
			}
		}
		return resultList;
	},
	// 处理为完整的point数据
	getCompletePointList: function (data) {
		var resultList = [];
		if (data.length === 0) return resultList;
		resultList = this.getItemCompletePointList(data);
		return resultList;
	},
	// 单个数据处理
	getItemCompletePointList: function (list) {
		var resultList = [];
		for (var i = 0; i < 4; i++) {
			if (i === 0 || i === 2) {
				var t = (i - 1) > 0 ? i - 1 : 0;
				resultList.push(list[t])
			}
			if (i === 1) {
				var obj = {
					x: list[1].x,
					y: list[0].y
				};
				resultList.push(obj)
			}
			if (i === 3) {
				var obj = {
					x: list[0].x,
					y: list[1].y
				};
				resultList.push(obj)
			}
		}
		resultList.push(CanvasUtils.depthClone(resultList[0]));
		return resultList;
	},
	// 获取尺子前面刻度总数
	getPrevTotalLengthFn: function (data, prevIndex) {
		var sum = 0;
		if (prevIndex >= 0) {
			for (var i = 0; i <= prevIndex; i++) {
				sum += data[i].l;
			}
		}
		return sum;
	},
	// 处理预警线移动函数
	dealWrnLineMoveFn: function (dataObj, data, calcData, rotate, type) {
		if (type === 'wrnLineMove') {
			var dy = calcData / Math.cos(rotate * Math.PI / 180);
			if (dy === 0) return data;
			var index = Number(dataObj.currentIndex);
			var totalIndex = data.length - 1;
			var prevIndex = index - 1;
			var prevL = this.getPrevTotalLengthFn(data, prevIndex);
			var nextIndex = index + 1;
			var nextL = data[nextIndex] ? data[nextIndex].l : 0;
			var totalLength = data[index].l + nextL;
			totalLength = nextIndex > totalIndex ? this.maxRulerLength - prevL : totalLength;
			data[index].l = (data[index].l - dy) <= dataObj.lineWidth ? dataObj.lineWidth : data[index].l - dy;
			if (nextIndex <= totalIndex) {
				data[index].l = data[index].l >= totalLength ? totalLength - dataObj.lineWidth : data[index].l;
			}
			if (prevIndex < 0) {
				data[index].l = (data[index].l - dy) <= 0 ? 0 : data[index].l - dy;
			}
			data[nextIndex] && (data[nextIndex].l = totalLength - data[index].l);
		}
		return data;
	},
	// 创建图层
	drawCover: function (opts) {
		for (var key in opts) {
			if (Object.hasOwnProperty.call(opts, key)) {
				if (opts[key].canDraw) {
					// 调用各个创建的预警图层
					this['draw' + CanvasUtils.firstWorldTransFn(key, 'upper') + 'Cover'](opts[key]);
				}
			}
		}
	},
	// 单个尺度绘制
	getWarnRulerCalibrationLine: function (opts, startP, isFirst, isLast, index) {
		// 刻度线的半长度
		var deviation;
		if (isFirst || isLast) {
			deviation = opts.maxLineLength || opts.lineLength;
		} else {
			deviation = opts.lineLength;
		}
		var line = CanvasUtils.depthClone(opts);
		var nextP = startP;
		if (!isFirst) {
			nextP = CanvasUtils.getPositionByOptsL(nextP.x,
				nextP.y, opts.spaceLength,
				opts.rotate, opts.ruleDirectionValue);
		}

		line.pointList = [{
			x: nextP.x - deviation,
			y: nextP.y
		},
		{
			x: nextP.x + deviation,
			y: nextP.y
		}
		]
		if (this.isNextPNotLegal(nextP, opts) && !isLast && index > opts.minItemLineCount && this.opts.vilidatePoint) {
			return {
				end: true,
				nextP: startP
			};
		} else {
			return {
				line: line,
				nextP: nextP
			};
		}

	},
	// 判断尺子终点坐标合法性
	isNextPNotLegal: function (endP, opts) {
		var maxLineLength = Math.max(opts.maxLineLength, opts.spaceLength);
		if ((endP.x - maxLineLength) <= 0 || (endP.x + maxLineLength) >= this.canvas.width) {
			return true;
		}
		if (endP.y - maxLineLength <= 0 || (endP.y + maxLineLength) >= this.canvas.height) {
			return true;
		}
	},
	// 判断尺子起点坐标的合法性
	getStartPLegal: function (opts) {
		var startP = opts.point;
		if (this.opts.vilidatePoint) return startP;
		var maxLineLength = 0;
		if ((startP.x - maxLineLength) <= 0) {
			startP.x = maxLineLength;
		}
		if ((startP.x + maxLineLength) >= this.canvas.width) {
			startP.x = this.canvas.width - maxLineLength;
		}
		if (startP.y - maxLineLength <= 0) {
			startP.y = maxLineLength;
		}
		if ((startP.y + maxLineLength) >= this.canvas.height) {
			startP.y = this.canvas.heihgt - maxLineLength;
		}
		return startP;
	},
	// 创建预警尺 200px 20个刻度
	drawCommonWrnRulerCover: function (opts) {
		// if ( this.opts.isfixedScalePoint ) {
		//     opts.point = this.getStartPLegal( opts );
		// }
		var options = CanvasUtils.depthClone(opts);
		// 处理尺子放大
		options.ruleDirectionValue = options.ruleDirection === 'up' ? -1 : 1;
		// 画尺子
		var itemLineInfoOpts = CanvasUtils.deepObjectMerge(CanvasUtils.depthClone(options), options.itemLineInfo);
		var endPoint = this.drawWrnRuler(itemLineInfoOpts, options.point);
		// 画尺子可缩放的选择范围   
		this.drawWarnRuleScaleRange(CanvasUtils.depthClone(options), endPoint);
		// 画尺子可拖动的选择范围
		this.drawWarnRuleDragRange(CanvasUtils.depthClone(options), endPoint);
		// 画尺子可旋转的选择范围   
		this.drawWarnRuleRotateRange(CanvasUtils.depthClone(options), endPoint);
		// 画预警线
		var wrnLineInfoOpts = CanvasUtils.deepObjectMerge(CanvasUtils.depthClone(options), options.wrnLineInfo);
		this.dealDrawWrnLine(wrnLineInfoOpts, options.point);
	},
	// 画尺子
	drawWrnRuler: function (opts, startPoint) {
		var lines = [];
		var nextPoint;
		// 原点的长线 配置项 相对点坐标 是不是起点
		var info = this.getWarnRulerCalibrationLine(opts, startPoint, true, 0);
		lines.push(info.line);
		nextPoint = info.nextP;
		for (var i = 1; i < opts.itemLineCount; i++) {
			// 中间的短线
			info = this.getWarnRulerCalibrationLine(opts, nextPoint, false, false, i);
			if (info.end) {
				break;
			} else {
				lines.push(info.line);
				nextPoint = info.nextP;
			}
		}
		this.maxRulerLength = i * opts.spaceLength;
		// 尾部的长线
		info = this.getWarnRulerCalibrationLine(opts, nextPoint, false, true, i);
		lines.push(info.line);
		nextPoint = info.nextP;
		// 竖向的长线
		var vLine = CanvasUtils.depthClone(opts);
		vLine.pointList = [startPoint, nextPoint];
		lines.push(vLine);

		lines.forEach(function (item) {
			this.drawLine(item);
		}.bind(this));
		return nextPoint;
	},
	// 画预警尺子可以拖动的范围
	drawWarnRuleDragRange: function (opts, endP) {
		opts.lineWidth = 1;
		opts.lineColor = 'blue'
		opts.stroke = this.outlineStroke;
		opts.fill = false;
		var startPoint = opts.point;
		var deviation = opts.itemLineInfo.maxLineLength;
		var endPoint = {
			x: endP.x + opts.itemLineInfo.lineLength * 2 * Math.sin(opts.rotate * Math.PI / 180),
			y: endP.y + opts.itemLineInfo.lineLength * 2 * Math.cos(opts.rotate * Math.PI / 180)
		};
		opts.pointList = [{
			x: startPoint.x - deviation,
			y: startPoint.y
		},
		{
			x: startPoint.x + deviation,
			y: startPoint.y
		},
		{
			x: endPoint.x + deviation,
			y: endPoint.y
		},
		{
			x: endPoint.x - deviation,
			y: endPoint.y
		},
		{
			x: startPoint.x - deviation,
			y: startPoint.y
		}
		];
		this.drawLine(opts, true, 'rectDragMove');
	},
	// 画预警尺子可以旋转的范围
	drawWarnRuleRotateRange: function (opts, endP) {
		opts.lineWidth = 1;
		opts.lineColor = 'red'
		opts.stroke = this.outlineStroke;
		opts.fill = false;
		var deviation = opts.itemLineInfo.maxLineLength;
		var endPoint = endP;
		opts.pointList = [{
			x: endPoint.x - deviation,
			y: endPoint.y + deviation
		},
		{
			x: endPoint.x - deviation,
			y: endPoint.y - deviation
		},
		{
			x: endPoint.x + deviation,
			y: endPoint.y - deviation
		},
		{
			x: endPoint.x + deviation,
			y: endPoint.y + deviation
		},
		{
			x: endPoint.x - deviation,
			y: endPoint.y + deviation
		}
		];
		this.drawLine(opts, true, 'rectDragMoveRotate');
	},
	// 画尺子缩放范围
	drawWarnRuleScaleRange: function (opts, endP) {
		opts.lineWidth = 1;
		opts.lineColor = 'orange'
		opts.stroke = this.outlineStroke;
		opts.fill = false;
		var startPoint = opts.point;
		var deviation = opts.itemLineInfo.maxLineLength;
		var endPoint = endP;
		opts.pointList = [{
			x: startPoint.x - deviation,
			y: startPoint.y
		},
		{
			x: startPoint.x + deviation,
			y: startPoint.y
		},
		{
			x: endPoint.x + deviation,
			y: endPoint.y
		},
		{
			x: endPoint.x - deviation,
			y: endPoint.y
		},
		{
			x: startPoint.x - deviation,
			y: startPoint.y
		}
		];
		this.drawLine(opts, true, 'rectWheelScale');
	},
	// 画预警线
	dealDrawWrnLine: function (opts, startPoint) {
		var options = CanvasUtils.depthClone(opts);
		var startP = CanvasUtils.depthClone(startPoint);
		var len = options.dWrnLineLengthList.length;
		var resLen = options.wrnLineCount - len;
		if (resLen > 0) {
			for (var li = 0; li < resLen; li++) {
				options.dWrnLineLengthList.push({
					index: len + li,
					l: options.itemLineInfo.spaceLength * 2
				});
				options.textList.push('预警线' + (len + li + 1));
				options.colorList.push(CanvasUtils.getRandomColor());
			}
		} else {
			options.dWrnLineLengthList = options.dWrnLineLengthList.slice(0, len);
			options.colorList = options.colorList.slice(0, len);
			options.textList = options.textList.slice(0, len);
		}
		var pointList = [];
		for (var i = 0; i < options.wrnLineCount; i++) {
			options.pointList = [];
			var endP = CanvasUtils.getPositionByOptsL(startP.x,
				startP.y, options.dWrnLineLengthList[i].l,
				options.rotate, options.ruleDirectionValue);
			var cStartP = {};
			var cEndP = {};
			cStartP.x = endP.x - options.lineLength;
			cEndP.x = endP.x + options.lineLength;
			cStartP.y = cEndP.y = endP.y;
			options.lineColor = options.colorList[i];
			options.currentText = options.textList[i];
			options.pointList.push(cStartP);
			options.pointList.push(cEndP);
			options.zIndex = opts.zIndex + i;
			pointList.push(options.pointList);
			this.drawWrnLine(options);
			this.drawWrnLineRange(options, i);
			startP = endP;
		}
		this.changeDrawDataWrnLineInfo(options, pointList);
	},
	// 填充默认配置坐标数组
	changeDrawDataWrnLineInfo: function (opts, pointList) {
		this.changeImageOpts(this.canDrawData, 'wrnLineInfo', 'dWrnLineLengthList,textList,colorList,pointList', {
			dWrnLineLengthList: opts.dWrnLineLengthList,
			textList: opts.textList,
			colorList: opts.colorList,
			pointList: pointList
		});
	},
	// 画预警线的范围
	drawWrnLineRange: function (opts, index) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 1;
		options.lineColor = 'green';
		options.stroke = this.outlineStroke;
		var deviation = opts.lineWidth;
		var point0 = opts.pointList[0];
		var point1 = opts.pointList[1];
		options.pointList = [{
			x: point0.x - deviation,
			y: point0.y + deviation / 2
		}, {
			x: point1.x + deviation,
			y: point1.y + deviation / 2
		}, {
			x: point1.x + deviation,
			y: point1.y - deviation / 2
		}, {
			x: point0.x - deviation,
			y: point0.y - deviation / 2
		}, {
			x: point0.x - deviation,
			y: point0.y + deviation / 2
		}];
		this.drawLine(options, true, 'rectDragMove', index);
	},
	// 绘制预警线相关信息
	drawWrnLine: function (opts) {
		this.drawLine(opts);
		this.drawArrow(opts);
		if (opts.showWrnText) {
			this.drawWrnText(opts);
		}
	},
	// 画预警文字信息
	drawWrnText: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.fillStyle = opts.lineColor;
		options.textPointList = [];
		options.textPointList.push({
			text: options.currentText,
			x: opts.pointList[1].x + options.lineWidth + 5,
			y: opts.pointList[1].y
		});
		this.drawText(options);
	},
	// 画预警线的左右箭头
	drawArrow: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 1;
		options.fill = true;
		// options.stroke = false;
		options.fillStyle = opts.lineColor;
		opts.pointList.map(function (item, index) {
			options.pointList = [];
			var width = index === 0 ? opts.lineWidth : -opts.lineWidth;
			options.pointList.push({
				x: item.x,
				y: item.y + opts.lineWidth / 2
			});
			options.pointList.push({
				x: item.x,
				y: item.y - opts.lineWidth / 2
			});
			options.pointList.push({
				x: item.x - width,
				y: item.y
			});
			this.drawLine(options);
		}.bind(this))
	},
	// 判断尺子的方位
	getRulerDirection: function (opts) {
		var maxWidth;
		var pointObj;
		if (opts.type.indexOf('fixed') !== -1) {
			maxWidth = opts.fixedWidth;
		} else {
			maxWidth = opts.fixedWidth;
		}
		if (opts.type.indexOf('fixed') !== -1) {
			pointObj = opts.pointList[2];
		} else {
			pointObj = opts.pointList[3];
		}
		if (this.opts.width * this.opts.imageScale - (pointObj.x - this.opts.bgImageInfo.x + maxWidth) > 0) {
			opts.rulerPosition = 'right';
		} else {
			opts.rulerPosition = 'left';
		}
	},
	// 	判断尺子的限制值
	getRulerHeightAndBoxHeight (opts,cHeight, maxHeight) {
		if (cHeight > maxHeight) {
			if(opts.type === 'fixed'){
				return {
					flag: true,
					rulerHeight: maxHeight
				};
			}else{
				return {
					flag: true,
					rulerHeight: cHeight
				};
			}			
		} else {
			return {
				flag: false
			}
		}
	},
	// 获取尺子的高度
	getRulerHeight: function (opts) {
		var bHeight = opts.ruler.rulerSpaceLength * opts.ruler.downRulerNum;		
		var cHeight;
		var muniNum = 0;
		var startP;
		var defaultRulerHeight;		
		if (opts.type === 'fixed') {
			if (opts.rulerPosition === 'right') {
				startP = opts.pointList[2];
				defaultRulerHeight = startP.y - opts.pointList[1].y;
				cHeight = (startP.y - this.opts.bgImageInfo.y) - opts.blankSpace;
				muniNum = 3;
			} else {
				startP = opts.pointList[3];
				defaultRulerHeight = startP.y - opts.pointList[0].y;
				cHeight = (startP.y - this.opts.bgImageInfo.y) - (Math.abs(Math.tan(opts.rotate * Math.PI / 180) * opts.fixedWidth) + opts.blankSpace);
				muniNum = 2;
			}
		} else {
			if (opts.rulerPosition === 'right') {
				startP = opts.pointList[3];
				cHeight = (startP.y - this.opts.bgImageInfo.y) - opts.pointList[0].y;
				muniNum = 4;
			} else {
				startP = opts.pointList[2];
				cHeight = (startP.y - this.opts.bgImageInfo.y) - opts.pointList[1].y;
				muniNum = 3;
			}
		}
		var maxHeight = opts.detailBoxInfo.itemSpace * (4 / 3 + opts.detailBoxInfo.labelInfo.list.length + 1 / 2) + (opts.detailBoxInfo.timeInfo.fontSize || opts.detailBoxInfo.fontSize || opts.fontSize) / 3;
		var rulerHeight;
		var boxHeight;
		var boxStartPoint = {};
		var increHeihgt = opts.detailBoxInfo.itemSpace + opts.blankSpace;
		var cMaxHeight = maxHeight + increHeihgt;
		var resultData = this.getRulerHeightAndBoxHeight(opts,cHeight, cMaxHeight);
		if (resultData.flag) {
			rulerHeight = resultData.rulerHeight;
			boxHeight = rulerHeight + bHeight;
			boxStartPoint.y = startP.y - increHeihgt - 1 / 2 * opts.detailBoxInfo.itemSpace;
		} else {
			increHeihgt = opts.detailBoxInfo.itemSpace;
			cMaxHeight = maxHeight + increHeihgt;
			resultData = this.getRulerHeightAndBoxHeight(opts,cHeight, cMaxHeight);
			if (resultData.flag) {
				rulerHeight = resultData.rulerHeight;
				boxHeight = rulerHeight + bHeight;
				boxStartPoint.y = startP.y - increHeihgt - 1 / 2 * opts.detailBoxInfo.itemSpace;
			} else {
				increHeihgt = opts.blankSpace;
				cMaxHeight = maxHeight + increHeihgt;
				resultData = this.getRulerHeightAndBoxHeight(opts,cHeight, cMaxHeight);
				if (resultData.flag) {
					rulerHeight = resultData.rulerHeight;
					boxHeight = rulerHeight + bHeight;
					boxStartPoint.y = startP.y - increHeihgt - 1 / 2 * opts.detailBoxInfo.itemSpace;
				} else {
					increHeihgt = 0;
					cMaxHeight = maxHeight + increHeihgt;
					resultData = this.getRulerHeightAndBoxHeight(opts,cHeight, cMaxHeight);
					if (resultData.flag) {
						rulerHeight = resultData.rulerHeight;
						boxHeight = rulerHeight + bHeight;
						boxStartPoint.y = startP.y - increHeihgt - 1 / 2 * opts.detailBoxInfo.itemSpace;
					} else {
						var dHeight = cHeight + bHeight;
						resultData = this.getRulerHeightAndBoxHeight(opts,dHeight, maxHeight);
						if (resultData.flag) {
							rulerHeight = cHeight;
							boxHeight = dHeight;
							boxStartPoint.y = startP.y - (dHeight - maxHeight - 1 / 2 * opts.detailBoxInfo.itemSpace);
						} else {
							rulerHeight = cHeight;
							boxHeight = maxHeight;
							boxStartPoint.y = startP.y + (maxHeight - rulerHeight - 1 / 2 * opts.detailBoxInfo.itemSpace - (opts.detailBoxInfo.timeInfo.fontSize || opts.detailBoxInfo.fontSize || opts.fontSize) / muniNum);
						}
					}
				}
			}
		}
		if (opts.type.indexOf('fixed') !== -1) {
			if (opts.rulerPosition === 'right') {
				// 内部框框
				boxStartPoint.x = opts.pointList[2].x + opts.blankSpace + opts.ruler.maxVirtualLineLength + opts.ruler.maxVirtualLineWidth;
				if(defaultRulerHeight > rulerHeight){
					rulerHeight = defaultRulerHeight;
					boxHeight = rulerHeight + bHeight;
				}
			} else {
				// 内部框框
				boxStartPoint.x = opts.pointList[3].x - opts.blankSpace - opts.ruler.maxVirtualLineLength - opts.ruler.maxVirtualLineWidth;
			}			
			opts.needRulerRect = true;
		} else {
			if (opts.rulerPosition === 'right') {
				// 内部框框
				boxStartPoint.x = opts.pointList[3].x + opts.ruler.maxVirtualLineLength + opts.ruler.maxVirtualLineWidth;
			} else {
				// 内部框框
				boxStartPoint.x = opts.pointList[2].x - opts.ruler.maxVirtualLineLength - opts.ruler.maxVirtualLineWidth;
			}
			opts.needRulerRect = false;
		}			
		opts.ruler.itemLineCount = Math.ceil(rulerHeight / opts.ruler.rulerSpaceLength);			
		return {
			boxStartPoint: boxStartPoint,
			boxHeight: boxHeight + opts.blankSpace * 2,
			rulerHeight: rulerHeight
		}
	},
	// 绘制虚拟水尺
	drawCommonVirtualRulerCover: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.pointList = options.pointList[0];
		this.getRulerDirection(options);
		// 需要外框 画外框
		options.rulerWidth = options.defaultRulerWidth;
		var heightOpts = this.getRulerHeight(options);
		options.boxStartPoint = heightOpts.boxStartPoint;
		options.rulerHeight = heightOpts.rulerHeight;
		options.fixedHeight = heightOpts.boxHeight;
		if (options.rulerPosition === 'right') {
			if (options.type.indexOf('fixed') !== -1) { //fixed
				// 尺子底部的坐标是定的
				options.rulerStartPoint = {
					x: options.pointList[2].x + options.blankSpace,
					y: options.pointList[2].y
				}
				// 遮罩基准坐标
				options.rectMaskStartPoint = {
					x: options.pointList[2].x,
					y: options.pointList[2].y + (options.fixedHeight - opts.blankSpace - options.rulerHeight)
				}
			} else {
				options.rulerStartPoint = {
					x: options.pointList[3].x ,
					y: options.pointList[3].y
				}
				// 遮罩基准坐标
				options.rectMaskStartPoint = {
					x: options.pointList[3].x - opts.blankSpace,
					y: options.pointList[3].y + (options.fixedHeight - opts.blankSpace - options.rulerHeight)
				}
			}
		} else {
			if (options.type.indexOf('fixed') !== -1) { //fixed
				// 尺子底部的坐标是定的
				options.rulerStartPoint = {
					x: options.pointList[3].x - options.blankSpace,
					y: options.pointList[3].y
				}
				// 遮罩基准坐标
				options.rectMaskStartPoint = {
					x: options.pointList[3].x,
					y: options.pointList[3].y + (options.fixedHeight - opts.blankSpace - options.rulerHeight)
				}
			} else {
				// 尺子底部的坐标是定的
				options.rulerStartPoint = {
					x: options.pointList[2].x,
					y: options.pointList[2].y
				}
				// 遮罩基准坐标
				options.rectMaskStartPoint = {
					x: options.pointList[2].x,
					y: options.pointList[2].y + (options.fixedHeight - opts.blankSpace - options.rulerHeight)
				}
			}
		}
		if (options.needRulerRect) {
			this.drawLine(options);
		}
		options.spaceLength = options.rulerHeight / options.ruler.itemLineCount;
		// 画外面的遮罩
		var rectMaskOpts = CanvasUtils.deepObjectMerge(CanvasUtils.depthClone(options), options.rectMask);
		this.drawRectMask(rectMaskOpts);
		// 画水尺刻度
		var rulerOpts = CanvasUtils.deepObjectMerge(CanvasUtils.depthClone(options), options.ruler);
		this.drawVirtualRuler(rulerOpts);
		// 画文字虚拟外框
		var detailBoxOpts = CanvasUtils.deepObjectMerge(CanvasUtils.depthClone(options), options.detailBoxInfo);
		this.drawTextVirtualBox(detailBoxOpts);
	},
	// 绘制斜角框框
	drawSkewRect: function (opts, startP) {
		var options = CanvasUtils.depthClone(opts);
		if (options.rulerPosition === 'right') {
			var endP = {};
			options.pointList = [];
			options.pointList.push(startP);
			endP = CanvasUtils.getPositionByOptsL(startP.x, startP.y, options.boxWidth, options.rotate - 90, -1);
			options.pointList.push(endP);
			endP = CanvasUtils.getPositionByOptsL(endP.x, endP.y, options.boxHeight, 0, -1);
			options.pointList.push(endP);
			endP = CanvasUtils.getPositionByOptsL(endP.x, endP.y, options.boxWidth, 90 + options.rotate, -1);
			options.pointList.push(endP);
			options.pointList.push(startP);
		} else {
			var endP = {};
			options.pointList = [];
			options.pointList.push(startP);
			endP = CanvasUtils.getPositionByOptsL(startP.x, startP.y, options.boxHeight, 0, -1);
			options.pointList.push(endP);
			endP = CanvasUtils.getPositionByOptsL(endP.x, endP.y, options.boxWidth, 90 + options.rotate, -1);
			options.pointList.push(endP);
			endP = CanvasUtils.getPositionByOptsL(endP.x, endP.y, options.boxHeight, 180, -1);
			options.pointList.push(endP);
			options.pointList.push(startP);
		}
		this.drawLine(options);
		return options.pointList;
	},
	drawRectMask: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.boxWidth = options.fixedWidth;
		options.boxHeight = options.fixedHeight;
		var startP = options.rectMaskStartPoint;
		this.drawSkewRect(options, startP);
	},
	drawMaxLenArrow: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 1;
		options.fill = true;
		// options.stroke = false;
		options.fillStyle = opts.lineColor;
		options.pointList = [];
		var item = opts.pointList[1];
		var width = options.rulerPosition === 'right' ? opts.lineWidth : -opts.lineWidth;
		options.pointList.push({
			x: item.x,
			y: item.y + opts.lineWidth / 2
		});
		options.pointList.push({
			x: item.x,
			y: item.y - opts.lineWidth / 2
		});
		options.pointList.push({
			x: item.x + width,
			y: item.y
		});
		this.drawLine(options);
	},
	// 单个虚拟水尺尺度绘制
	getVirtualRulerCalibrationLine: function (opts, startP, isFirst, isLast, index) {
		// 刻度线的半长度
		var deviation;
		if (isFirst || isLast) {
			deviation = opts.maxVirtualLineLength || opts.virtualLineLength;
		} else {
			deviation = opts.virtualLineLength;
		}
		var line = CanvasUtils.depthClone(opts);
		if (isFirst) {
			line.lineWidth = opts.maxVirtualLineWidth;
		}
		var nextP = startP;
		if (opts.rulerPosition === 'right') {
			if (!isFirst) {
				nextP = CanvasUtils.getPositionByOptsL(nextP.x,
					nextP.y, opts.spaceLength,
					opts.rulerLongLineRotate, -1);
			}
			endP = CanvasUtils.getPositionByOptsL(nextP.x,
				nextP.y, deviation,
				opts.itemRotate, -1);
			if (isFirst && opts.showLabelText) {
				var options = CanvasUtils.depthClone(opts);
				options.fillStyle = options.lineColor;
				options.textPointList = [{
					text: '0.00m',
					x: endP.x + line.lineWidth,
					y: endP.y
				}];
				this.drawText(options)
			}
		} else {
			if (!isFirst) {
				nextP = CanvasUtils.getPositionByOptsL(nextP.x,
					nextP.y, opts.spaceLength,
					opts.rulerLongLineRotate, -1);
			}
			endP = CanvasUtils.getPositionByOptsL(nextP.x,
				nextP.y, deviation,
				opts.itemRotate, -1);
			if (isFirst && opts.showLabelText) {
				var options = CanvasUtils.depthClone(opts);
				var text = '0.00m';
				var x = endP.x - this.getTextLenWidth(opts, text) - line.lineWidth;
				options.textPointList = [{
					text: text,
					x: x,
					y: endP.y
				}];
				this.drawText(options);
			}
		}
		line.pointList = [nextP, endP];
		this.drawMaxLenArrow(line);
		return {
			line: line,
			nextP: nextP
		};
	},
	// 根据文字的个数获取宽度
	getTextLenWidth: function (opts, str) {
		var strNum = CanvasUtils.checkSum(str);
		var baseWidth = (opts.fontSize || 12) / 2;
		if (opts.fontSizeCanResize) {
			if (this.opts.imageScale >= 1.6 && this.opts.imageScale < 2.4) {
				baseWidth += 2;
			}
			if (this.opts.imageScale >= 2.4) {
				baseWidth += 2;
			}
		}
		return baseWidth * strNum;
	},
	// 绘制虚拟水尺
	drawVirtualRuler: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = opts.virtualLineWidth;
		// 处理尺子放大
		options.ruleDirectionValue = options.ruleDirection === 'up' ? -1 : 1;
		var startPoint = options.rulerStartPoint;
		var lines = [];
		var nextPoint;
		if (options.rulerPosition === 'right') {
			options.itemRotate = opts.rotate - 90;
		} else {
			options.itemRotate = 90 + opts.rotate;
		}
		// 原点的长线 配置项 相对点坐标 是不是起点
		var info = this.getVirtualRulerCalibrationLine(options, startPoint, true, 0);
		lines.push(info.line);
		nextPoint = info.nextP;
		var downNextP = CanvasUtils.depthClone(nextPoint);
		var downOptions = CanvasUtils.depthClone(options);
		// 向下的线条刻度
		for (var j = 0; j < options.downRulerNum; j++) {
			downOptions.rulerLongLineRotate = 180;
			// 中间的短线
			info = this.getVirtualRulerCalibrationLine(downOptions, downNextP, false, false, j);
			lines.push(info.line);
			downNextP = info.nextP;
		}
		// 向上的线条刻度
		for (var i = 1; i < options.itemLineCount; i++) {
			// 中间的短线
			info = this.getVirtualRulerCalibrationLine(options, nextPoint, false, false, i);
			lines.push(info.line);
			nextPoint = info.nextP;
		}
		// 尾部的长线
		info = this.getVirtualRulerCalibrationLine(options, nextPoint, false, false, i);
		lines.push(info.line);
		nextPoint = info.nextP;
		// 竖向的长线
		var vLine = CanvasUtils.depthClone(opts);
		vLine.pointList = [downNextP, nextPoint];
		lines.push(vLine);
		lines.forEach(function (item) {
			this.drawLine(item);
		}.bind(this));
		return nextPoint;
	},
	// 虚拟水尺的内部的box
	drawTextVirtualBox: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		// 虚拟水尺的内部的框框
		var boxInfo = this.drawVirtualBox(options);
		// 虚拟水尺的内部的文字
		this.drawVirtualLabel(options, boxInfo);
		// 虚拟水尺的外部的时间
		this.drawVirtualTime(options, boxInfo);
	},
	// box内容
	drawVirtualLabel: function (opts, boxInfo) {
		var options = CanvasUtils.depthClone(opts);
		var point = boxInfo.pointList[0];
		var itemX;
		var itemY;
		var dl = options.rulerPosition === 'right' ? 1 : -1;
		var titleInfo = options.titleInfo;
		var labelInfo = options.labelInfo;
		var len = labelInfo.list.length;
		if (options.rulerPosition === 'right') {
			itemX = options.blankSpace;
			itemY = 4 * (options.itemSpace / 6);
		} else {
			itemX = (boxInfo.boxWidth - options.blankSpace) * dl;
			itemY = 6 * (options.itemSpace / 6);
		}
		var titleOptions = CanvasUtils.depthClone(options);
		var labelOptions = CanvasUtils.depthClone(options);
		var valueOptions = CanvasUtils.depthClone(options);
		titleOptions.textPointList = [{
			text: titleInfo.text,
			x: point.x + itemX,
			y: point.y - len * options.itemSpace - itemY
		}];
		titleOptions.maxTextWidth = 0;
		labelOptions.maxTextWidth = 0;
		labelOptions.textPointList = [];
		valueOptions.textPointList = [];
		titleOptions.fillStyle = titleInfo.color;
		labelOptions.fillStyle = labelInfo.labelColor;
		valueOptions.fillStyle = labelInfo.valueColor;

		titleOptions.fontWeight = titleInfo.fontWeight || options.fontWeight;
		labelOptions.fontWeight = labelInfo.labelFontWeight || options.fontWeight;
		valueOptions.fontWeight = labelInfo.valueFontWeight || options.fontWeight;

		titleOptions.fontSize = titleInfo.fontSize || options.fontSize;
		labelOptions.fontSize = labelInfo.fontSize || options.fontSize;
		valueOptions.fontSize = labelInfo.fontSize || options.fontSize;
		if (labelOptions.font) {
			this.ctx.font = labelOptions.font || 'normal 12px Microsoft YaHei';
		} else {
			this.ctx.font = (labelOptions.fontWeight || 'normal') + ' ' + ((labelOptions.fontSize || 12) + 'px ') + 'Microsoft YaHei';
		}
		valueOptions.maxTextWidth = this.ctx.measureText("这是六个汉字").width;
		labelInfo.list.map(function (item, index) {
			var maxWidth = this.ctx.measureText(item.label).width + 5;
			if (index === 0) {
				labelOptions.textPointList.push({
					text: item.label,
					x: point.x + itemX,
					y: point.y - itemY
				});
				valueOptions.textPointList.push({
					type: 'box_value',
					dx: 0,
					dy: options.fontSize / 5,
					text: item.value,
					x: point.x + itemX + maxWidth,
					y: point.y - itemY
				});
			} else {
				labelOptions.textPointList.push({
					text: item.label,
					x: point.x + itemX,
					y: point.y - index * options.itemSpace - itemY
				});
				valueOptions.textPointList.push({
					type: 'box_value',
					dx: 0,
					dy: options.fontSize / 5,
					text: item.value,
					x: point.x + itemX + maxWidth,
					y: point.y - index * options.itemSpace - itemY
				});
			}
		}.bind(this))
		this.drawText(titleOptions);
		this.drawText(labelOptions);
		this.drawText(valueOptions);
	},
	// 底部时间
	drawVirtualTime: function (opts, boxInfo) {
		var options = CanvasUtils.depthClone(opts);
		var point = boxInfo.pointList[0];
		var itemX;
		var itemY;
		var dl = options.rulerPosition === 'right' ? 1 : -1;
		if (options.rulerPosition === 'right') {
			itemX = 0;
			itemY = options.itemSpace / 2
		} else {
			itemX = (boxInfo.boxWidth) * dl;
			itemY = options.itemSpace / 8
		}
		var timeInfo = options.timeInfo;
		options.maxTextWidth = 0;
		options.fillStyle = timeInfo.color;
		options.fontSize = timeInfo.fontSize || options.fontSize;
		options.fontWeight = timeInfo.fontWeight || options.fontWeight;
		options.textPointList = [{
			text: timeInfo.text,
			x: point.x + itemX,
			y: point.y + itemY
		}];
		this.drawText(options);
	},
	// 虚拟水尺的内部的框框
	drawVirtualBox: function (opts) {
		var virtualBoxInfo = {};
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = opts.virtualLineWidth;
		var startPoint = options.boxStartPoint;
		options.boxWidth = options.fixedWidth - opts.ruler.maxVirtualLineLength - opts.ruler.maxVirtualLineWidth - 2 * options.blankSpace;
		options.boxHeight = options.itemSpace * (4 / 3 + options.labelInfo.list.length);
		// 分别得到四个顶点 itemSpace
		var pointList = this.drawSkewRect(options, startPoint);
		// 绘制四个定点的线条
		this.drawItemPointLine(options, pointList);
		virtualBoxInfo.boxWidth = options.boxWidth;
		virtualBoxInfo.pointList = pointList;
		return virtualBoxInfo;
	},
	// 绘制四个定点的线条
	drawItemPointLine: function (opts, pointList) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 2 * options.virtualLineWidth;
		var startP;
		var endP;
		var point;
		for (var i = 0; i < 4; i++) {
			point = pointList[i];
			options.pointList = [];
			if (i === 0 && options.rulerPosition === 'right' || i === 3 && options.rulerPosition === 'left') {
				startP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, options.rotate - 90, -1);
				options.pointList.push(startP);
				options.pointList.push(point);
				endP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 0, -1);
				options.pointList.push(endP);
			}
			if (i === 1 && options.rulerPosition === 'right' || i === 0 && options.rulerPosition === 'left') {
				startP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 90 + options.rotate, -1);
				options.pointList.push(startP);
				options.pointList.push(point);
				endP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 0, -1);
				options.pointList.push(endP);
			}
			if (i === 2 && options.rulerPosition === 'right' || i === 1 && options.rulerPosition === 'left') {
				startP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 180, -1);
				options.pointList.push(startP);
				options.pointList.push(point);
				endP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 90 + options.rotate, -1);
				options.pointList.push(endP);
			}
			if (i === 3 && options.rulerPosition === 'right' || i === 2 && options.rulerPosition === 'left') {
				startP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, options.rotate - 90, -1);
				options.pointList.push(startP);
				options.pointList.push(point);
				endP = CanvasUtils.getPositionByOptsL(point.x, point.y, options.itemPointLength, 180, -1);
				options.pointList.push(endP);
			}
			this.drawLine(options);
		}
	},
	// 绘制闸门线条
	drawCommonLineCover: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.pointList = [];
		opts.pointList.map(function (item, index) {
			this.dealOptionsData(options, index);
			if (CanvasUtils.dyTypeOf(item[0]) === 'array') {
				item.map(function (pointItem) {
					options.pointList = pointItem;
					this.drawLine(options);
					if (options.showLabelPop) {
						this.drawLineLabelPop(options);
					}
				}.bind(this))
			} else {
				options.pointList = item;
				this.drawLine(options);
				if (options.showLabelPop) {
					this.drawLineLabelPop(options);
				}
			}
		}.bind(this))
	},
	// 绘制指示箭头
	drawLineLabelArrow: function (opts, type) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 1;
		options.fill = true;
		options.fillStyle = opts.lineColor;
		options.pointList = [];
		var startP = {
			x: options.startP.x + options.startP.w / 2,
			y: options.startP.y
		};
		options.pointList.push(startP);
		if (type === 'down') {
			options.pointList.push({
				x: startP.x - options.paddingArrowNum,
				y: options.startP.y - options.paddingArrowNum
			});
			options.pointList.push({
				x: startP.x + options.paddingArrowNum,
				y: options.startP.y - options.paddingArrowNum
			});
		} else {
			options.pointList.push({
				x: startP.x - options.paddingArrowNum,
				y: options.startP.y + options.paddingArrowNum
			});
			options.pointList.push({
				x: startP.x + options.paddingArrowNum,
				y: options.startP.y + options.paddingArrowNum
			});
		}
		options.pointList.push(startP);
		this.drawLine(options);
	},
	// 确定气泡位置
	getLineLabelPopPosition: function (opts) {
		if (opts.startP.y - opts.paddingArrowNum - opts.labelPopHeight - this.opts.bgImageInfo.y > 0) {
			this.drawLineLabelArrow(opts, 'down');
			opts.startP.y = opts.startP.y - opts.paddingArrowNum - opts.labelPopHeight;
		} else {
			this.drawLineLabelArrow(opts, 'up');
			opts.startP.y = opts.startP.y + opts.paddingArrowNum;
		}
	},
	// 绘制label气泡框框
	drawLineLabelPop: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		var pointList = options.pointList;
		options.fill = true;
		options.lineColor = options.labelPopColor || options.lineColor;
		options.fillStyle = options.labelPopColor || options.color;
		if (options.font) {
			this.ctx.font = options.font || 'normal 12px Microsoft YaHei';
		} else {
			this.ctx.font = (options.fontWeight || 'normal') + ' ' + ((options.fontSize || 12) + 'px ') + 'Microsoft YaHei';
		}
		var w = this.ctx.measureText(options.labelName + (options.labelPopName ? (':' + options.labelPopName) : '')).width + options.paddingNum * 2;
		options.startP = {
			x: pointList[0].x + (pointList[1].x - pointList[0].x) * 3 / 5 - w / 2,
			y: pointList[0].y,
			w: w,
			h: options.labelPopHeight
		}
		this.getLineLabelPopPosition(options)
		options.fillRoundRect = true;
		this.drawRoundRect(options);
		options.fillStyle = options.labelPopTextColor;
		options.textPointList = [];
		options.textPointList.push({
			text: options.labelName + (options.labelPopName ? (':' + options.labelPopName) : ''),
			x: options.startP.x + options.paddingNum,
			y: options.startP.y + (options.labelPopHeight / 2)
		});
		this.drawText(options);
	},
	// 绘制圆角矩形
	drawRoundRect: function (opts) {
		this.ctx.beginPath();
		this.ctx.lineWidth = opts.lineWidth || 1;
		//相对于坐标系左上角 其左上角的x坐标、y坐标、矩形的宽度 矩形的高度
		if (opts.fillRoundRect) {
			CanvasUtils.roundRect(this.ctx, opts.startP.x, opts.startP.y, opts.startP.w, opts.startP.h, 5);
		} else {
			this.ctx.rect(opts.startP.x, opts.startP.y, opts.startP.w, opts.startP.h);
		}
		// 显示线条
		if (opts.stroke) {
			// 是不是绘制虚线
			if (opts.lineDashObj) {
				this.ctx.setLineDash([opts.lineDashObj.dashLen, opts.lineDashObj.intervalLen]);
			} else {
				this.ctx.setLineDash([]);
			}
			// 线条颜色
			this.ctx.strokeStyle = opts.lineColor || '#fff';
			this.ctx.stroke();
		}
		// 填充路径
		if (opts.fill) {
			// 进行绘图处理
			if (!opts.fillStyle) {
				this.ctx.fillStyle = 'none';
			} else {
				if (opts.fillStyle.indexOf('#') != -1) {
					this.ctx.fillStyle = opts.fillStyle;
				} else {
					this.ctx.fillStyle = "rgba(" + opts.fillStyle + "," + (opts.fillOpacity || 1) + ")";
				}
			}
			this.ctx.fill();
		}
		this.ctx.closePath();
	},
	// 绘制水域
	drawCommonPolygonCover: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.pointList = [];
		opts.pointList.map(function (item, index) {
			this.dealOptionsData(options, index);
			if (CanvasUtils.dyTypeOf(item[0]) === 'array') {
				item.map(function (pointItem) {
					options.pointList = pointItem;
					this.drawLine(options);
				}.bind(this))
			} else {
				options.pointList = item;
				this.drawLine(options);
			}
		}.bind(this))
	},
	// 绘制普通框框
	drawCommonRectCover: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.pointList = [];
		opts.pointList.map(function (item, index) {
			this.dealOptionsData(options, index);
			if (CanvasUtils.dyTypeOf(item[0]) === 'array') {
				item.map(function (pointItem) {
					options.pointList = pointItem;
					this.drawLine(options);
					if (options.showLabelPop) {
						this.drawRectLabelPop(options);
					}
				}.bind(this))
			} else {
				options.pointList = item;
				this.drawLine(options);
				if (options.showLabelPop) {
					this.drawRectLabelPop(options);
				}
			}
		}.bind(this))
	},
	// 绘制不规则矩形
	drawCommonIrregularRectCover: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		options.pointList = [];
		opts.pointList.map(function (item, index) {
			this.dealOptionsData(options, index);
			if (CanvasUtils.dyTypeOf(item[0]) === 'array') {
				item.map(function (pointItem) {
					options.pointList = pointItem;
					this.drawLine(options);
					if (options.showLabelPop) {
						this.drawRectLabelPop(options);
					}
				}.bind(this))
			} else {
				options.pointList = item;
				this.drawLine(options);
				if (options.showLabelPop) {
					this.drawRectLabelPop(options);
				}
			}
		}.bind(this))
	},
	// 绘制指示箭头
	drawRectLabelArrow: function (opts, type) {
		var options = CanvasUtils.depthClone(opts);
		options.lineWidth = 1;
		options.fill = true;
		options.fillStyle = opts.lineColor;
		options.pointList = [];
		var startP = options.startP;
		options.pointList.push(startP);
		if (type === 'right') {
			options.pointList.push({
				x: startP.x + options.paddingArrowNum,
				y: startP.y - options.paddingArrowNum
			});
			options.pointList.push({
				x: startP.x + options.paddingArrowNum,
				y: startP.y + options.paddingArrowNum
			});
		} else {
			options.pointList.push({
				x: startP.x - options.paddingArrowNum,
				y: startP.y - options.paddingArrowNum
			});
			options.pointList.push({
				x: startP.x - options.paddingArrowNum,
				y: startP.y + options.paddingArrowNum
			});
		}
		options.pointList.push(startP);
		this.drawLine(options);
	},
	// 确定气泡位置
	getRectLabelPopPosition: function (opts, w) {
		if (opts.pointList[1].x + this.opts.bgImageInfo.x + opts.paddingArrowNum + w > this.opts.width * this.opts.imageScale) {
			opts.startP.x = opts.pointList[0].x + (opts.pointList[3].x - opts.pointList[0].x) / 2;
			opts.startP.y = opts.pointList[0].y + (opts.pointList[3].y - opts.pointList[0].y) / 2;
			this.drawRectLabelArrow(opts, 'left');
		} else {
			opts.startP.x = opts.pointList[1].x + (opts.pointList[2].x - opts.pointList[1].x) / 2;
			opts.startP.y = opts.pointList[1].y + (opts.pointList[2].y - opts.pointList[1].y) / 2;
			this.drawRectLabelArrow(opts, 'right');
		}
	},
	// 绘制矩形信息
	drawRectLabelPop: function (opts) {
		var options = CanvasUtils.depthClone(opts);
		var pointList = options.pointList;
		options.fill = true;
		options.lineColor = options.labelPopColor || options.lineColor;
		options.fillStyle = options.labelPopColor || options.color;
		if (options.font) {
			this.ctx.font = options.font || 'normal 12px Microsoft YaHei';
		} else {
			this.ctx.font = (options.fontWeight || 'normal') + ' ' + ((options.fontSize || 12) + 'px ') + 'Microsoft YaHei';
		}
		var w = this.ctx.measureText(options.labelName + (options.labelPopName ? (':' + options.labelPopName) : '')).width + options.paddingNum * 2;
		options.startP = {
			x: pointList[0].x,
			y: pointList[0].y - options.labelPopHeight
		};
		if (pointList[0].x !== pointList[3].x || pointList[1].x !== pointList[2].x || pointList[0].y !== pointList[1].y || pointList[2].y !== pointList[3].y) {
			this.getRectLabelPopPosition(options, w);
			options.fillRoundRect = true;
			options.startP = {
				x: options.startP.x + options.paddingArrowNum,
				y: options.startP.y - options.labelPopHeight / 2,
				w: w,
				h: options.labelPopHeight
			};
		} else {
			options.fillRoundRect = false;
			options.startP.y = options.startP.y - options.lineWidth
			options.startP.w = w;
			options.startP.h = options.labelPopHeight;
		}
		this.drawRoundRect(options);
		options.fillStyle = options.labelPopTextColor;
		options.textPointList = [];
		options.textPointList.push({
			text: options.labelName + (options.labelPopName ? (':' + options.labelPopName) : ''),
			x: options.startP.x + options.paddingNum,
			y: options.startP.y + (options.labelPopHeight / 2)
		});
		this.drawText(options);
	},
	// 需要处理的数据
	shouldDealOptionsKeyList: ['lineWidth', 'lineColor', 'labelName', 'fillStyle', 'fillOpacity', 'labelPopName', 'labelPopColor', 'labelPopTextColor', 'showLabelPopList'],
	// 处理options数据
	dealOptionsData: function (opts, index) {
		this.shouldDealOptionsKeyList.map(function (item) {
			if (opts[item + 'List'] && opts[item + 'List'].length > 0) {
				opts[item] = opts[item + 'List'][index] || opts[item + 'List'][0];
			}
		})
	},
	// 画线条
	drawLine: function (opts, canTrans, type, tIndex) {
		tIndex = isNaN(tIndex) ? 1 : tIndex;
		this.ctx.beginPath();
		this.ctx.lineWidth = opts.lineWidth || 1;
		(opts.pointList || []).forEach(function (item, index) {
			if (index === 0) {
				this.ctx.moveTo(item.x, item.y);
			} else {
				this.ctx.lineTo(item.x, item.y);
			}
		}.bind(this));
		// 显示线条
		if (opts.stroke) {
			// 是不是绘制虚线
			if (opts.lineDashObj) {
				this.ctx.setLineDash([opts.lineDashObj.dashLen, opts.lineDashObj.intervalLen]);
			} else {
				this.ctx.setLineDash([]);
			}
			// 线条颜色
			this.ctx.strokeStyle = opts.lineColor || '#fff';
			this.ctx.stroke();
		}
		// 填充路径
		if (opts.fill) {
			// 进行绘图处理
			if (!opts.fillStyle) {
				this.ctx.fillStyle = 'none';
			} else {
				if (opts.fillStyle.indexOf('#') != -1) {
					this.ctx.fillStyle = opts.fillStyle;
				} else {
					this.ctx.fillStyle = "rgba(" + opts.fillStyle + "," + (opts.fillOpacity || 1) + ")";
				}
			}
			this.ctx.fill();
		}
		this.ctx.closePath();
		if (opts.canTransform && canTrans) {
			opts.transType = type;
			if (type.indexOf('Drag') !== -1) {
				sType = 'drag';
			} else {
				sType = 'scale';
			}
			if (!this.canTransformData[sType]) {
				this.canTransformData[sType] = {};
			}
			this.canTransformData[sType][opts.name + '_' + type + '_' + tIndex] = opts;
		}
	},
	// 获取文字的大小
	getFontSize: function (fontSize) {
		fontSize = fontSize || 12;
		if (this.opts.imageScale >= 1.6 && this.opts.imageScale < 2.4) {
			fontSize += 2;
		}
		if (this.opts.imageScale >= 2.4) {
			fontSize += 4;
		}
		return fontSize;
	},
	// 画文字
	drawText: function (opts) {
		if (opts.font) {
			this.ctx.font = opts.font || 'normal 12px Microsoft YaHei';
		} else {
			if (opts.fontSize && opts.fontSizeCanResize) {
				opts.fontSize = this.getFontSize(opts.fontSize);
			}
			this.ctx.font = (opts.fontWeight || 'normal') + ' ' + ((opts.fontSize || 12) + 'px ') + 'Microsoft YaHei';
		}
		this.ctx.textAlign = opts.textAlign || 'left';
		this.ctx.textBaseline = opts.textBaseline || 'middle';
		this.ctx.fillStyle = opts.fillStyle || '#fff';
		(opts.textPointList || []).forEach(function (item) {
			if (opts.textRotate) {
				this.ctx.save();
				if (item.type && item.type === 'box_value') {
					this.ctx.translate(item.x + item.dx, item.y + item.dy);
				} else {
					this.ctx.translate(item.x, item.y);
				}
				this.ctx.rotate(opts.textRotate * Math.PI / 180);
				if (opts.maxTextWidth) {
					this.ctx.fillText(item.text, 0, 0, opts.maxTextWidth);
				} else {
					this.ctx.fillText(item.text, 0, 0);
				}
				this.ctx.restore();
			} else {
				this.ctx.fillText(item.text, item.x, item.y);
			}
		}.bind(this));
	},
	// 处理返回的结果数据
	dealResultData: function (data, dealAttr) {
		if (!data || data.length === 0) return;
		// 水尺 矩形 水域 预警线
		var resultData = {
			rectInfo: {
				canDraw: false,
				config: {
					commonRect: {
						labelNameList: [],
						lineColorList: [],
						needCalcPointList: []
					}
				}
			},
			irregularRectInfo: {
				canDraw: false,
				config: {
					commonIrregularRect: {
						labelNameList: [],
						lineColorList: [],
						needCalcPointList: []
					}
				}
			},
			lineInfo: {
				canDraw: false,
				config: {
					commonLine: {
						labelNameList: [],
						lineColorList: [],
						polygonList: []
					}
				}
			},
			virtualRulerInfo: {
				canDraw: false,
				config: {
					commonVirtualRuler: {

					}
				}
			},
			polygonInfo: {
				canDraw: false,
				config: {
					commonPolygon: {
						labelNameList: [],
						lineColorList: [],
						polygonList: []
					}
				}
			},
			wrnRulerInfo: {
				canDraw: false,
				config: {
					commonWrnRuler: {
					}
				}
			}
		};
		if (!data[dealAttr || 'objects']) {
			this.changeOptsByResult(resultData); return;
		}
		if (CanvasUtils.dyTypeOf(data[dealAttr || 'objects']) === 'array') {
			data[dealAttr || 'objects'].map(function (item) {
				// 默认points 和 bbox 不同时存在
				if (item.bbox && item.bbox.length > 0) {
					if (CanvasUtils.dyTypeOf(item.label) === 'array') {
						var labelList = item.label;
						this.dealLabelData(resultData, data, item, item.bbox, labelList);
					} else {
						var labelList = [item.label];
						this.dealLabelData(resultData, data, item, [item.bbox], labelList);
					}
				}
				if (item.points && item.points.length > 0) {
					if (!resultData.polygonInfo.canDraw) {
						resultData.polygonInfo.canDraw = true;
					}
					resultData.polygonInfo.config.commonPolygon.polygonList.push(item.points);
				}
				if (item.wrnPoints && item.wrnPoints.length > 0) {
					if (!resultData.wrnRulerInfo.canDraw) {
						resultData.wrnRulerInfo.canDraw = true;
					}
					if (CanvasUtils.dyTypeOf(item.wrnPoints) === 'string') {
						resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(item.wrnPoints);
					} else {
						if (CanvasUtils.dyTypeOf(item.wrnPoints) === 'string') {
							resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(item.wrnPoints[0]);
						} else {
							resultData.wrnRulerInfo.config.commonWrnRuler = item.wrnPoints[0];
						}
					}
				}
			}.bind(this))
		} else {
			var item = data[dealAttr || 'objects'];
			// 默认points 和 bbox 不同时存在
			if (item.bbox && item.bbox.length > 0) {
				if (CanvasUtils.dyTypeOf(item.label) === 'array') {
					var labelList = item.label;
					this.dealLabelData(resultData, data, item, item.bbox, labelList);
				} else {
					var labelList = [item.label];
					this.dealLabelData(resultData, data, item, [item.bbox], labelList);
				}
			}
			if (item.points && item.points.length > 0) {
				if (!resultData.polygonInfo.canDraw) {
					resultData.polygonInfo.canDraw = true;
				}
				resultData.polygonInfo.config.commonPolygon.polygonList.push(item.points);
			}
			if (item.wrnPoints && item.wrnPoints.length > 0) {
				if (!resultData.wrnRulerInfo.canDraw) {
					resultData.wrnRulerInfo.canDraw = true;
				}
				if (CanvasUtils.dyTypeOf(item.wrnPoints) === 'string') {
					resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(item.wrnPoints);
				} else {
					if (CanvasUtils.dyTypeOf(item.wrnPoints) === 'array') {
						resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(item.wrnPoints[0]);
					} else {
						resultData.wrnRulerInfo.config.commonWrnRuler = item.wrnPoints;
					}
				}
			}
		}
		if (data.wrnPoints && data.wrnPoints.length > 0) {
			if (!resultData.wrnRulerInfo.canDraw) {
				resultData.wrnRulerInfo.canDraw = true;
			}
			if (CanvasUtils.dyTypeOf(data.wrnPoints) === 'string') {
				resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(data.wrnPoints);
			} else {
				if (CanvasUtils.dyTypeOf(data.wrnPoints) === 'array') {
					resultData.wrnRulerInfo.config.commonWrnRuler = JSON.parse(data.wrnPoints[0]);
				} else {
					resultData.wrnRulerInfo.config.commonWrnRuler = data.wrnPoints;
				}
			}
		}
		// 去除空对象
		CanvasUtils.clearEmptyObject(resultData);
		if (CanvasUtils.isEmptyObject(resultData)) return;
		this.changeOptsByResult(resultData);
	},
	// 把后台数据与需要的数据结合
	changeOptsByResult: function (data) {
		CanvasUtils.deepObjectMerge(this.opts.imageCoverConfig, data);
		this.restoreOpts = CanvasUtils.depthClone(this.opts);
	},
	// 获取每个label 对应的 绘制类型
	getCurrentDrawType: function (itemData, itemBbox, labelList, drawDataItem, index, label) {
		var resultObj = {
			typeName: drawDataItem.typeName,
			labelName: drawDataItem.labelNameList[index],
			label: label,
			pointList: []
		};
		if (drawDataItem.drawType) {
			resultObj.drawType = drawDataItem.drawType[index];
		}
		labelList.map(function (item, labelIndex) {
			var currentLabelList = item.split(',');
			var currentLabelIndex = currentLabelList.indexOf(label);
			if (currentLabelIndex !== -1) {
				var dealBbox = itemBbox[labelIndex];
				if (currentLabelList.length === 1) {
					resultObj.pointList = dealBbox;
				} else {
					resultObj.pointList = dealBbox[currentLabelIndex];
				}
				if (itemData.colorList) {
					resultObj.color = itemData.colorList[labelIndex];
				} else {
					resultObj.color = drawDataItem.colorInfo[label] ? drawDataItem.colorInfo[label] : drawDataItem.colorInfo.defaultColor;
				}
			}
		}.bind(this))
		return resultObj;
	},
	// 获取每个label 对应的 绘制类型集合
	getCurrentDrawTypeList: function (itemData, itemBbox, labelList) {
		var labelStr = labelList.join('&');
		var currentDrawDataInfo = [];
		project_config.drawDataList.map(function (item) {
			item.labelList.map(function (labelItem, index) {
				if (CanvasUtils.dyTypeOf(labelItem) === 'array') {
					labelItem.map(function (label) {
						if (labelStr.indexOf(label) !== -1) {
							currentDrawDataInfo.push(this.getCurrentDrawType(itemData, itemBbox, labelList, item, index, label));
						}
					}.bind(this))
				} else {
					if (labelStr.indexOf(labelItem) !== -1) {
						currentDrawDataInfo.push(this.getCurrentDrawType(itemData, itemBbox, labelList, item, index, labelItem));
					}
				}
			}.bind(this))
		}.bind(this))
		return currentDrawDataInfo;
	},
	// 根据结果	区分对应绘制类型
	dealLabelData: function (resultData, data, itemData, itemBbox, labelList) {
		var currentDrawDataInfo = this.getCurrentDrawTypeList(itemData, itemBbox, labelList);
		currentDrawDataInfo.map(function (item) {
			if (!resultData[item.typeName].canDraw) {
				resultData[item.typeName].canDraw = true;
			}
			var drawType = item.drawType || 'common' + CanvasUtils.firstWorldTransFn(item.typeName, 'upper').replace('Info', '');
			if (item.typeName === 'virtualRulerInfo') {
				resultData[item.typeName].config[item.drawType || drawType] = this.getVirtualRulerInfoFn(data, item);
			} else {
				if (item.typeName === 'rectInfo' || item.typeName === 'irregularRectInfo') {
					resultData[item.typeName].config[item.drawType || drawType].needCalcPointList.push(item.pointList);
				} else {
					resultData[item.typeName].config[item.drawType || drawType].polygonList.push(item.pointList);
				}
				resultData[item.typeName].config[item.drawType || drawType].labelNameList.push(item.labelName);
				if (item.color) {
					resultData[item.typeName].config[item.drawType || drawType].lineColorList.push(item.color);
				}
			}
		}.bind(this))
	},
	// 获取虚拟水尺信息
	getVirtualRulerInfoFn: function (data, itemData) {
		var resultObj = {
			type: 'fixed',
			needCalcPointList: [],
			detailBoxInfo: {
				titleInfo: {

				},
				timeInfo: {

				},
				labelInfo: {
					list: []
				}
			}
		};
		resultObj.detailBoxInfo.titleInfo.text = data.nm;
		resultObj.detailBoxInfo.timeInfo.text = data.tm || data.start_tm;
		resultObj.detailBoxInfo.labelInfo.list = this.getLabelList(data);
		resultObj.type = data.virtualType || 'fixed';

		resultObj.needCalcPointList = this.dealVirtualBbox(itemData.pointList);
		return resultObj;
	},
	// 处理水尺bbox数据
	dealVirtualBbox: function (data) {
		var resultData = [];
		(data || []).map(function (item, index) {
			if (CanvasUtils.dyTypeOf(item) === 'array') {
				resultData.push(this.getItemBbox(item, data));
			} else {
				if (index === 0) {
					resultData.push(this.dealItemBbox(data));
				}
			}
		}.bind(this))
		return resultData;
	},
	// 处理单个水尺bbox数据
	getItemBbox: function (data, list) {
		var resultData = [];
		data.map(function (item, index) {
			if (CanvasUtils.dyTypeOf(item) === 'array') {
				this.getItemBbox(item, data);
			} else {
				if (index === 0) {
					if (data.length > 2) {
						resultData.push(this.dealItemBbox(data));
					} else {
						resultData = data;
					}
				}
			}
		}.bind(this))
		return resultData;
	},
	// 整合数据
	dealItemBbox: function (data) {
		var resultList = [
			[data[0], data[1]],
			[data[2], data[3]]
		];
		return resultList;
	},
	// 处理水尺box展示内容
	getLabelList: function (data) {
		var resultList = [];
		project_config.virtualShowLabelData.map(function (item) {
			var flag = false;
			if (typeof data[item.field] === 'undefined') {
				item.field = CanvasUtils.upperWorldTransFn(item.field);
				if (typeof data[item.field] !== 'undefined') {
					flag = true;
				}
			} else {
				flag = true;
			}
			if (flag) {
				if (data[item.field] !== null) {
					var value = data[item.field];
					if (item.formaterFn && typeof item.formaterFn === 'function') {
						value = item.formaterFn(data[item.field], 2, item.unit);
					}
					var obj = {
						label: item.label,
						value: value
					};
					resultList.push(obj);
				}
			}
		}.bind(this))
		return resultList;
	}
}
module.exports = ImageCoverCanvas;