export const seedBusinesses = [
    { key: "anjali", name: "Anjali Mehta", businessName: "Monsoon Bean Cafe", businessType: "cafe" as const, city: "Pune", state: "Maharashtra", role: "owner" as const, gstin: "27AABCM1234A1Z5", empty: false },
    { key: "rahul", name: "Rahul Nair", businessName: "Coastal Crust Bakery", businessType: "bakery" as const, city: "Kochi", state: "Kerala", role: "owner" as const, gstin: "32AABCC2345B1Z4", empty: false },
    { key: "neha", name: "Neha Kapoor", businessName: "Green Bowl Kitchen", businessType: "cloud_kitchen" as const, city: "Bengaluru", state: "Karnataka", role: "manager" as const, gstin: "29AABCG3456C1Z3", empty: false },
    { key: "vikram", name: "Vikram Shah", businessName: "Masala Junction", businessType: "restaurant" as const, city: "Ahmedabad", state: "Gujarat", role: "owner" as const, gstin: "24AABCM4567D1Z2", empty: false },
    { key: "sana", name: "Sana Khan", businessName: "Little Tiffin QSR", businessType: "qsr" as const, city: "Lucknow", state: "Uttar Pradesh", role: "manager" as const, gstin: "09AABCL5678E1Z1", empty: false },
    { key: "empty", name: "Arjun Rao", businessName: "Rao Coffee Roasters", businessType: "cafe" as const, city: "Hyderabad", state: "Telangana", role: "owner" as const, gstin: "36AABCR6789F1Z0", empty: true },
] as const
