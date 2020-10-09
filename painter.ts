interface IPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface IStyle {
  background?: string;
  foreground?: string;
  borderColor?: string;
  borderWidth?: number;
  font?: string;
  padding?: number | IPadding;
  radius?: number;
  height?: number;
  width?: number;
}

interface IProcessedStyle {
  background: string;
  foreground: string;
  borderColor: string;
  borderWidth: number;
  font: string;
  padding: IPadding;
  radius: number;
  height: number | undefined;
  width: number | undefined;
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
  content: string;
  style?: IStyle;
  connectionStyle?: IConnectionStyle;
  image?: IImageContent;
  hotSpot?: IHotSpot;
  children?: INode[];
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

interface IImageContent {
  src: string;
  height: number;
  width: number;
  padding: IPadding | number;
}

interface IProcessedImageContent {
  src: string;
  height: number;
  width: number;
  padding: IPadding;
}

interface IRoot {
  globalStyle: IStyle;
  connectionStyle: IConnectionStyle;
  xPadding: number;
  yPadding: number;
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

class painter {
  NODE_X_PADDING: number;
  NODE_PADDING: number;
  hotSpots: IHotSpot[];

  constructor() {}

  connect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    style?: IConnectionStyle
  ) {
    const cvs = <HTMLCanvasElement>document.getElementById("c");
    const ctx = <CanvasRenderingContext2D>cvs.getContext("2d");
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + ((x2 - x1) * 2) / 3, y1, x1, y2, x2, y2);
    ctx.stroke();
  }

  drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    content: string,
    style: IProcessedStyle,
    image: IProcessedImageContent
  ): IDrawResult {
    const hotspots: IHotSpot[] = [];

    const splittedText = content.split("\n");
    ctx.beginPath();

    ctx.lineWidth = style.borderWidth;
    ctx.strokeStyle = style.borderColor;

    const drawInfo = this.calcRect(
      content,
      style.font,
      style.padding,
      style.height,
      style.width,
      style.borderWidth,
      image
    );

    ctx.fillStyle = style.background;
    this.roundedRect(
      ctx,
      x + style.borderWidth / 2,
      y + style.borderWidth / 2,
      drawInfo.width - style.borderWidth / 2,
      drawInfo.height - this.NODE_PADDING - style.borderWidth / 2,
      style.radius
    );

    ctx.fillStyle = style.foreground;
    for (let i = 0; i < splittedText.length; i++) {
      ctx.fillText(
        splittedText[i],
        x + style.padding.left + style.borderWidth,
        y +
          (i + 1) * drawInfo.textHeight +
          style.padding.top +
          style.borderWidth
      );
    }
    const currentY = y + splittedText.length * drawInfo.textHeight;
    const img = new Image(image.width, image.height);
    img.src = image.src;
    const imageX = x + image.padding.left;
    const imageY = currentY + image.padding.top + style.padding.bottom;
    img.onload = function () {
      ctx.drawImage(img, imageX, imageY, image.width, image.height);
    };
    hotspots.push({
      rect: {
        topLeftCorner: {
          x: imageX,
          y: imageY,
        },
        bottomRightCorner: {
          x: imageX + image.width,
          y: imageY + image.height,
        },
      },
      triggerType: "image",
      action: "bigImage",
      imgSrc: image.src,
    });
    const result: IDrawResult = {
      x: x,
      y: y,
      width: drawInfo.width,
      height: drawInfo.height,
      hotSpots: hotspots,
    };
    return result;
  }

  calcRect(
    content: string,
    font: string,
    padding: IPadding,
    height: number,
    width: number,
    borderWidth: number,
    image: IProcessedImageContent | undefined
  ): IDrawInfo {
    const splittedText = content.split("\n");
    const cvs = <HTMLCanvasElement>document.getElementById("c");
    const ctx = <CanvasRenderingContext2D>cvs.getContext("2d");
    ctx.font = font;
    const measure = ctx.measureText(content);
    let textWidth = 0;
    for (const content of splittedText) {
      const w = ctx.measureText(content).width;
      if (w > textWidth) {
        textWidth = w;
      }
    }

    let nodewidth = width;
    let nodeheight = height;
    const textHeight =
      (measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent) *
      1.5;

    if (!width) {
      nodewidth =
        textWidth +
        padding.left +
        padding.right +
        (image.src ? image.padding.left : 0) +
        (image.src ? image.padding.right : 0) +
        borderWidth * 2;
      if (image.width > nodewidth) {
        nodewidth = image.width;
      }
    }

    if (!height) {
      nodeheight =
        textHeight * splittedText.length +
        padding.top +
        padding.bottom +
        image.height +
        (image.src ? image.padding.top : 0) +
        (image.src ? image.padding.bottom : 0) +
        borderWidth * 2 +
        2;
    }

    const result: IDrawInfo = {
      width: nodewidth,
      height: nodeheight + this.NODE_PADDING,
      textHeight: textHeight,
    };
    return result;
  }

  buildTree(
    ctx: CanvasRenderingContext2D,
    node: INode,
    baseX: number | undefined,
    baseY: number | undefined,
    defaults: IProcessedStyle,
    defaultConnectionStyle: IConnectionStyle
  ): ITreeBuildResult {
    let hotSpots: IHotSpot[] = [];

    if (!baseX) {
      baseX = 50;
    }
    if (!baseY) {
      baseY = 10;
    }
    let connectionStyle = defaultConnectionStyle;
    connectionStyle = { ...defaultConnectionStyle, ...node.connectionStyle };

    let treeHeight = 0;

    let image: IImageContent = node.image;
    if (!node.image) {
      image = {
        width: 0,
        height: 0,
        src: "",
        padding: 10,
      };
    }
    if (!image.padding) {
      image.padding = 0;
    }
    if (typeof image.padding == "number") {
      image.padding = {
        top: image.padding,
        left: image.padding,
        right: image.padding,
        bottom: image.padding,
      };
    }

    const style = this.processInitialStyle(node.style, defaults);

    const thisNode = this.calcRect(
      node.content,
      style.font,
      <IPadding>style.padding,
      style.height,
      style.width,
      style.borderWidth,
      <IProcessedImageContent>image
    );
    const connectPoints = [];
    if (node.children) {
      let info: ITreeBuildResult;
      for (const childNode of node.children) {
        info = this.buildTree(
          ctx,
          childNode,
          baseX + thisNode.width + this.NODE_X_PADDING,
          treeHeight + baseY,
          defaults,
          defaultConnectionStyle
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
      ctx,
      baseX,
      baseY + treeHeight / 2,
      node.content,
      style,
      <IProcessedImageContent>image
    );
    hotSpots = [...hotSpots, ...drawResult.hotSpots];
    if (node.hotSpot) {
      hotSpots.push(<IHotSpot>{
        rect: {
          topLeftCorner: { x: drawResult.x, y: drawResult.y },
          bottomRightCorner: {
            x: drawResult.x + drawResult.width,
            y: drawResult.y + drawResult.height,
          },
        },
        triggerType: "node",
        ...node.hotSpot,
      });
    }
    return {
      treeHeight: treeHeight,
      selfHeight: thisNode.height,
      connectPoint:
        baseY + treeHeight / 2 + thisNode.height / 2 - this.NODE_PADDING / 2,
      hotspots: hotSpots,
    };
  }

  processInitialStyle(
    style: IStyle,
    defaults?: IProcessedStyle
  ): IProcessedStyle {
    let font: string = defaults ? defaults.font : "20px TimesNewRoman";
    let innerPadding: IPadding = defaults
      ? defaults.padding
      : {
          top: 5,
          left: 5,
          bottom: 5,
          right: 5,
        };
    let height: number | undefined;
    let width: number | undefined;
    let radius = defaults ? defaults.radius : 10;
    let borderColor = defaults ? defaults.borderColor : "black";
    let borderWidth = defaults ? defaults.borderWidth : 1;
    let background = defaults ? defaults.background : "white";
    let foreground = defaults ? defaults.foreground : "black";
    if (style) {
      if (style.font) {
        font = style.font;
      }
      if (style.background) {
        background = style.background;
      }
      if (style.foreground) {
        foreground = style.foreground;
      }
      if (typeof style.borderWidth != "undefined") {
        borderWidth = style.borderWidth;
      }
      if (style.borderColor) {
        borderColor = style.borderColor;
      }
      if (typeof style.radius != "undefined") {
        radius = style.radius;
      }
      if (typeof style.padding != "undefined") {
        if (typeof style.padding == "number") {
          innerPadding = {
            top: style.padding,
            left: style.padding,
            right: style.padding,
            bottom: style.padding,
          };
        }
      }
      height = style.height;
      width = style.width;
    }
    return {
      font,
      padding: <IPadding>innerPadding,
      height,
      width,
      radius,
      background,
      foreground,
      borderColor,
      borderWidth,
    };
  }

  roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: IRadiusObject | number = 5
  ) {
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadii: IRadiusObject = { tl: 0, tr: 0, br: 0, bl: 0 };
      radius = { ...defaultRadii, ...radius };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
  }

  inRect(pos: IPoint, rect: IRect) {
    if (pos.x >= rect.topLeftCorner.x && pos.x <= rect.bottomRightCorner.x) {
      if (pos.y >= rect.topLeftCorner.y && pos.y <= rect.bottomRightCorner.y) {
        return true;
      }
    }
    return false;
  }

  getCurrentHotSpot(point: IPoint): IHotSpot {
    for (const hotspot of this.hotSpots) {
      if (this.inRect(point, hotspot.rect)) {
        return hotspot;
      }
    }
    return undefined;
  }

  build(ctx: CanvasRenderingContext2D, root: IRoot) {
    const style = this.processInitialStyle(root.globalStyle);
    this.NODE_PADDING = root.yPadding;
    this.NODE_X_PADDING = root.xPadding;
    const result = this.buildTree(
      ctx,
      root.node,
      undefined,
      undefined,
      style,
      root.connectionStyle
    );
    this.hotSpots = result.hotspots;
    return result;
  }
}
