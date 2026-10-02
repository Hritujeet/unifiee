# Unifiée: Vendor Types & Quotation Specification

A **quotation** is a listing a vendor publishes (like a product on Amazon). F&B businesses browse quotations and place orders for whatever quantity suits them.

This document defines, for each vendor type, the quotation types allowed and the details to collect. It is written to drive the design of the `quotations` table.

---

## 0. Common fields (every quotation, every vendor type)

These become real columns on the `quotations` table.

| Field                                       | Type                | Required | Notes                                                                      |
| ------------------------------------------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| `id`                                        | uuid                | yes      | Primary key                                                                |
| `vendor_id`                                 | uuid (FK)           | yes      | The vendor user/profile that owns the quotation                            |
| `vendor_type`                               | enum                | yes      | `manufacturer`, `supplier`, `vendor`, `distributor`                        |
| `quotation_type`                            | text/enum           | yes      | e.g. `paper_cup`, `pizza_box` (see sections below)                         |
| `title`                                     | text                | yes      | Listing title shown to buyers                                              |
| `description`                               | text                | yes      | Free-text details                                                          |
| `images`                                    | array / child table | no       | Product or sample images                                                   |
| `unit_of_measure`                           | enum                | yes      | `piece`, `pack`, `carton`, `kg`, `litre`, `roll`, `set`, `hour`, `project` |
| `unit_price`                                | numeric             | yes      | Base price per unit                                                        |
| `currency`                                  | text                | yes      | Default `INR`                                                              |
| `price_tiers`                               | child table         | no       | Quantity slabs with discounted unit price (min qty, max qty, price)        |
| `min_order_quantity`                        | integer             | yes      | MOQ                                                                        |
| `max_order_quantity`                        | integer             | no       | Cap per order, if any                                                      |
| `quantity_step`                             | integer             | no       | Order must be a multiple of this (e.g. packs of 50)                        |
| `stock_available`                           | integer             | no       | For ready-stock items; null for made-to-order                              |
| `fulfilment_mode`                           | enum                | yes      | `made_to_order`, `ready_stock`, `service`                                  |
| `lead_time_days_min` / `lead_time_days_max` | integer             | yes      | Production or dispatch time                                                |
| `tax_percent`                               | numeric             | yes      | GST rate                                                                   |
| `hsn_sac_code`                              | text                | no       | HSN (goods) or SAC (services)                                              |
| `price_includes_tax`                        | boolean             | yes      |                                                                            |
| `shipping_terms`                            | enum                | yes      | `vendor_pays`, `buyer_pays`, `included`, `pickup_only`                     |
| `shipping_cost_note`                        | text                | no       |                                                                            |
| `address_line_1`                            | text                | yes      | Vendor's full address: building, street                                    |
| `address_line_2`                            | text                | no       | Landmark, area                                                             |
| `city`                                      | text                | yes      |                                                                            |
| `district`                                  | text                | no       |                                                                            |
| `state`                                     | text                | yes      | Also needed to decide CGST/SGST vs IGST                                    |
| `pincode`                                   | text                | yes      |                                                                            |
| `country`                                   | text                | yes      | Default `India`                                                            |
| `latitude` / `longitude`                    | numeric             | no       | Optional, for map and distance-based search                                |
| `payment_terms`                             | enum                | yes      | `advance_100`, `advance_50`, `on_delivery`, `net_15`, `net_30`             |
| `sample_available`                          | boolean             | no       |                                                                            |
| `sample_price`                              | numeric             | no       |                                                                            |
| `valid_from` / `valid_until`                | timestamp           | yes      | Quotation validity window                                                  |
| `status`                                    | enum                | yes      | `draft`, `active`, `paused`, `expired`, `archived`                         |
| `attributes`                                | jsonb               | yes      | Type-specific fields (listed below)                                        |
| `created_at` / `updated_at`                 | timestamp           | yes      |                                                                            |

Everything listed under each quotation type below goes into the `attributes` JSON, unless noted otherwise.

---

## 1. Manufacturer

Makes products to order or in bulk, usually customizable.

### 1.1 Paper Cups (`paper_cup`)

- `use_type`: hot, cold, or both
- `wall_type`: single, double, ripple
- `size_ml` / `size_oz`: 4, 6, 8, 12, 16, etc.
- `material`: kraft, white, PE-coated, PLA-coated, bio-based
- `gsm`: paper weight
- `lid_included`: boolean; `lid_type`: flat, dome, sip-through
- `sleeve_included`: boolean
- `customization_available`: boolean
- `print_type`: flexo, offset, digital, none
- `print_colors_max`: number
- `print_sides`: outside only, inside and outside
- `min_qty_for_custom`: integer
- `artwork_formats_accepted`: AI, PDF, PNG, CDR
- `plate_or_setup_charge`: numeric
- `food_safe_certified`: boolean; `certifications`: FSSAI, ISO, BRC
- `compostable` / `recyclable`: booleans
- `pack_size`: pieces per sleeve/pack; `packs_per_carton`: integer

