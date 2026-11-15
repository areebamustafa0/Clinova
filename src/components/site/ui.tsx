"use client";

import Link from "next/link";
import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { img } from "@/lib/brand";
import { IMAGE_META } from "@/lib/image-meta";
import { IconArrowUpRight, IconStar } from "./icons";

export const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------ buttons ---------------------------------- */
type Variant = "espresso" | "ivory" | "glass" | "outline";

const variants: Record<Variant, { wrap: string; circle: string }> = {
  espresso: { wrap: "bg-espresso text-cream hover:bg-cocoa dark:hover:bg-umber", circle: "bg-cream text-espresso" },
  ivory: { wrap: "bg-ivory text-cocoa hover:bg-ivory/85", circle: "bg-cocoa text-ivory" },
  glass: { wrap: "glass text-ivory hover:bg-ivory/25", circle: "bg-ivory text-cocoa" },
  outline: { wrap: "border border-line text-espresso hover:border-espresso/40 hover:bg-sand/60", circle: "bg-espresso text-cream" },
};

type ArrowButtonProps = { href?: string; variant?: Variant; small?: boolean; big?: boolean; className?: string; children: ReactNode; loading?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

/** The signature pill button: label + circular icon that swaps with an arrow on hover. `big` is the hero size. */
export function ArrowButton({ href, variant = "espresso", small, big, className, children, loading, ...rest }: ArrowButtonProps) {
  const v = variants[variant];
  const cls = clsx(
    "group/btn relative inline-flex items-center gap-3 rounded-full font-medium tracking-[-0.005em] transition-colors duration-500 ease-[var(--ease-editorial)] disabled:pointer-events-none disabled:opacity-60",
    v.wrap,
    small ? "py-1 pl-1 pr-4 text-[0.82rem]" : big ? "py-1.5 pl-1.5 pr-6 text-[1rem]" : "py-1.5 pl-1.5 pr-5 text-[0.9rem]",
    className,
  );
  const inner = (
    <>
      <span className={clsx("relative grid place-items-center overflow-hidden rounded-full", big ? "size-10" : "size-9", v.circle)}>
        <IconArrowUpRight size={small ? 14 : 15} className="transition-transform duration-500 ease-[var(--ease-editorial)] group-hover/btn:-translate-y-5 group-hover/btn:translate-x-5" />
        <IconArrowUpRight size={small ? 14 : 15} className="absolute -translate-x-5 translate-y-5 transition-transform duration-500 ease-[var(--ease-editorial)] group-hover/btn:translate-x-0 group-hover/btn:translate-y-0" />
      </span>
      <span>{loading ? "Sending…" : children}</span>
    </>
  );
  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    return external ? (
      <a href={href} className={cls}>{inner}</a>
    ) : (
      <Link href={href} className={cls}>{inner}</Link>
    );
  }
  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {inner}
    </button>
  );
}

/** Small outlined pill link ("View details"). */
export function PillLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx("inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[0.8rem] font-medium text-espresso transition-colors duration-300 hover:border-espresso hover:bg-espresso hover:text-cream", className)}>
      {children}
    </Link>
  );
}

/* ------------------------------ small bits -------------------------------- */
export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "onDark" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em]",
        tone === "light" ? "border-line bg-card/60 text-espresso/80" : "border-ivory/30 text-ivory/85",
      )}
    >
      <span className="size-1 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function StarRow({ count = 5, size = 13, className, label }: { count?: number; size?: number; className?: string; label?: boolean }) {
  return (
    <span className={clsx("flex gap-0.5", className)} {...(label ? { role: "img", "aria-label": `${count} out of 5 stars` } : { "aria-hidden": true })}>
      {Array.from({ length: count }).map((_, i) => (
        <IconStar key={i} size={size} />
      ))}
    </span>
  );
}

/* ------------------------------ motion ------------------------------------ */
export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -12% 0px" }} transition={{ duration: 1, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

export function RevealGroup({ children, className, stagger = 0.08, delay = 0 }: { children: ReactNode; className?: string; stagger?: number; delay?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }} variants={{ show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }}>
      {children}
    </motion.div>
  );
}

