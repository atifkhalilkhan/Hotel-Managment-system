import { buttonClasses } from "./buttonStyles";

export default function Button({ variant, size, className, type = "button", children, ...props }) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}