import { HTMLAttributes, forwardRef } from "react";

interface _IconProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string | undefined;
  height?: number | string | undefined;
  size?: number | string | undefined;
  fontSize?: number | string | undefined;
  viewBox: string;
  svgStyle?: React.CSSProperties;
}

export interface IconProps extends Omit<_IconProps, "viewBox"> {}

function computeSvgProps(props: _IconProps) {
  const box = props.viewBox.split(" ");
  const widthHeightRatio = parseFloat(box[2]) / parseFloat(box[3]);
  return {
    xmlns: "http://www.w3.org/2000/svg",
    fill: props.color || "none",
    version: "1.1",
    width: `${widthHeightRatio}em`,
    height: "1em",
    viewBox: props.viewBox,
  };
}

const Icon = forwardRef<HTMLDivElement, _IconProps>((props, ref) => {
  const { size, style, svgStyle, ...rest } = props;
  return (
    <div
      style={{
        ...style,
        width: size ?? props.width,
        height: size ?? props.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: props.fontSize,
      }}
      {...rest}
      ref={ref}
    >
      <svg {...computeSvgProps(props)} style={svgStyle}>
        {props.children}
      </svg>
    </div>
  );
});
Icon.displayName = "Icon";

export default Icon;