### 1.2 Pizza Boxes (`pizza_box`)

- `size_inches`: 6, 7, 8, 9, 10, 12, 14, etc.
- `dimensions_mm`: length, width, height
- `material`: corrugated, kraft, duplex board
- `flute_type`: E, B, F
- `gsm`: weight
- `color`: brown, white, custom
- `vent_holes`: boolean
- `grease_resistant_coating`: boolean
- `customization_available`: boolean
- `print_type`, `print_colors_max`, `print_sides`
- `lamination`: none, matt, gloss
- `die_cut_or_mold_charge`: numeric
- `min_qty_for_custom`: integer
- `artwork_formats_accepted`
- `food_safe_certified`, `certifications`
- `pack_size`, `packs_per_carton`

### 1.3 Food Boxes & Containers (`food_container`)

- `container_type`: burger box, meal box, cake box, bakery box, takeaway tray, clamshell, bowl, salad box
- `shape`: square, rectangle, round
- `capacity_ml` or `dimensions_mm`
- `compartments`: number
- `material`: paper, kraft, bagasse, PET, PP, aluminium foil
- `lid_included`, `window_included` (clear PET window)
- `microwave_safe`, `freezer_safe`, `leak_proof`, `grease_resistant`: booleans
- `customization_available`, `print_type`, `print_colors_max`
- `min_qty_for_custom`, `setup_charge`
- `food_safe_certified`, `certifications`
- `compostable` / `recyclable`
- `pack_size`, `packs_per_carton`

### 1.4 Paper / Carry Bags (`paper_bag`)

- `bag_type`: flat handle, twisted handle, SOS (no handle), die-cut handle, pouch
- `dimensions_mm`: width, height, gusset
- `material`: kraft, white kraft, coated
- `gsm`
- `handle_material`: paper, cotton, rope
- `grease_resistant`: boolean
- `window_included`: boolean
- `customization_available`, `print_type`, `print_colors_max`, `print_sides`
- `min_qty_for_custom`, `setup_charge`
- `load_capacity_kg`
- `pack_size`, `packs_per_carton`

### 1.5 Stickers & Labels (`sticker_label`)

- `product_form`: sheet, roll, die-cut
- `shape`: round, square, rectangle, custom die
- `dimensions_mm`
- `material`: paper, vinyl, BOPP, transparent, waterproof
- `finish`: matt, gloss, foil, none
- `adhesive_type`: permanent, removable, freezer-grade
- `food_contact_safe`: boolean
- `labels_per_roll` or `labels_per_sheet`
- `core_size_mm`: for rolls
- `print_type`, `print_colors_max`
- `artwork_formats_accepted`
- `die_charge`, `setup_charge`
- `min_qty_for_custom`

### 1.6 Wrappers & Food Wrap (`wrapper`)

- `wrapper_type`: butter paper, burger wrap, sandwich wrap, foil paper, tissue, parchment
- `dimensions_mm` or `roll_width_mm` and `roll_length_m`
- `material`, `gsm`
- `grease_proof`, `heat_resistant`: booleans
- `customization_available`, `print_type`, `print_colors_max`
- `min_qty_for_custom`, `setup_charge`
- `food_safe_certified`, `certifications`
- `pack_size`, `packs_per_carton`

### 1.7 Cup Sleeves & Carriers (`sleeve_carrier`)

- `item_type`: cup sleeve, 2-cup carrier, 4-cup carrier, tray
- `compatible_cup_size`
- `material`: corrugated, kraft, pulp
- `customization_available`, `print_type`, `print_colors_max`
- `min_qty_for_custom`, `setup_charge`
- `pack_size`, `packs_per_carton`

---

## 2. Supplier

Provides raw materials and ready-stock goods. Mostly non-custom, priced by weight, volume or pack.

### 2.1 Packaging Raw Materials (`packaging_raw_material`)

- `material_type`: kraft paper roll, PE-coated board, cupstock, corrugated sheet, aluminium foil roll, PET film, BOPP film
- `grade`
- `gsm`, `thickness_microns`
- `width_mm`, `length_m` or `weight_per_roll_kg`
- `coating`: PE single side, PE double side, PLA, none
- `food_grade`: boolean
- `origin`: domestic or imported
- `certifications`
- `batch_or_test_report_available`: boolean

