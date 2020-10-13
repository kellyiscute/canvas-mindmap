var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var painter = /** @class */ (function () {
    function painter(ctx, root) {
        this.ctx = ctx;
        this.imageLoaded = false;
        this.scale = 1;
        this.hotSpots = [];
        this.hoverSpots = [];
        this.data = root;
        this.globalStyle = root.globalStyle;
        this.NODE_PADDING = root.yPadding;
        this.NODE_X_PADDING = root.xPadding;
        this.offsetX = 0;
        this.offsetY = 0;
        this.images = root.images;
        this.data.node = this.prepareNodeId(this.data.node);
        console.log(this.data.node);
    }
    painter.prototype.initImg = function (onLoaded) {
        var _this = this;
        var img;
        for (var _i = 0, _a = Object.keys(this.images); _i < _a.length; _i++) {
            var imgId = _a[_i];
            var imgRes = this.images[imgId];
            if (!imgRes.padding) {
                imgRes.padding = 0;
            }
            if (typeof imgRes.padding == "number") {
                imgRes.padding = {
                    top: imgRes.padding,
                    left: imgRes.padding,
                    right: imgRes.padding,
                    bottom: imgRes.padding
                };
            }
            img = new Image(imgRes.width, imgRes.height);
            img.src = imgRes.src;
            imgRes.ImageObject = img;
            img.onload = function () {
                _this.imageLoaded = true;
                onLoaded();
            };
        }
    };
    painter.prototype.connect = function (x1, y1, x2, y2, style) {
        this.ctx.strokeStyle = style.color;
        this.ctx.lineWidth = style.width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.bezierCurveTo(x1 + ((x2 - x1) * 2) / 5, y1, x1 + 50, y2, x2, y2);
        this.ctx.stroke();
    };
    painter.prototype.drawRect = function (x, y, content, style, image, hover) {
        var hotspots = [];
        var splittedText = content.split("\n");
        this.ctx.beginPath();
        this.ctx.lineWidth = style.borderWidth;
        this.ctx.strokeStyle = style.colors.border;
        var drawInfo = this.calcRect(content, style, image);
        this.ctx.fillStyle = style.colors.background;
        this.roundedRect(x + style.borderWidth / 2, y + style.borderWidth / 2, drawInfo.width - style.borderWidth / 2, drawInfo.height - this.NODE_PADDING - style.borderWidth / 2, style.radius);
        if (hover) {
            this.ctx.strokeStyle = this.globalStyle.hoverBorder.color;
            this.ctx.lineWidth = this.globalStyle.hoverBorder.width;
            this.roundedRect(x - this.globalStyle.hoverBorder.width / 2, y - this.globalStyle.hoverBorder.width / 2, drawInfo.width +
                style.borderWidth / 2 +
                this.globalStyle.hoverBorder.width, drawInfo.height +
                style.borderWidth / 2 -
                this.NODE_PADDING +
                this.globalStyle.hoverBorder.width, style.radius +
                this.globalStyle.hoverBorder.width +
                style.borderWidth / 2, false);
        }
        this.ctx.fillStyle = style.colors.textColor;
        var padding = style.padding;
        for (var i = 0; i < splittedText.length; i++) {
            this.ctx.fillText(splittedText[i], x + padding.left + style.borderWidth, y + (i + 1) * drawInfo.textHeight + padding.top + style.borderWidth);
        }
        var currentY = y + splittedText.length * drawInfo.textHeight;
        if (image) {
            var imageX = x + image.padding.left;
            var imageY = currentY + image.padding.top + padding.bottom;
            this.ctx.drawImage(image.ImageObject, imageX, imageY, image.width, image.height);
            hotspots.push({
                rect: this.getRealRect({ x: imageX, y: imageY }, image.width, image.height),
                triggerType: "image",
                action: "bigImage",
                imgSrc: image.src
            });
        }
        var result = {
            x: x,
            y: y,
            width: drawInfo.width,
            height: drawInfo.height,
            hotSpots: hotspots
        };
        return result;
    };
    painter.prototype.calcRect = function (content, style, image) {
        var splittedText = content.split("\n");
        this.ctx.font = style.font;
        var measure = this.ctx.measureText(content);
        var textWidth = 0;
        for (var _i = 0, splittedText_1 = splittedText; _i < splittedText_1.length; _i++) {
            var content_1 = splittedText_1[_i];
            var w = this.ctx.measureText(content_1).width;
            if (w > textWidth) {
                textWidth = w;
            }
        }
        var nodewidth = style.width;
        var nodeheight = style.height;
        var textHeight = (measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent) *
            1.5;
        var padding = style.padding;
        if (!style.width) {
            nodewidth = style.borderWidth * 2;
            var textSpace = textWidth + padding.left + padding.right;
            var imageSpace = (image ? image.padding.left : 0) +
                (image ? image.padding.right : 0) +
                (image ? image.width : 0);
            if (imageSpace > textSpace) {
                nodewidth += imageSpace;
            }
            else {
                nodewidth += textSpace;
            }
        }
        if (!style.height) {
            nodeheight =
                textHeight * splittedText.length +
                    padding.top +
                    padding.bottom +
                    (image ? image.height : 0) +
                    (image ? image.padding.top : 0) +
                    (image ? image.padding.bottom : 0) +
                    style.borderWidth * 2 +
                    2;
        }
        var result = {
            width: nodewidth,
            height: nodeheight + this.NODE_PADDING,
            textHeight: textHeight
        };
        return result;
    };
    painter.prototype.getRealRect = function (_a, width, height) {
        var x = _a.x, y = _a.y;
        var result = {
            topLeftCorner: { x: x * this.scale, y: y * this.scale },
            bottomRightCorner: {
                x: x * this.scale + width * this.scale,
                y: y * this.scale + height * this.scale
            }
        };
        console.log(result);
        return result;
    };
    painter.prototype.buildTree = function (node, baseX, baseY, level, hoverEffectNodeId) {
        var hotSpots = [];
        if (typeof level == "undefined") {
            level = 0;
        }
        var currentColorLevel = this.globalStyle.predefinedColors.length > level
            ? this.globalStyle.predefinedColors[level]
            : this.globalStyle.defaultColor;
        if (!baseX) {
            baseX = 50;
        }
        if (!baseY) {
            baseY = 10;
        }
        var connectionStyle = this.globalStyle.defaultColor.childConnectionColor;
        connectionStyle = __assign(__assign({}, currentColorLevel.childConnectionColor), node.connectionStyle);
        var treeHeight = 0;
        var image = this.images[node.image];
        if (image) {
            if (typeof image.padding == "number") {
                image.padding = {
                    top: image.padding,
                    left: image.padding,
                    right: image.padding,
                    bottom: image.padding
                };
            }
        }
        var style = this.processInitialStyle(node.style, this.globalStyle);
        style.colors = currentColorLevel;
        var thisNode = this.calcRect(node.content, style, image);
        var connectPoints = [];
        if (node.children) {
            var info = void 0;
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var childNode = _a[_i];
                info = this.buildTree(childNode, baseX + thisNode.width + this.NODE_X_PADDING, treeHeight + baseY, level + 1, hoverEffectNodeId);
                treeHeight += info.treeHeight + info.selfHeight;
                connectPoints.push(info.connectPoint);
                hotSpots = __spreadArrays(hotSpots, info.hotspots);
            }
            treeHeight -= info.selfHeight;
        }
        // Draw connections to children nodes
        for (var _b = 0, connectPoints_1 = connectPoints; _b < connectPoints_1.length; _b++) {
            var point = connectPoints_1[_b];
            this.connect(baseX + thisNode.width, baseY + treeHeight / 2 + thisNode.height / 2 - this.NODE_PADDING / 2, baseX + thisNode.width + this.NODE_X_PADDING - 1, point, connectionStyle);
        }
        // Draw parent node last to cover the head of the connections
        var drawResult = this.drawRect(baseX, baseY + treeHeight / 2, node.content, style, image, node.nodeId == hoverEffectNodeId);
        console.log({ currentId: node.nodeId, targetId: hoverEffectNodeId });
        hotSpots = __spreadArrays(hotSpots, drawResult.hotSpots);
        var rect = this.getRealRect({ x: drawResult.x, y: drawResult.y }, drawResult.width + style.borderWidth / 2, drawResult.height - this.NODE_PADDING + style.borderWidth);
        if (node.hotSpot) {
            hotSpots.push(__assign({ rect: rect, triggerType: "node", nodeContent: node.content }, node.hotSpot));
        }
        this.hoverSpots.push({ rect: rect, nodeId: node.nodeId });
        return {
            treeHeight: treeHeight,
            selfHeight: thisNode.height,
            connectPoint: baseY + treeHeight / 2 + thisNode.height / 2 - this.NODE_PADDING / 2,
            hotspots: hotSpots
        };
    };
    painter.prototype.processInitialStyle = function (style, defaults) {
        var font = defaults ? defaults.font : "20px TimesNewRoman";
        var innerPadding = defaults.padding;
        var height;
        var width;
        var radius = defaults ? defaults.radius : 10;
        var colors = defaults.defaultColor;
        var borderWidth = defaults.borderWidth;
        if (style) {
            if (style.font) {
                font = style.font;
            }
            if (typeof style.radius != "undefined") {
                radius = style.radius;
            }
            height = style.height;
            width = style.width;
            if (typeof style.borderWidth != "undefined") {
                borderWidth = style.borderWidth;
            }
            if (style.padding) {
                innerPadding = style.padding;
            }
        }
        if (typeof innerPadding == "number") {
            innerPadding = {
                top: innerPadding,
                left: innerPadding,
                right: innerPadding,
                bottom: innerPadding
            };
        }
        return {
            font: font,
            padding: innerPadding,
            borderWidth: borderWidth,
            height: height,
            width: width,
            radius: radius,
            colors: colors
        };
    };
    painter.prototype.roundedRect = function (x, y, width, height, radius, fill) {
        if (radius === void 0) { radius = 5; }
        if (typeof radius === "number") {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }
        else {
            var defaultRadii = { tl: 0, tr: 0, br: 0, bl: 0 };
            radius = __assign(__assign({}, defaultRadii), radius);
        }
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius.tl, y);
        this.ctx.lineTo(x + width - radius.tr, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.ctx.lineTo(x + width, y + height - radius.br);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.ctx.lineTo(x + radius.bl, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.ctx.lineTo(x, y + radius.tl);
        this.ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        this.ctx.closePath();
        if (fill)
            this.ctx.fill();
        this.ctx.stroke();
    };
    painter.prototype.inRect = function (pos, rect) {
        if (pos.x >= rect.topLeftCorner.x && pos.x <= rect.bottomRightCorner.x) {
            if (pos.y >= rect.topLeftCorner.y && pos.y <= rect.bottomRightCorner.y) {
                return true;
            }
        }
        return false;
    };
    painter.prototype.getCurrentHoverSpot = function (point) {
        for (var _i = 0, _a = this.hoverSpots; _i < _a.length; _i++) {
            var hoverspot = _a[_i];
            if (this.inRect(point, hoverspot.rect)) {
                return hoverspot;
            }
        }
    };
    painter.prototype.useHoverEffect = function (nodeId) {
        this.wipe();
        this.build(this.scale, this.offsetX, this.offsetY, nodeId);
    };
    painter.prototype.wipe = function () {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    };
    painter.prototype.getCurrentHotSpot = function (point) {
        for (var _i = 0, _a = this.hotSpots; _i < _a.length; _i++) {
            var hotspot = _a[_i];
            if (this.inRect(point, hotspot.rect)) {
                return hotspot;
            }
        }
        return undefined;
    };
    painter.prototype.prepareNodeId = function (node, levelHeader) {
        if (!levelHeader) {
            levelHeader = "0";
        }
        node.nodeId = levelHeader;
        if (node.children) {
            for (var i = 0; i < node.children.length; i++) {
                this.prepareNodeId(node.children[i], node.nodeId + "-" + i);
            }
        }
        return node;
    };
    painter.prototype.build = function (scale, xOffset, yOffset, hoverNodeId) {
        if (typeof xOffset == "undefined") {
            xOffset = this.offsetX;
        }
        if (typeof yOffset == "undefined") {
            yOffset = this.offsetY;
        }
        this.scale = scale;
        var result = this.buildTree(this.data.node, 50 + xOffset, 50 + yOffset, undefined, hoverNodeId);
        this.offsetX = xOffset;
        this.offsetY = yOffset;
        this.hotSpots = result.hotspots;
        return result;
    };
    return painter;
}());
