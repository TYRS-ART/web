const variants = {
  primary: "bg-black text-white hover:bg-green",
  secondary: "border-2 border-black text-black hover:bg-black hover:text-white",
  commit: "border-2 border-transparent bg-lime text-black hover:border-black",
  listen: "bg-green text-white",
  inverse: "bg-white text-black hover:bg-butter",
} as const;

const sizes = {
  lg: "min-h-[52px] px-6 text-base lg:min-h-16 lg:px-8 lg:text-xl",
  md: "min-h-12 px-5 text-[15px] lg:min-h-14 lg:px-7 lg:text-lg",
  sm: "min-h-10 px-4 text-sm lg:min-h-11 lg:px-[18px] lg:text-[15px]",
} as const;

/** Pill buttons: black (primary), outline (secondary), lime (tickets / sign-up). */
export function buttonClass(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "lg") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap no-underline transition-colors duration-150 cursor-pointer ${variants[variant]} ${sizes[size]}`;
}
