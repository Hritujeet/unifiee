export interface CategoryDefinition {
    key: string
    displayName: string
    aliases?: string[]
}

export const STANDARD_OFFERING_CATEGORIES: CategoryDefinition[] = [
    {
        key: "paper_cup",
        displayName: "Paper Cups & Tumblers",
        aliases: ["paper-cups", "seed-paper-cups", "paper_cup", "paper_cups"],
    },
    {
        key: "pizza_box",
        displayName: "Pizza Boxes & Corrugated",
        aliases: ["pizza_box", "pizza-box", "pizza_boxes"],
    },
    {
        key: "corrugated_box",
        displayName: "Shipping Cartons & Boxes",
        aliases: ["corrugated_box", "corrugated-boxes", "seed-corrugated-boxes", "corrugated_boxes"],
    },
    {
        key: "food_container",
        displayName: "Food Containers & Meal Trays",
        aliases: ["food_container", "food-boxes", "seed-food-boxes", "food_containers"],
    },
    {
        key: "pouch",
        displayName: "Pouches & Bags",
        aliases: ["pouch", "pouches", "flexible-packaging"],
    },
    {
        key: "paper_bag",
        displayName: "Paper Carry Bags",
        aliases: ["paper_bag", "paper-bags", "seed-paper-bags", "paper_bags"],
    },
    {
        key: "cutlery",
        displayName: "Cutlery & Wooden Ware",
        aliases: ["cutlery", "cutleries"],
    },
    {
        key: "stickers_labels",
        displayName: "Stickers & Labels",
        aliases: ["stickers_labels", "stickers-labels", "seed-stickers-labels", "labels-stickers"],
    },
    {
        key: "bowls",
        displayName: "Paper Bowls",
        aliases: ["bowls", "seed-bowls", "paper-bowls"],
    },
    {
        key: "others",
        displayName: "Other Packaging",
        aliases: ["others", "other", "custom"],
    },
]

const KEY_TO_DISPLAY_NAME: Record<string, string> = {}
const ALIAS_TO_CANONICAL: Record<string, string> = {}

for (const cat of STANDARD_OFFERING_CATEGORIES) {
    KEY_TO_DISPLAY_NAME[cat.key] = cat.displayName
    ALIAS_TO_CANONICAL[cat.key] = cat.key
    if (cat.aliases) {
        for (const alias of cat.aliases) {
            KEY_TO_DISPLAY_NAME[alias] = cat.displayName
            ALIAS_TO_CANONICAL[alias] = cat.key
        }
    }
}

/**
 * Normalizes any category string into its canonical key.
 */
export function normalizeCategoryKey(key: string): string {
    if (!key) return ""
    const lower = key.trim().toLowerCase()
    return ALIAS_TO_CANONICAL[lower] || lower
}

/**
 * Formats a category key into a human-friendly display label.
 */
export function formatCategoryDisplayName(key: string): string {
    if (!key) return ""
    const lower = key.trim().toLowerCase()
    if (KEY_TO_DISPLAY_NAME[lower]) {
        return KEY_TO_DISPLAY_NAME[lower]
    }

    // Fallback: strip seed- prefix and format snake_case or kebab-case
    const cleaned = lower.replace(/^seed[-_]/i, "").replace(/[-_]+/g, " ")
    return cleaned
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
}