### 2.2 Ready-Stock Packaging (`ready_stock_packaging`)

- `item_type`: cups, boxes, bags, containers, wrappers, other
- `size_or_dimensions`
- `material`
- `brand_or_make`
- `colors_available`
- `printed` / `plain`
- `pack_size`, `packs_per_carton`
- `food_safe_certified`, `certifications`
- `compostable` / `recyclable`

### 2.3 Disposable Cutlery & Tableware (`disposable_tableware`)

- `item_type`: spoon, fork, knife, straw, stirrer, plate, bowl, napkin, tissue
- `material`: wood, bamboo, PLA, paper, plastic, bagasse
- `size_mm`
- `individually_wrapped`: boolean
- `color`
- `pack_size`, `packs_per_carton`
- `compostable`, `certifications`

### 2.4 Food Ingredients & Consumables (`food_ingredient`)

- `product_name`, `category`: dairy, flour, sauces, syrups, coffee, tea, toppings, oils, packaged goods
- `brand`
- `pack_weight` / `pack_volume` and `units_per_case`
- `shelf_life_days`
- `storage_condition`: ambient, chilled, frozen
- `fssai_license_number`
- `batch_and_expiry_policy`: minimum remaining shelf life at delivery
- `veg_nonveg`: boolean flag/indicator
- `allergen_info`
- `origin`
- `cold_chain_delivery`: boolean

### 2.5 Cleaning & Hygiene Consumables (`hygiene_consumable`)

- `item_type`: gloves, hairnets, aprons, sanitizer, cleaning chemicals, wipes
- `size_or_volume`
- `material`
- `pack_size`, `packs_per_carton`
- `food_industry_approved`: boolean
- `certifications`

---

## 3. Vendor

Service providers and specialty sellers (design, printing, equipment, bundled offers). Priced per project, hour or item.

### 3.1 Design Services (`design_service`)

- `service_type`: logo, packaging design, menu design, label design, brand identity, social creatives
- `deliverables`: list (e.g. source files, mockups, brand guidelines)
- `number_of_concepts`
- `revisions_included`
- `turnaround_days`
- `file_formats_delivered`: AI, PDF, PNG, SVG
- `pricing_model`: fixed, per hour, per item
- `portfolio_links`
- `usage_rights`: full transfer, licensed
- `adaptation_pack_available`: boolean (seasonal or festive variants)

### 3.2 Printing & Job Work (`printing_service`)

- `print_type`: digital, offset, flexo, screen, foil
- `substrate_supported`: paper, board, vinyl, fabric, packaging items
- `max_print_size_mm`
- `colors_supported`
- `finishes_available`: lamination, UV, embossing, foil
- `buyer_supplies_material`: boolean
- `artwork_formats_accepted`
- `proof_provided`: boolean
- `setup_charge`
- `min_job_size`

### 3.3 Equipment & Machinery (`equipment`)

- `equipment_type`: sealing machine, cup sealer, oven, display unit, POS hardware, packing machine
- `brand`, `model`
- `condition`: new, refurbished
- `power_requirement`
- `dimensions_mm`, `weight_kg`
- `capacity_or_output`
- `warranty_months`
- `installation_included`: boolean
- `after_sales_support`
- `amc_available`: boolean

### 3.4 Seasonal & Festive Packs (`seasonal_pack`)

- `occasion`: Diwali, Christmas, Eid, Valentine's, Holi, summer, monsoon, custom
- `bundle_contents`: list of items with quantity
- `theme_or_design_description`
- `customization_available`: boolean
- `customization_deadline_days_before_occasion`
- `availability_window`: start and end dates
- `min_qty`
- `pack_size`

### 3.5 Branding Kits (`branding_kit`)

- `kit_contents`: list (cups, bags, stickers, menus, etc.)
- `customization_level`: none, logo only, full custom
- `min_qty_per_item`
- `design_included`: boolean
- `turnaround_days`

---

## 4. Distributor

Moves goods in bulk from manufacturers or brands to businesses, typically multi-brand and region-focused.

### 4.1 Bulk Packaging Distribution (`bulk_packaging`)

- `item_type`, `size_or_dimensions`, `material`
- `brands_carried`
- `source_manufacturer` (optional)
- `bulk_unit`: carton, pallet
- `units_per_bulk_unit`
- `stock_available`
- `restock_lead_time_days`
- `warehouse_location`
- `food_safe_certified`, `certifications`
- `customization_via_partner`: boolean

### 4.2 F&B Product Distribution (`fnb_distribution`)

