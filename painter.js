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
        this.linkCount = 0;
        // prepare node data
        this.prepareNode(this.data.node);
    }
    painter.prototype.prepareNode = function (node) {
        var style = this.processInitialStyle(node.style, this.globalStyle);
        node.style = style;
        this.ctx.font = style.font;
        node.content = this.wrapText(node.content, style);
        node.textMeasure = this.getTextMeasure(node.content);
        if (node.link) {
            this.linkCount += 1;
            node.link.title = this.wrapText(node.link.title, style);
            node.link.textMeasure = this.getTextMeasure(node.link.title);
            node.link.nodeId = "link-" + this.linkCount;
        }
        if (node.title) {
            node.title = this.wrapText(node.title, style);
            node.titleMeasure = this.getTextMeasure(node.title);
        }
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                this.prepareNode(child);
            }
        }
    };
    painter.prototype.getTextMeasure = function (text) {
        var splittedText = text.split("\n");
        var measure = this.ctx.measureText(splittedText[0]);
        var textMeasure = { width: 0, textHeight: 0, totalHeight: 0 };
        for (var _i = 0, splittedText_1 = splittedText; _i < splittedText_1.length; _i++) {
            var content = splittedText_1[_i];
            var w = this.ctx.measureText(content).width;
            if (w > textMeasure.width) {
                textMeasure.width = w;
            }
        }
        var textHeight = (measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent) *
            1.5;
        textMeasure.textHeight = textHeight;
        textMeasure.totalHeight = textHeight * splittedText.length;
        return textMeasure;
    };
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
            img = new Image();
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
    painter.prototype.drawRect = function (x, y, drawInfo, node, hoverNodeId) {
        var hotspots = [];
        this.ctx.beginPath();
        this.ctx.lineWidth = node.style.borderWidth;
        var padding = node.style.padding;
        var currentY = y;
        // draw rect
        this.ctx.strokeStyle = node.style.colors.border;
        if (!node.title) {
            this.ctx.fillStyle = node.style.colors.titleBackground;
        }
        else {
            this.ctx.fillStyle = node.style.colors.background;
        }
        this.roundedRect(x + node.style.borderWidth / 2, y + node.style.borderWidth / 2, drawInfo.width - node.style.borderWidth / 2, drawInfo.height - this.NODE_PADDING - node.style.borderWidth / 2, node.style.radius);
        if (node.title) {
            this.ctx.fillStyle = node.style.colors.titleBackground;
            // fill title rect
            this.roundedRect(x + node.style.borderWidth / 2, y + node.style.borderWidth / 2, drawInfo.width, node.titleMeasure.totalHeight +
                node.style.borderWidth +
                padding.bottom +
                padding.top, { tl: node.style.radius, tr: node.style.radius, bl: 0, br: 0 }, true, false);
            this.ctx.fillStyle = node.style.colors.textColor;
            // draw title
            this.printText(node.title, node.titleMeasure, node.style, x, currentY);
            currentY += padding.top + padding.bottom + node.titleMeasure.totalHeight;
            // redraw border
            this.roundedRect(x + node.style.borderWidth / 2, y + node.style.borderWidth / 2, drawInfo.width - node.style.borderWidth / 2, drawInfo.height - this.NODE_PADDING - node.style.borderWidth / 2, node.style.radius, false);
        }
        // draw content
        this.ctx.fillStyle = node.style.colors.textColor;
        this.printText(node.content, node.textMeasure, node.style, x, currentY);
        currentY += node.textMeasure.totalHeight + padding.bottom + padding.top;
        // draw image
        if (node.image) {
            var image = this.images[node.image];
            var imagePadding = image
                ? image.padding
                : this.globalStyle.padding;
            var imageX = x + imagePadding.left;
            var imageY = currentY + imagePadding.top;
            this.ctx.drawImage(image.ImageObject, imageX, imageY, image.width, image.height);
            hotspots.push({
                rect: this.getRealRect({ x: imageX, y: imageY }, image.width, image.height),
                triggerType: "image",
                action: "bigImage",
                imgSrc: image.src
            });
            currentY += image.height + imagePadding.top + imagePadding.bottom;
        }
        // draw link
        if (node.link) {
            this.ctx.fillStyle = node.style.colors.linkColor;
            currentY -= padding.bottom;
            if (hoverNodeId == node.link.nodeId) {
            }
            this.printText(node.link.title, node.link.textMeasure, node.style, x, currentY);
            if (hoverNodeId == node.link.nodeId) {
                this.ctx.fillRect(x + padding.left + node.style.borderWidth, currentY + node.link.textMeasure.totalHeight + padding.top + 4, node.link.textMeasure.width, 2);
            }
            var spot = {
                rect: this.getRealRect({
                    x: x + padding.left,
                    y: currentY + padding.top + 2
                }, node.link.textMeasure.width, node.link.textMeasure.totalHeight),
                nodeId: node.link.nodeId,
                triggerType: "link",
                action: "linkTo",
                link: node.link.src
            };
            this.hoverSpots.push(spot);
            hotspots.push(spot);
        }
        // draw hover effect
        if (typeof hoverNodeId != "undefined" &&
            (hoverNodeId == node.nodeId ||
                (node.link ? hoverNodeId == node.link.nodeId : false))) {
            this.ctx.strokeStyle = this.globalStyle.hoverBorder.color;
            this.ctx.lineWidth = this.globalStyle.hoverBorder.width;
            this.roundedRect(x - this.globalStyle.hoverBorder.width / 2, y - this.globalStyle.hoverBorder.width / 2, drawInfo.width +
                node.style.borderWidth / 2 +
                this.globalStyle.hoverBorder.width, drawInfo.height +
                node.style.borderWidth / 2 -
                this.NODE_PADDING +
                this.globalStyle.hoverBorder.width, node.style.radius +
                this.globalStyle.hoverBorder.width +
                node.style.borderWidth / 2, false);
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
    painter.prototype.printText = function (text, textMeasure, style, x, y) {
        var padding = style.padding;
        var splittedText = text.split("\n");
        for (var i = 0; i < splittedText.length; i++) {
            this.ctx.fillText(splittedText[i], x + padding.left + style.borderWidth, y + (i + 1) * textMeasure.textHeight + padding.top);
        }
    };
    painter.prototype.calcRect = function (node) {
        this.ctx.font = node.style.font;
        var nodewidth = node.style.width;
        var nodeheight = node.style.height;
        var image = this.images[node.image];
        var imagePadding = image ? image.padding : null;
        var padding = node.style.padding;
        if (!node.style.width) {
            nodewidth = node.style.borderWidth * 2;
            var textSpace = node.textMeasure.width + padding.left + padding.right;
            var imageSpace = (image ? imagePadding.left : 0) +
                (image ? imagePadding.right : 0) +
                (image ? image.width : 0);
            var linkSpace = 0;
            if (node.link) {
                linkSpace = node.link.textMeasure.width + padding.left + padding.right;
            }
            var titleSpace = 0;
            if (node.title) {
                titleSpace = node.titleMeasure.width + padding.left + padding.right;
            }
            var l = [textSpace, imageSpace, linkSpace, titleSpace];
            var max = 0;
            for (var _i = 0, l_1 = l; _i < l_1.length; _i++) {
                var num = l_1[_i];
                if (num > max) {
                    max = num;
                }
            }
            nodewidth += max;
        }
        if (!node.style.height) {
            nodeheight =
                node.textMeasure.totalHeight +
                    padding.top +
                    padding.bottom +
                    (image ? image.height : 0) +
                    (image ? imagePadding.top : 0) +
                    (image ? imagePadding.bottom : 0) +
                    node.style.borderWidth * 2 +
                    2;
            if (node.title) {
                nodeheight +=
                    node.titleMeasure.totalHeight + padding.top + padding.bottom;
            }
            if (node.link) {
                nodeheight += node.link.textMeasure.totalHeight + padding.top;
            }
        }
        var result = {
            width: nodewidth,
            height: nodeheight + this.NODE_PADDING,
            textHeight: node.textMeasure.textHeight
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
        var style = node.style;
        style.colors = currentColorLevel;
        this.ctx.font = style.font;
        var thisNode = this.calcRect(node);
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
        var drawResult = this.drawRect(baseX, baseY + treeHeight / 2, thisNode, node, hoverEffectNodeId);
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
    painter.prototype.wrapText = function (text, style) {
        var splittedOriginal = text.split("\n");
        var result = [];
        var maxWidth = this.globalStyle.maxWidth -
            style.padding.left -
            style.padding.right;
        for (var _i = 0, splittedOriginal_1 = splittedOriginal; _i < splittedOriginal_1.length; _i++) {
            var line = splittedOriginal_1[_i];
            var lineWidth = this.ctx.measureText(line).width;
            if (lineWidth > maxWidth) {
                // construct lines
                var wrappedLines = [];
                var currentLine = "";
                for (var i = 0; i < line.length; i++) {
                    if (this.ctx.measureText(currentLine + line[i]).width < maxWidth) {
                        currentLine += line[i];
                    }
                    else {
                        wrappedLines.push(currentLine);
                        currentLine = line[i];
                    }
                }
                if (currentLine != "") {
                    wrappedLines.push(currentLine);
                }
                result.push(wrappedLines.join("\n"));
            }
            else {
                result.push(line);
            }
        }
        return result.join("\n");
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
    painter.prototype.roundedRect = function (x, y, width, height, radius, fill, border) {
        if (radius === void 0) { radius = 5; }
        if (fill === void 0) { fill = true; }
        if (border === void 0) { border = true; }
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
        if (border)
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
        var spots = [];
        for (var _i = 0, _a = this.hoverSpots; _i < _a.length; _i++) {
            var hoverspot = _a[_i];
            if (this.inRect(point, hoverspot.rect)) {
                spots.push(hoverspot);
            }
        }
        if (spots.length > 1) {
            for (var _b = 0, spots_1 = spots; _b < spots_1.length; _b++) {
                var hoverspot = spots_1[_b];
                if (hoverspot.nodeId.indexOf("link") != -1) {
                    return hoverspot;
                }
            }
        }
        else {
            return spots.length > 0 ? spots[0] : null;
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
        var spots = [];
        for (var _i = 0, _a = this.hotSpots; _i < _a.length; _i++) {
            var hotspot = _a[_i];
            if (this.inRect(point, hotspot.rect)) {
                spots.push(hotspot);
            }
        }
        if (spots.length > 1) {
            for (var _b = 0, spots_2 = spots; _b < spots_2.length; _b++) {
                var hotspot = spots_2[_b];
                if (hotspot.triggerType == "link") {
                    return hotspot;
                }
            }
        }
        else {
            return spots.length > 0 ? spots[0] : null;
        }
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
        this.hotSpots = [];
        this.hoverSpots = [];
        var result = this.buildTree(this.data.node, 50 + xOffset, 50 + yOffset, undefined, hoverNodeId);
        this.offsetX = xOffset;
        this.offsetY = yOffset;
        this.hotSpots = result.hotspots;
        return result;
    };
    return painter;
}());
