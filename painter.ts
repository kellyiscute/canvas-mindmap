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
  style: IStyle,
): IDrawResult {
  const splittedText = content.split("\n");
  const cvs = <HTMLCanvasElement> document.getElementById("c");
  const ctx = <CanvasRenderingContext2D> cvs.getContext("2d");
  ctx.beginPath();

  // Prepare Style

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#fff";

  let INNER_PADDING: IPadding = {
    top: 5,
    left: 5,
    bottom: 5,
    right: 5,
  };
  const font = style
    ? style.font ? style.font : "20px TimesNewRoman"
    : "20px TimesNewRoman";
  let radius = 0;
  let height;
  let width;

  if (style) {
    if (style.background) {
      ctx.fillStyle = style.background;
    }
    if (style.borderWidth) {
      ctx.lineWidth = style.borderWidth;
    }
    if (style.borderColor) {
      ctx.strokeStyle = style.borderColor;
    }
    if (style.padding) {
      INNER_PADDING = <IPadding> style.padding;
    }
    if (style.radius) {
      radius = style.radius;
    }
    height = style.height;
    width = style.width;
  }

  const drawInfo = calcRect(content, font, INNER_PADDING, height, width);

  roundedRect(
    ctx,
    x,
    y,
    drawInfo.width,
    drawInfo.height - NODE_PADDING,
    radius,
  );

  ctx.fillStyle = "#000";
  if (style) {
    if (style.foreground) {
      ctx.fillStyle = style.foreground;
    }
  }
  for (let i = 0; i < splittedText.length; i++) {
    ctx.fillText(
      splittedText[i],
      x + INNER_PADDING.left,
      y + (i + 1) * drawInfo.textHeight + INNER_PADDING.top,
    );
  }
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
): IDrawInfo {
  const splittedText = content.split("\n");
  const cvs = <HTMLCanvasElement> document.getElementById("c");
  const ctx = <CanvasRenderingContext2D> cvs.getContext("2d");
  if (font) {
    ctx.font = font;
  } else {
    ctx.font = "20px TimesNewRoman";
  }
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
    nodewidth = textWidth + padding.left + padding.right;
  }

  if (!height) {
    nodeheight = textHeight * splittedText.length +
      splittedText.length +
      padding.top +
      padding.bottom;
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
  let font: string | undefined;
  let INNER_PADDING: number | IPadding = {
    top: 5,
    left: 5,
    bottom: 5,
    right: 5,
  };
  let height: number | undefined;
  let width: number | undefined;
  if (node.style) {
    font = node.style.font;

    // convert number padding to padding object
    if (node.style.padding) {
      INNER_PADDING = node.style.padding;
      if (typeof node.style.padding == "number") {
        INNER_PADDING = {
          top: node.style.padding,
          left: node.style.padding,
          right: node.style.padding,
          bottom: node.style.padding,
        };
        node.style.padding = INNER_PADDING;
      }
    }
    height = node.style.height;
    width = node.style.width;
  }
  const thisNode = calcRect(
    node.content,
    font,
    <IPadding> INNER_PADDING,
    height,
    width,
  );
  const connectPoints = [];
  if (node.children) {
    let info;
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

  drawRect(baseX, baseY + treeHeight / 2, node.content, node.style);
  return {
    treeHeight: treeHeight,
    selfHeight: thisNode.height,
    connectPoint: baseY + treeHeight / 2 + thisNode.height / 2,
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
