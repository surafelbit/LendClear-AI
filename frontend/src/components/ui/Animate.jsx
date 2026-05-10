import { useInView } from "../../hooks/useInView";

/**
 * Animate — wraps children in a div that animates into view once.
 *
 * Props:
 *   variant  — 'fadeUp' | 'fadeDown' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale' | 'none'
 *   delay    — animation-delay in ms (default 0)
 *   duration — animation-duration in ms (default 500)
 *   className — extra classes on the wrapper div
 *   as       — element tag to render (default 'div')
 *   threshold — IntersectionObserver threshold (default 0.12)
 *
 * Usage:
 *   <Animate variant="fadeUp" delay={100}>
 *     <MyCard />
 *   </Animate>
 *
 *   // Staggered children:
 *   {items.map((item, i) => (
 *     <Animate key={item.id} variant="fadeUp" delay={i * 80}>
 *       <Row item={item} />
 *     </Animate>
 *   ))}
 */

const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, transform: "translateY(24px)" },
    visible: { opacity: 1, transform: "translateY(0px)" },
  },
  fadeDown: {
    hidden: { opacity: 0, transform: "translateY(-24px)" },
    visible: { opacity: 1, transform: "translateY(0px)" },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, transform: "translateX(-32px)" },
    visible: { opacity: 1, transform: "translateX(0px)" },
  },
  slideRight: {
    hidden: { opacity: 0, transform: "translateX(32px)" },
    visible: { opacity: 1, transform: "translateX(0px)" },
  },
  scale: {
    hidden: { opacity: 0, transform: "scale(0.92)" },
    visible: { opacity: 1, transform: "scale(1)" },
  },
  none: {
    hidden: {},
    visible: {},
  },
};

export function Animate({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 500,
  className = "",
  as: Tag = "div",
  threshold = 0.12,
}) {
  const [ref, visible] = useInView(threshold);
  const v = VARIANTS[variant] ?? VARIANTS.fadeUp;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...(visible ? v.visible : v.hidden),
        transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * AnimateGroup — animates a list of children with automatic stagger.
 *
 * Props:
 *   stagger  — delay between each child in ms (default 80)
 *   variant  — same as Animate
 *   children — array of React elements
 *
 * Usage:
 *   <AnimateGroup stagger={100} variant="fadeUp">
 *     <Card />
 *     <Card />
 *     <Card />
 *   </AnimateGroup>
 */
export function AnimateGroup({
  children,
  stagger = 80,
  variant = "fadeUp",
  duration = 500,
  className = "",
}) {
  const kids = Array.isArray(children) ? children : [children];
  return (
    <>
      {kids.map((child, i) => (
        <Animate
          key={i}
          variant={variant}
          delay={i * stagger}
          duration={duration}
          className={className}
        >
          {child}
        </Animate>
      ))}
    </>
  );
}
