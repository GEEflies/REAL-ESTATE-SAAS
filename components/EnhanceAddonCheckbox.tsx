import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhanceAddonCheckboxProps {
    id: string
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
}

export function EnhanceAddonCheckbox({
    id,
    label,
    description,
    icon: Icon,
    checked,
    onChange,
    disabled = false,
}: EnhanceAddonCheckboxProps) {
    return (
        <motion.div
            whileHover={!disabled ? { scale: 1.01 } : undefined}
            whileTap={!disabled ? { scale: 0.99 } : undefined}
        >
            <div
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    "relative group cursor-pointer flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                    checked
                        ? "bg-blue-50/50 border-blue-500 shadow-sm"
                        : "bg-white border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md",
                    disabled && "opacity-50 cursor-not-allowed grayscale"
                )}
            >
                {/* Checkbox visual indicator */}
                <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-md border-2 mt-0.5 flex items-center justify-center transition-colors",
                    checked ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300 group-hover:border-blue-400"
                )}>
                    {checked && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn(
                            "w-4 h-4",
                            checked ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
                        )} />
                        <span className={cn(
                            "font-semibold text-sm",
                            checked ? "text-blue-900" : "text-gray-700"
                        )}>
                            {label}
                        </span>
                    </div>
                    <p className={cn(
                        "text-xs leading-relaxed",
                        checked ? "text-blue-700/80" : "text-gray-500"
                    )}>
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
