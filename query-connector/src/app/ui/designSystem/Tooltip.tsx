import React from "react";

export type TooltipWrapperProps = {
  className?: string;
} & JSX.IntrinsicElements["div"] &
  React.RefAttributes<HTMLDivElement>;

const DivForwardRef: React.ForwardRefRenderFunction<
  HTMLDivElement,
  TooltipWrapperProps
> = ({ className, children, ...tooltipProps }: TooltipWrapperProps, ref) => (
  <div ref={ref} className={className} {...tooltipProps}>
    {children}
  </div>
);
const TooltipWrapper = React.forwardRef(DivForwardRef);

export default TooltipWrapper;
