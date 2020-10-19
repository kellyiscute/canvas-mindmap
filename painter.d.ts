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
  expandButton: IExpandButton;
  font?: string;
  padding?: number | IPadding;
  radius?: number;
  height?: number;
  width?: number;
  hoverBorder: IHoverBorder;
  maxWidth: number;
}

interface IExpandButton {
  background: string;
  borderColor: string;
  borderWidth: number;
  length: number;
  radius: number;
  textColor: string;
  font: string;
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
  collapseChildren: boolean;
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
  width: number;
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
  triggerType: "image" | "link" | "node" | "custom" | "expandCollapse";
  action: "linkTo" | "draw" | "bigImage";
  linkType?: "url" | "editor";
  nodeId?: string;
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
