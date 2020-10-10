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
  image?: number;
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
  ImageObject: any;
}

interface IImages {
  [id: string]: IImageRes;
}

interface IRoot {
  globalStyle: IStyle;
  connectionStyle: IConnectionStyle;
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

class painter {
  NODE_X_PADDING: number;
  NODE_PADDING: number;
  hotSpots: IHotSpot[];
  scale: number;
  images: IImages;
  globalStyle: IProcessedStyle;
  data: IRoot;
  imageLoaded: boolean;

  constructor(root: IRoot) {
    this.imageLoaded = false;
    this.scale = 1;
    this.hotSpots = [];
    this.data = root;
    this.globalStyle = this.processInitialStyle(root.globalStyle);
    this.NODE_PADDING = root.yPadding;
    this.NODE_X_PADDING = root.xPadding;
    this.images = root.images;
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
      img = new Image(imgRes.width, imgRes.height);
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
    image: IProcessedImageRes
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
    if (image) {
      const imageX = x + image.padding.left;
      const imageY = currentY + image.padding.top + style.padding.bottom;
      ctx.drawImage(
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

  calcRect(
    content: string,
    font: string,
    padding: IPadding,
    height: number,
    width: number,
    borderWidth: number,
    image: IProcessedImageRes | undefined
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
      nodewidth = borderWidth * 2;
      const textSpace = textWidth + padding.left + padding.right;
      const imageSpace =
        (image ? image.padding.left : 0) +
        (image ? image.padding.right : 0) +
        (image ? image.width : 0);
      if (imageSpace > textSpace) {
        nodewidth += imageSpace;
      } else {
        nodewidth += textSpace;
      }
    }

    if (!height) {
      nodeheight =
        textHeight * splittedText.length +
        padding.top +
        padding.bottom +
        (image ? image.height : 0) +
        (image ? image.padding.top : 0) +
        (image ? image.padding.bottom : 0) +
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

  getRealRect({ x, y }: IPoint, width: number, height: number): IRect {
    return {
      topLeftCorner: { x: x * this.scale, y: y * this.scale },
      bottomRightCorner: {
        x: x * this.scale + width * this.scale,
        y: y * this.scale + height * this.scale,
      },
    };
  }

  buildTree(
    ctx: CanvasRenderingContext2D,
    node: INode,
    baseX: number | undefined,
    baseY: number | undefined
  ): ITreeBuildResult {
    let hotSpots: IHotSpot[] = [];

    if (!baseX) {
      baseX = 50;
    }
    if (!baseY) {
      baseY = 10;
    }
    let connectionStyle = this.data.connectionStyle;
    connectionStyle = { ...this.data.connectionStyle, ...node.connectionStyle };

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

    const style = this.processInitialStyle(node.style, this.globalStyle);

    const thisNode = this.calcRect(
      node.content,
      style.font,
      <IPadding>style.padding,
      style.height,
      style.width,
      style.borderWidth,
      image
    );
    const connectPoints = [];
    if (node.children) {
      let info: ITreeBuildResult;
      for (const childNode of node.children) {
        info = this.buildTree(
          ctx,
          childNode,
          baseX + thisNode.width + this.NODE_X_PADDING,
          treeHeight + baseY
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
      image
    );
    hotSpots = [...hotSpots, ...drawResult.hotSpots];
    if (node.hotSpot) {
      hotSpots.push(<IHotSpot>{
        rect: this.getRealRect(
          { x: drawResult.x, y: drawResult.y },
          drawResult.width,
          drawResult.height
        ),
        triggerType: "node",
        nodeContent: node.content,
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

  build(
    ctx: CanvasRenderingContext2D,
    scale: number,
    xOffset: number,
    yOffset: number
  ) {
    if (typeof xOffset == "undefined") {
      xOffset = 0;
    }
    if (typeof yOffset == "undefined") {
      yOffset = 0;
    }
    this.scale = scale;
    const result = this.buildTree(
      ctx,
      this.data.node,
      50 + xOffset,
      50 + yOffset
    );
    this.hotSpots = result.hotspots;
    return result;
  }
}
