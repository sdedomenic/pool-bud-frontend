
type LogoProps = {
  className?: string
  size?: "default" | "small"
}

export default function Logo({ className = "", size = "default" }: LogoProps) {
  const classes = ["brand-logo"]
  if (size === "small") classes.push("brand-logo--small")
  if (className) classes.push(className)

  return (
    <span className={classes.join(" ")}>
      <img
        className="brand-logo__img"
        src="/pool-bud-logo.png"
        alt="The Pool Bud"
      />
    </span>
  )
}
