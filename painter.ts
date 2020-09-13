const NODE_PADDING = 10;
const NODE_X_PADDING = 150;

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
}

interface ITreeBuildResult {
  treeHeight: number;
  selfHeight: number;
  connectPoint: number;
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

function connect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style?: IConnectionStyle,
) {
  const cvs = <HTMLCanvasElement> document.getElementById("c");
  const ctx = <CanvasRenderingContext2D> cvs.getContext("2d");
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1 + ((x2 - x1) * 2) / 3, y1, x1, y2, x2, y2);
  ctx.stroke();
}

function drawRect(
  x: number,
  y: number,
  content: string,
  style: IProcessedStyle,
  image: IProcessedImageContent,
): IDrawResult {
  const splittedText = content.split("\n");
  const cvs = <HTMLCanvasElement> document.getElementById("c");
  const ctx = <CanvasRenderingContext2D> cvs.getContext("2d");
  ctx.beginPath();

  ctx.lineWidth = style.borderWidth;
  ctx.strokeStyle = style.borderColor;

  const drawInfo = calcRect(
    content,
    style.font,
    style.padding,
    style.height,
    style.width,
    image,
  );

  ctx.fillStyle = style.background;
  roundedRect(
    ctx,
    x,
    y,
    drawInfo.width,
    drawInfo.height - NODE_PADDING,
    style.radius,
  );

  ctx.fillStyle = style.foreground;
  for (let i = 0; i < splittedText.length; i++) {
    ctx.fillText(
      splittedText[i],
      x + style.padding.left,
      y + (i + 1) * drawInfo.textHeight + style.padding.top,
    );
  }
  const currentY = y + splittedText.length * drawInfo.textHeight;
  const img = new Image(image.width, image.height);
  img.src = image.src;
  img.onload = function () {
    ctx.drawImage(
      img,
      x + image.padding.left,
      currentY + image.padding.top + style.padding.bottom,
      image.width,
      image.height,
    );
  };
  const result: IDrawResult = {
    x: x,
    y: y,
    width: drawInfo.width,
    height: drawInfo.height,
  };
  return result;
}

function calcRect(
  content: string,
  font: string,
  padding: IPadding,
  height: number,
  width: number,
  image: IProcessedImageContent | undefined,
): IDrawInfo {
  const splittedText = content.split("\n");
  const cvs = <HTMLCanvasElement> document.getElementById("c");
  const ctx = <CanvasRenderingContext2D> cvs.getContext("2d");
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
    nodewidth = textWidth + padding.left + padding.right + image.padding.left +
      image.padding.right;
    if (image.width > nodewidth) {
      nodewidth = image.width;
    }
  }

  if (!height) {
    nodeheight = textHeight * splittedText.length +
      splittedText.length +
      padding.top +
      padding.bottom +
      image.height +
      image.padding.top +
      image.padding.bottom;
  }

  const result: IDrawInfo = {
    width: nodewidth,
    height: nodeheight + NODE_PADDING,
    textHeight: textHeight,
  };
  return result;
}

function buildTree(
  node: INode,
  baseX: number | undefined,
  baseY: number | undefined,
) {
  if (!baseX) {
    baseX = 50;
  }
  if (!baseY) {
    baseY = 10;
  }
  let connectionStyle;
  if (!node.connectionStyle) {
    connectionStyle = { width: "1", color: "#1e1e1e" };
  } else {
    connectionStyle = node.connectionStyle;
  }

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

  const style = processInitialStyle(node.style);

  const thisNode = calcRect(
    node.content,
    style.font,
    <IPadding> style.padding,
    style.height,
    style.width,
    <IProcessedImageContent> image,
  );
  const connectPoints = [];
  if (node.children) {
    let info: ITreeBuildResult;
    for (const childNode of node.children) {
      info = buildTree(
        childNode,
        baseX + thisNode.width + NODE_X_PADDING,
        treeHeight + baseY,
      );
      treeHeight += info.treeHeight + info.selfHeight;
      connectPoints.push(info.connectPoint);
    }
    treeHeight -= info.selfHeight;
  }
  for (const point of connectPoints) {
    connect(
      baseX + thisNode.width,
      baseY + treeHeight / 2 + thisNode.height / 2,
      baseX + thisNode.width + NODE_X_PADDING - 1,
      point,
      connectionStyle,
    );
  }

  drawRect(
    baseX,
    baseY + treeHeight / 2,
    node.content,
    style,
    <IProcessedImageContent> image,
  );
  return {
    treeHeight: treeHeight,
    selfHeight: thisNode.height,
    connectPoint: baseY + treeHeight / 2 + thisNode.height / 2,
  };
}

function processInitialStyle(style: IStyle): IProcessedStyle {
  let font: string = "20px TimesNewRoman";
  let innerPadding: IPadding = {
    top: 5,
    left: 5,
    bottom: 5,
    right: 5,
  };
  let height: number | undefined;
  let width: number | undefined;
  let radius = 10;
  let borderColor = "black";
  let borderWidth = 1;
  let background = "white";
  let foreground = "black";
  if (style) {
    if (style.font) {
      font = style.font;
    }
    if (style.background) {
      background = style.background;
    }
    if (style.foreground) {
      background = style.foreground;
    }
    if (style.borderWidth) {
      borderWidth = style.borderWidth;
    }
    if (style.borderColor) {
      borderColor = style.borderColor;
    }
    if (style.radius) {
      radius = style.radius;
    }
    if (style.padding) {
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
    font: font,
    padding: <IPadding> innerPadding,
    height: height,
    width: width,
    radius: radius,
    background: background,
    foreground: foreground,
    borderColor: borderColor,
    borderWidth: borderWidth,
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: IRadiusObject | number = 5,
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
    y + height,
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
}
