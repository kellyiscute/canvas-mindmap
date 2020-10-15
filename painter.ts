interface IPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface IStyle {
  colors: IColorDefinition;
  font?: string;
  borderWidth: number;
  padding?: number | IPadding;
  radius?: number;
  height?: number;
  width?: number;
}

interface IGlobalStyle {
  predefinedColors: IColorDefinition[];
  defaultColor: IColorDefinition;
  borderWidth: number;
  font?: string;
  padding?: number | IPadding;
  radius?: number;
  height?: number;
  width?: number;
  hoverBorder: IHoverBorder;
  maxWidth: number;
}

interface IHoverBorder {
  width: number;
  color: string;
}

interface IConnectionStyle {
  color?: string;
  width: number;
}

interface IRadiusObject {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

interface INode {
  nodeId: string;
  content: string;
  textMeasure: ITextMeasure;
  link?: ILink;
  style?: IStyle;
  connectionStyle?: IConnectionStyle;
  image?: number;
  hotSpot?: IHotSpot;
  title: string;
  titleMeasure: ITextMeasure;
  children?: INode[];
}

interface ITextMeasure {
  width: number;
  totalHeight: number;
  textHeight: number;
}

interface ILink {
  src: string;
  title: string;
  textMeasure: ITextMeasure;
  nodeId: string;
}

interface IDrawInfo {
  width: number;
  height: number;
  textHeight: number;
}

interface IDrawResult {
  x: number;
  y: number;
  width: number;
  height: number;
  hotSpots: IHotSpot[];
}

interface ITreeBuildResult {
  treeHeight: number;
  selfHeight: number;
  connectPoint: number;
  hotspots: IHotSpot[];
}

interface IImageRes {
  src: string;
  padding: IPadding | number;
  width: number;
  height: number;
  ImageObject?: any;
}

interface IProcessedImageRes {
  src: string;
  padding: IPadding;
  width: number;
  height: number;
  ImageObject: HTMLImageElement;
}

interface IImages {
  [id: string]: IImageRes;
}

interface IRoot {
  globalStyle: IGlobalStyle;
  xPadding: number;
  yPadding: number;
  images: IImages;
  node: INode;
}

interface IPoint {
  x: number;
  y: number;
}

interface IRect {
  topLeftCorner: IPoint;
  bottomRightCorner: IPoint;
}

interface IHotSpot {
  rect: IRect;
  triggerType: "image" | "link" | "node" | "custom";
  action: "linkTo" | "draw" | "bigImage";
  linkType?: "url" | "editor";
  link?: string;
  imgSrc?: string;
}

interface IHoverSpot {
  nodeId: string;
  rect: IRect;
}

interface IColorDefinition {
  border: string;
  background: string;
  titleBackground: string;
  childConnectionColor: IConnectionStyle;
  textColor: string;
  linkColor: string;
}

class painter {
  NODE_X_PADDING: number;
  NODE_PADDING: number;
  hotSpots: IHotSpot[];
  hoverSpots: IHoverSpot[];
  scale: number;
  images: IImages;
  globalStyle: IGlobalStyle;
  data: IRoot;
  imageLoaded: boolean;
  ctx: CanvasRenderingContext2D;
  offsetX: number;
  offsetY: number;
  linkCount: number;

  constructor(ctx: CanvasRenderingContext2D, root: IRoot) {
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

  prepareNode(node: INode) {
    const style = this.processInitialStyle(node.style, this.globalStyle);
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
      for (const child of node.children) {
        this.prepareNode(child);
      }
    }
  }

  getTextMeasure(text: string): ITextMeasure {
    const splittedText = text.split("\n");
    const measure = this.ctx.measureText(splittedText[0]);
    const textMeasure = { width: 0, textHeight: 0, totalHeight: 0 };
    for (const content of splittedText) {
      const w = this.ctx.measureText(content).width;
      if (w > textMeasure.width) {
        textMeasure.width = w;
      }
    }
    const textHeight =
      (measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent) *
      1.5;
    textMeasure.textHeight = textHeight;
    textMeasure.totalHeight = textHeight * splittedText.length;

    return textMeasure;
  }

