import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MoneyInputProps extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  value: number;
  onValueChange: (value: number) => void;
  currencySymbol?: string;
  placeholder?: string;
  className?: string;
}

export function MoneyInput({
  value,
  onValueChange,
  currencySymbol = "R$",
  className,
  placeholder,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-normal">
        {currencySymbol}
      </span>
      
      <NumericFormat
        {...props}
        value={value === 0 ? "" : value}
        onValueChange={(values) => {
          onValueChange(values.floatValue || 0);
        }}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale={true}
        allowNegative={false}
        customInput={Input}
        placeholder={placeholder}
        className={cn("pl-10 text-left", className)} 
      />
    </div>
  );
}