- `product_name`, `category`, `brand`
- `authorized_distributor`: boolean; `authorization_proof`
- `pack_size`, `units_per_case`
- `shelf_life_days`, `storage_condition`, `cold_chain_delivery`
- `fssai_license_number`
- `batch_and_expiry_policy`
- `allergen_info`
- `delivery_frequency`: on demand, weekly, monthly
- `credit_terms_available`: boolean

### 4.3 Equipment Distribution (`equipment_distribution`)

- `equipment_type`, `brand`, `model`
- `authorized_dealer`: boolean
- `warranty_months`
- `installation_included`, `after_sales_support`
- `stock_available`
- `delivery_and_installation_regions`

### 4.4 Wholesale Lots (`wholesale_lot`)

- `lot_description`
- `item_list` (item, quantity, size)
- `lot_size` and `lot_price`
- `reason_for_lot`: surplus, clearance, seasonal
- `lot_expiry_date`
- `condition`
- `non_returnable`: boolean

---

## 5. Directions for setting up the `quotations` table

Do not write code yet. Follow these design directions when building the schema.

1. **Use one `quotations` table for all four vendor types.** Do not create a separate table per vendor type or per quotation type. A single table keeps browsing, search, cart and ordering simple.

2. **Put the common fields (Section 0) as real columns.** These are the fields you filter, sort, price and validate on, so they need proper types, constraints and indexes.

3. **Store type-specific fields in one `attributes` JSONB column.** Everything listed under each quotation type in Sections 1 to 4 goes here. This avoids dozens of mostly empty columns and lets you add new quotation types without migrations.

4. **Create a `quotation_types` reference table.** Each row holds: the type key (`paper_cup`), display name, owning `vendor_type`, and a field definition list (field name, label, data type, required, allowed options, unit). The vendor's "create quotation" form is generated from this definition. Server-side validation of `attributes` uses the same definition.

5. **Use enums or constrained text for fixed value sets.** This applies to `vendor_type`, `status`, `fulfilment_mode`, `unit_of_measure`, `shipping_terms` and `payment_terms`. Add check constraints so bad values cannot be stored.

6. **Validate that `quotation_type` belongs to the vendor's `vendor_type`.** For example, a Distributor must not be able to create a `paper_cup` quotation. Enforce this in application logic and, if possible, with a database constraint or foreign key through `quotation_types`.

7. **Model price tiers as a child table.** Create `quotation_price_tiers` with `quotation_id`, `min_quantity`, `max_quantity` and `unit_price`. Add a constraint so tiers for one quotation do not overlap.

8. **Model images as a child table or an array.** Include display order and mark one as primary. Store file URLs only, never file contents.

9. **Link `vendor_id` with a foreign key to your vendor or user table.** Choose the delete behavior deliberately: restrict deletion, or soft-delete quotations when a vendor is removed.

10. **Enforce ordering rules with check constraints.** Examples: `min_order_quantity > 0`; `max_order_quantity >= min_order_quantity`; `unit_price >= 0`; `valid_until > valid_from`; `lead_time_days_max >= lead_time_days_min`.

11. **Plan for orders referencing quotations.** An order line must snapshot the price, unit, tax and key terms at the time of purchase. A vendor editing a quotation later must never change existing orders. Consider a `version` column on quotations, or copy the values into the order line.

12. **Handle status and expiry explicitly.** Only `active` quotations inside their validity window are orderable. Run a scheduled job, or check at read time, to flip expired quotations to `expired`.

13. **Add indexes for how buyers search.** Index `vendor_id`, `vendor_type`, `quotation_type`, `status` and `valid_until`. Add a GIN index on `attributes` for filtering on type-specific fields. Add a full-text index on `title` and `description`. Consider a partial index on active quotations only.

14. **Add audit and housekeeping columns.** Include `created_at`, `updated_at`, `created_by`, and a soft-delete column (`deleted_at`). Update `updated_at` automatically.

15. **Keep sensitive or fast-changing data out of the JSONB.** Prices, stock and anything used in joins or calculations stay in real columns.

16. **Decide on stock handling early.** For `ready_stock` items, decide whether stock is decremented on order placement or on confirmation. For `made_to_order` and `service` items, leave `stock_available` null.

17. **Store the vendor's full address as structured columns, not one text blob.** Use the address fields in Section 0. Pre-fill them from the vendor's profile when a quotation is created, but let the vendor override them, since one vendor may ship from several warehouses. Index `state` and `city` for location filters.

18. **Plan for future fields.** Keep a `schema_version` on `quotation_types` and store it on each quotation, so older quotations still validate if a type's field list changes.