  initImg(onLoaded: CallableFunction) {
    let img: HTMLImageElement;
    for (const imgId of Object.keys(this.images)) {
      const imgRes = this.images[imgId];
      if (!imgRes.padding) {
        imgRes.padding = 0;
      }
      if (typeof imgRes.padding == "number") {
        imgRes.padding = {
          top: imgRes.padding,
          left: imgRes.padding,
          right: imgRes.padding,
          bottom: imgRes.padding,
        };
      }
      img = new Image();
      img.src = imgRes.src;
      imgRes.ImageObject = img;
      img.onload = () => {
        this.imageLoaded = true;
        onLoaded();
      };
    }
  }

  connect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style?: IConnectionStyle
  ) {
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.bezierCurveTo(x1 + ((x2 - x1) * 2) / 5, y1, x1 + 50, y2, x2, y2);
    this.ctx.stroke();
  }

  drawRect(
    x: number,
    y: number,
    drawInfo: IDrawInfo,
    node: INode,
    hoverNodeId: string
  ): IDrawResult {
    const hotspots: IHotSpot[] = [];

    this.ctx.beginPath();
    this.ctx.lineWidth = node.style.borderWidth;

    const padding = <IPadding>node.style.padding;
    let currentY = y;
    // draw rect
    this.ctx.strokeStyle = node.style.colors.border;

    if (!node.title) {
      this.ctx.fillStyle = node.style.colors.titleBackground;
    } else {
      this.ctx.fillStyle = node.style.colors.background;
    }
    this.roundedRect(
      x + node.style.borderWidth / 2,
      y + node.style.borderWidth / 2,
      drawInfo.width - node.style.borderWidth / 2,
      drawInfo.height - this.NODE_PADDING - node.style.borderWidth / 2,
      node.style.radius
    );
    if (node.title) {
      this.ctx.fillStyle = node.style.colors.titleBackground;
      // fill title rect
      this.roundedRect(
        x + node.style.borderWidth / 2,
        y + node.style.borderWidth / 2,
        drawInfo.width,
        node.titleMeasure.totalHeight +
          node.style.borderWidth +
          padding.bottom +
          padding.top,
        { tl: node.style.radius, tr: node.style.radius, bl: 0, br: 0 },
        true,
        false
      );
      this.ctx.fillStyle = node.style.colors.textColor;
      // draw title
      this.printText(node.title, node.titleMeasure, node.style, x, currentY);
      currentY += padding.top + padding.bottom + node.titleMeasure.totalHeight;
      // redraw border
      this.roundedRect(
        x + node.style.borderWidth / 2,
        y + node.style.borderWidth / 2,
        drawInfo.width - node.style.borderWidth / 2,
        drawInfo.height - this.NODE_PADDING - node.style.borderWidth / 2,
        node.style.radius,
        false
      );
    }
    // draw content
    this.ctx.fillStyle = node.style.colors.textColor;
    this.printText(node.content, node.textMeasure, node.style, x, currentY);
    currentY += node.textMeasure.totalHeight + padding.bottom + padding.top;
    // draw image
    if (node.image) {
      const image = this.images[node.image];
      const imagePadding = image
        ? <IPadding>image.padding
        : <IPadding>this.globalStyle.padding;
      const imageX = x + imagePadding.left;
      const imageY = currentY + imagePadding.top;
      this.ctx.drawImage(
        image.ImageObject,
        imageX,
        imageY,
        image.width,
        image.height
      );
      hotspots.push({
        rect: this.getRealRect(
          { x: imageX, y: imageY },
          image.width,
          image.height
        ),
        triggerType: "image",
        action: "bigImage",
        imgSrc: image.src,
      });
      currentY += image.height + imagePadding.top + imagePadding.bottom;
    }
    // draw link
    if (node.link) {
      this.ctx.fillStyle = node.style.colors.linkColor;
      currentY -= padding.bottom;
      if (hoverNodeId == node.link.nodeId) {
      }
      this.printText(
        node.link.title,
        node.link.textMeasure,
        node.style,
        x,
        currentY
      );
      if (hoverNodeId == node.link.nodeId) {
        this.ctx.fillRect(
          x + padding.left + node.style.borderWidth,
          currentY + node.link.textMeasure.totalHeight + padding.top + 4,
          node.link.textMeasure.width,
          2
        );
      }
      const spot = {
        rect: this.getRealRect(
          {
            x: x + padding.left,
            y: currentY + padding.top + 2,
          },
          node.link.textMeasure.width,
          node.link.textMeasure.totalHeight
        ),
        nodeId: node.link.nodeId,
        triggerType: "link",
        action: "linkTo",
        link: node.link.src,
      };
      this.hoverSpots.push(<IHoverSpot>spot);
      hotspots.push(<IHotSpot>spot);
    }
    // draw hover effect
    if (
      typeof hoverNodeId != "undefined" &&
      (hoverNodeId == node.nodeId ||
        (node.link ? hoverNodeId == node.link.nodeId : false))
    ) {
      this.ctx.strokeStyle = this.globalStyle.hoverBorder.color;
      this.ctx.lineWidth = this.globalStyle.hoverBorder.width;
      this.roundedRect(
        x - this.globalStyle.hoverBorder.width / 2,
        y - this.globalStyle.hoverBorder.width / 2,
        drawInfo.width +
          node.style.borderWidth / 2 +
          this.globalStyle.hoverBorder.width,
        drawInfo.height +
          node.style.borderWidth / 2 -
          this.NODE_PADDING +
          this.globalStyle.hoverBorder.width,
        node.style.radius +
          this.globalStyle.hoverBorder.width +
          node.style.borderWidth / 2,
        false
      );
    }

    const result: IDrawResult = {
      x: x,
      y: y,
      width: drawInfo.width,
      height: drawInfo.height,
      hotSpots: hotspots,
    };
    return result;
  }

