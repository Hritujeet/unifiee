import { toast } from "sonner";
import { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Format field keys into readable English labels
 */
function formatFieldLabel(fieldName: string): string {
    return fieldName
        .replace(/([A-Z])/g, " $1")
        .replace(/[._]/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim();
}

/**
 * Recursively inspect react-hook-form errors and compile human-friendly messages
 */
export function extractFormErrors<T extends FieldValues>(errors: FieldErrors<T>): { field: string; message: string }[] {
    const list: { field: string; message: string }[] = [];

    const recurse = (errObj: Record<string, unknown> | null | undefined, currentPath = "") => {
        if (!errObj || typeof errObj !== "object") return;

        if (typeof errObj.message === "string" && errObj.message) {
            list.push({
                field: formatFieldLabel(currentPath || "Field"),
                message: errObj.message,
            });
            return;
        }

        if (Array.isArray(errObj)) {
            errObj.forEach((item, index) => {
                recurse(item, `${currentPath} #${index + 1}`);
            });
            return;
        }

        Object.keys(errObj).forEach((key) => {
            if (key === "ref" || key === "type") return;
            const nextPath = currentPath ? `${currentPath}.${key}` : key;
            recurse(errObj[key] as Record<string, unknown> | null | undefined, nextPath);
        });
    };

    recurse(errors);
    return list;
}

/**
 * Display an informative, bulleted toast for any form validation failures
 */
export function showValidationToast<T extends FieldValues>(
    errors: FieldErrors<T>,
    formTitle: string = "Registration"
) {
    const errorList = extractFormErrors(errors);
    if (errorList.length === 0) {
        toast.error("Form incomplete", {
            description: "Fill out all required fields.",
            duration: 5000,
        });
        return;
    }

    const count = errorList.length;
    const title = count === 1
        ? "1 field needs attention"
        : `${count} fields need attention`;

    // Take top 4 distinct error messages
    const distinctMessages: string[] = [];
    const seen = new Set<string>();

    for (const item of errorList) {
        const fullText = item.message.toLowerCase().includes(item.field.toLowerCase())
            ? item.message
            : `${item.field}: ${item.message}`;

        if (!seen.has(fullText)) {
            seen.add(fullText);
            distinctMessages.push(fullText);
        }
    }

    const preview = distinctMessages.slice(0, 4).map((msg) => `• ${msg}`).join("\n");
    const overflowCount = distinctMessages.length - 4;
    const footer = overflowCount > 0 ? `\n...and ${overflowCount} other field(s)` : "";

    toast.error(title, {
        description: `${preview}${footer}`,
        duration: 7000,
    });
}

/**
 * Toast when user attempts to submit without checking the Terms of Service
 */
export function showTermsRequiredToast() {
    toast.warning("Terms agreement required", {
        description: "Accept terms to continue.",
        duration: 6000,
    });
}

/**
 * Start a loading toast that will be replaced on completion
 */
export function showRegistrationLoadingToast(_roleName: string) {
    return toast.loading("Creating account...", {
        id: "onboarding-registration",
    });
}

/**
 * Success toast for registration
 */
export function showRegistrationSuccessToast(_roleName: string, _destination: string = "dashboard") {
    toast.success("Account registered", {
        id: "onboarding-registration",
        duration: 4000,
    });
}

/**
 * Error toast for registration failures
 */
export function showRegistrationErrorToast(_roleName: string, _errorMessage?: string) {
    toast.error("Couldn't register account", {
        id: "onboarding-registration",
        description: "Review your entries and try again.",
        duration: 8000,
    });
}
