import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {Eye, EyeOff} from "lucide-react";
import {useState} from "react";

const InputField = ({
                        name,
                        label,
                        placeholder,
                        type = "text",
                        register,
                        error,
                        validation,
                        disabled,
                        value,
                        withPasswordToggle, // <--- new optional prop
                    }: FormInputProps & { withPasswordToggle?: boolean }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password" && withPasswordToggle;

    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>

            <div className="relative">
                <Input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    id={name}
                    placeholder={placeholder}
                    disabled={disabled}
                    value={value}
                    className={cn(
                        "form-input",
                        {"opacity-50 cursor-not-allowed": disabled},
                        {"pr-10": isPassword} // space for eye icon
                    )}
                    {...register(name, validation)}
                />

                {isPassword && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                        onClick={() => setShowPassword(v => !v)}
                    >
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
                    </button>
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    );
};

export default InputField;