  printText(
    text: string,
    textMeasure: ITextMeasure,
    style: IStyle,
    x: number,
    y: number
  ) {
    const padding = <IPadding>style.padding;
    const splittedText = text.split("\n");
    for (let i = 0; i < splittedText.length; i++) {
      this.ctx.fillText(
        splittedText[i],
        x + padding.left + style.borderWidth,
        y + (i + 1) * textMeasure.textHeight + padding.top
      );
    }
  }

  calcRect(node: INode): IDrawInfo {
    this.ctx.font = node.style.font;
    let nodewidth = node.style.width;
    let nodeheight = node.style.height;

    const image = this.images[node.image];
    const imagePadding = image ? <IPadding>image.padding : null;

    const padding = <IPadding>node.style.padding;
    if (!node.style.width) {
      nodewidth = node.style.borderWidth * 2;
      const textSpace = node.textMeasure.width + padding.left + padding.right;
      const imageSpace =
        (image ? imagePadding.left : 0) +
        (image ? imagePadding.right : 0) +
        (image ? image.width : 0);
      let linkSpace = 0;
      if (node.link) {
        linkSpace = node.link.textMeasure.width + padding.left + padding.right;
      }
      let titleSpace = 0;
      if (node.title) {
        titleSpace = node.titleMeasure.width + padding.left + padding.right;
      }
      const l: number[] = [textSpace, imageSpace, linkSpace, titleSpace];
      let max = 0;
      for (const num of l) {
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

    const result: IDrawInfo = {
      width: nodewidth,
      height: nodeheight + this.NODE_PADDING,
      textHeight: node.textMeasure.textHeight,
    };
    return result;
  }

  getRealRect({ x, y }: IPoint, width: number, height: number): IRect {
    const result = {
      topLeftCorner: { x: x * this.scale, y: y * this.scale },
      bottomRightCorner: {
        x: x * this.scale + width * this.scale,
        y: y * this.scale + height * this.scale,
      },
    };

    return result;
  }

  buildTree(
    node: INode,
    baseX: number | undefined,
    baseY: number | undefined,
    level?: number,
    hoverEffectNodeId?: string
  ): ITreeBuildResult {
    let hotSpots: IHotSpot[] = [];
    if (typeof level == "undefined") {
      level = 0;
    }

    const currentColorLevel: IColorDefinition =
      this.globalStyle.predefinedColors.length > level
        ? this.globalStyle.predefinedColors[level]
        : this.globalStyle.defaultColor;

    if (!baseX) {
      baseX = 50;
    }
    if (!baseY) {
      baseY = 10;
    }
    let connectionStyle = this.globalStyle.defaultColor.childConnectionColor;
    connectionStyle = {
      ...currentColorLevel.childConnectionColor,
      ...node.connectionStyle,
    };

    let treeHeight = 0;

    let image: IProcessedImageRes = <IProcessedImageRes>this.images[node.image];
    if (image) {
      if (typeof image.padding == "number") {
        image.padding = {
          top: image.padding,
          left: image.padding,
          right: image.padding,
          bottom: image.padding,
        };
      }
    }

    const style = node.style;
    style.colors = currentColorLevel;

    this.ctx.font = style.font;

    const thisNode = this.calcRect(node);
    const connectPoints = [];
    if (node.children) {
      let info: ITreeBuildResult;
      for (const childNode of node.children) {
        info = this.buildTree(
          childNode,
          baseX + thisNode.width + this.NODE_X_PADDING,
          treeHeight + baseY,
          level + 1,
          hoverEffectNodeId
        );
        treeHeight += info.treeHeight + info.selfHeight;
        connectPoints.push(info.connectPoint);
        hotSpots = [...hotSpots, ...info.hotspots];
      }
      treeHeight -= info.selfHeight;
    }
    // Draw connections to children nodes
    for (const point of connectPoints) {
      this.connect(
        baseX + thisNode.width,
        baseY + treeHeight / 2 + thisNode.height / 2 - this.NODE_PADDING / 2,
        baseX + thisNode.width + this.NODE_X_PADDING - 1,
        point,
        connectionStyle
      );
    }

    // Draw parent node last to cover the head of the connections
    const drawResult = this.drawRect(
      baseX,
      baseY + treeHeight / 2,
      thisNode,
      node,
      hoverEffectNodeId
    );

    hotSpots = [...hotSpots, ...drawResult.hotSpots];
    const rect = this.getRealRect(
      { x: drawResult.x, y: drawResult.y },
      drawResult.width + style.borderWidth / 2,
      drawResult.height - this.NODE_PADDING + style.borderWidth
    );
    if (node.hotSpot) {
      hotSpots.push(<IHotSpot>{
        rect,
        triggerType: "node",
        nodeContent: node.content,
        ...node.hotSpot,
      });
    }
    this.hoverSpots.push({ rect, nodeId: node.nodeId });
    return {
      treeHeight: treeHeight,
      selfHeight: thisNode.height,
      connectPoint:
        baseY + treeHeight / 2 + thisNode.height / 2 - this.NODE_PADDING / 2,
      hotspots: hotSpots,
    };
  }

  wrapText(text: string, style: IStyle): string {
    const splittedOriginal = text.split("\n");
    const result: string[] = [];
    const maxWidth =
      this.globalStyle.maxWidth -
      (<IPadding>style.padding).left -
      (<IPadding>style.padding).right;
    for (const line of splittedOriginal) {
      const lineWidth = this.ctx.measureText(line).width;

      if (lineWidth > maxWidth) {
        // construct lines
        const wrappedLines: string[] = [];
        let currentLine = "";
        for (let i = 0; i < line.length; i++) {
          if (this.ctx.measureText(currentLine + line[i]).width < maxWidth) {
            currentLine += line[i];
          } else {
            wrappedLines.push(currentLine);
            currentLine = line[i];
          }
        }
        if (currentLine != "") {
          wrappedLines.push(currentLine);
        }
        result.push(wrappedLines.join("\n"));
      } else {
        result.push(line);
      }
    }
    return result.join("\n");
  }

  processInitialStyle(style: IStyle, defaults?: IGlobalStyle): IStyle {
    let font: string = defaults ? defaults.font : "20px TimesNewRoman";
    let innerPadding: IPadding | number = defaults.padding;

    let height: number | undefined;
    let width: number | undefined;
    let radius = defaults ? defaults.radius : 10;
    let colors = defaults.defaultColor;
    let borderWidth = defaults.borderWidth;

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
      innerPadding = <IPadding>{
        top: innerPadding,
        left: innerPadding,
        right: innerPadding,
        bottom: innerPadding,
      };
    }
    return {
      font,
      padding: <IPadding>innerPadding,
      borderWidth,
      height,
      width,
      radius,
      colors,
    };
  }

  roundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: IRadiusObject | number = 5,
    fill: boolean = true,
    border: boolean = true
  ) {
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadii: IRadiusObject = { tl: 0, tr: 0, br: 0, bl: 0 };
      radius = { ...defaultRadii, ...radius };
    }

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius.tl, y);
    this.ctx.lineTo(x + width - radius.tr, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.ctx.lineTo(x + width, y + height - radius.br);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    this.ctx.lineTo(x + radius.bl, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.ctx.lineTo(x, y + radius.tl);
    this.ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    this.ctx.closePath();

    if (fill) this.ctx.fill();
    if (border) this.ctx.stroke();
  }

  inRect(pos: IPoint, rect: IRect) {
    if (pos.x >= rect.topLeftCorner.x && pos.x <= rect.bottomRightCorner.x) {
      if (pos.y >= rect.topLeftCorner.y && pos.y <= rect.bottomRightCorner.y) {
        return true;
      }
    }
    return false;
  }

  getCurrentHoverSpot(point: IPoint): IHoverSpot {
    const spots: IHoverSpot[] = [];
    for (const hoverspot of this.hoverSpots) {
      if (this.inRect(point, hoverspot.rect)) {
        spots.push(hoverspot);
      }
    }
    if (spots.length > 1) {
      for (const hoverspot of spots) {
        if (hoverspot.nodeId.indexOf("link") != -1) {
          return hoverspot;
        }
      }
    } else {
      return spots.length > 0 ? spots[0] : null;
    }
  }

  useHoverEffect(nodeId: string) {
    this.wipe();
    this.build(this.scale, this.offsetX, this.offsetY, nodeId);
  }

  wipe() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  getCurrentHotSpot(point: IPoint): IHotSpot {
    const spots: IHotSpot[] = [];
    for (const hotspot of this.hotSpots) {
      if (this.inRect(point, hotspot.rect)) {
        spots.push(hotspot);
      }
    }
    if (spots.length > 1) {
      for (const hotspot of spots) {
        if (hotspot.triggerType == "link") {
          return hotspot;
        }
      }
    } else {
      return spots.length > 0 ? spots[0] : null;
    }
  }

  prepareNodeId(node: INode, levelHeader?: string) {
    if (!levelHeader) {
      levelHeader = "0";
    }
    node.nodeId = levelHeader;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        this.prepareNodeId(node.children[i], node.nodeId + "-" + i);
      }
    }
    return node;
  }

  build(scale: number, xOffset: number, yOffset: number, hoverNodeId: string) {
    if (typeof xOffset == "undefined") {
      xOffset = this.offsetX;
    }
    if (typeof yOffset == "undefined") {
      yOffset = this.offsetY;
    }
    this.scale = scale;
    this.hotSpots = [];
    this.hoverSpots = [];
    const result = this.buildTree(
      this.data.node,
      50 + xOffset,
      50 + yOffset,
      undefined,
      hoverNodeId
    );
    this.offsetX = xOffset;
    this.offsetY = yOffset;
    this.hotSpots = result.hotspots;
    return result;
  }
}