/** Headline whose words slide up out of a mask. "\n" starts a new line. */
export function SplitHeading({ text, id, className, as = "h2", delay = 0, immediate }: { text: string; id?: string; className?: string; as?: "h1" | "h2" | "h3"; delay?: number; immediate?: boolean }) {
  const Tag = motion[as];
  let n = 0;
  return (
    <Tag id={id} className={className} initial="hidden" {...(immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } })}>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi, arr) => {
            const index = n++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top">
                <motion.span className="inline-block will-change-transform" variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: 1.05, ease: EASE, delay: delay + 0.055 * index } } }}>
                  {word}
                </motion.span>
                {wi < arr.length - 1 ? " " : null}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/* ------------------------------- images ----------------------------------- */
export function SiteImg({ slot, src, className, alt = "", priority }: { slot?: string; src?: string; className?: string; alt?: string; priority?: boolean }) {
  const key = slot ?? src?.match(/\/images\/site\/([^/.]+)\.jpg/)?.[1];
  const blur = key ? IMAGE_META[key]?.blur : undefined;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src ?? img(slot ?? "")}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      style={blur ? { backgroundImage: `url("${blur}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      className={clsx("absolute inset-0 size-full object-cover", className)}
    />
  );
}

/**
 * Image frame with the reference's two effects: a clip-path "curtain" reveal when it scrolls into view
 * and a gentle vertical parallax (the image layer is taller than the frame by `strength`% each side).
 */
export function ParallaxImg({ slot, src, alt = "", className, imgClassName, strength = 8, reveal = true }: { slot?: string; src?: string; alt?: string; className?: string; imgClassName?: string; strength?: number; reveal?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <motion.div
      ref={ref}
      className={clsx("relative overflow-hidden", className)}
      initial={reveal ? { clipPath: "inset(18% 0% 0% 0%)", opacity: 0.4 } : false}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      <motion.div className="absolute inset-x-0" style={{ y: reduce ? 0 : y, top: `-${strength}%`, bottom: `-${strength}%` }}>
        <SiteImg slot={slot} src={src} alt={alt} className={imgClassName} />
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------ shared blocks ----------------------------- */
export function PageIntro({ eyebrow, title, text, children, className }: { eyebrow: string; title: string; text?: string; children?: ReactNode; className?: string }) {
  return (
    <section aria-labelledby="page-title" className={clsx("pb-16 pt-32 lg:pb-20 lg:pt-44", className)}>
      <div className="container-site flex flex-col items-center text-center">
        <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
        <SplitHeading id="page-title" as="h1" immediate className="text-headline mt-6 max-w-4xl" text={title} />
        {text && (
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-muted">{text}</p>
          </Reveal>
        )}
      </div>
      {children}
    </section>
  );
}

export function CtaPanel({ title = "Your skin,\nthoughtfully cared for", text = "Begin with a relaxed consultation. We'll listen, assess your skin and create a plan that feels right for you.", slot = "portrait-radiant" }: { title?: string; text?: string; slot?: string }) {
  return (
    <section aria-labelledby="cta-title" className="container-site pb-4 pt-8 lg:pt-12">
      <div className="relative grid overflow-hidden rounded-[var(--radius-panel)] bg-cocoa text-ivory md:grid-cols-[1.2fr_1fr]">
        <div className="relative flex flex-col justify-center px-6 py-16 md:px-12 md:py-24 lg:px-20">
          <Reveal><Eyebrow tone="onDark">Book your visit</Eyebrow></Reveal>
          <SplitHeading id="cta-title" className="text-headline mt-6" text={title} />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-ivory/75">{text}</p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
            <ArrowButton href="/contact#book" variant="ivory">Book a Consultation</ArrowButton>
            <ArrowButton href="/treatments" variant="glass">Our Treatments</ArrowButton>
          </Reveal>
        </div>
        <ParallaxImg slot={slot} reveal={false} className="aspect-[4/5] md:aspect-auto md:min-h-[36rem]" />
      </div>
    </section>
  );
}
