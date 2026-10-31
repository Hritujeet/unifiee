import re
import docx

def update_markdown():
    with open('docs/PROJECT_DOCUMENTATION.md', 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. 6 stages vs 9 stages
    text = text.replace('across a 6-stage lifecycle', 'across a 9-stage lifecycle')
    text = text.replace('The 6-Step Closed-Loop', 'The 9-Stage Closed-Loop')
    text = text.replace('6-step', '9-stage')
    text = text.replace('6-stage milestone bar', '9-stage manufacturing milestone progression')
    text = text.replace('6-segment stage bar', 'manufacturing milestone progression bar')
    text = text.replace('Stage {stageIndex} of 6', 'Stage {stageIndex} of 9')

    # 2. AI extractor button
    text = text.replace('Click "Extract Specs with AI"', 'Click "Parse with AI"')
    text = text.replace('"Extract Specs with AI"', '"Parse with AI"')
    text = text.replace('Extract Specs with AI', 'Parse with AI')

    # 3. Table count (35 tables across 6 categories)
    text = text.replace('**36 distinct tables** grouped into five functional categories', '**35 distinct tables** grouped into six functional categories')
    text = text.replace('36 distinct database tables grouped into five functional categories', '35 distinct database tables grouped into six functional categories')
    text = text.replace('(Drizzle ORM — 36 Tables)', '(Drizzle ORM — 35 Tables)')
    text = text.replace('ORM — 36 Tables', 'ORM — 35 Tables')

    # Fix category 4 listing which said 8 tables but listed 9
    text = text.replace('Collaborative Services (8 tables)', 'Collaborative Services (9 tables)')

    # 4. Illustrative scenario
    text = text.replace('named **"Bella Crust"**:', 'named **"Bella Crust" (illustrative)**:')
    text = text.replace("Studio Apex's Standard package (₹6,500", "Studio Apex's Standard package (₹6,500 [illustrative]")
    text = text.replace('Delta Eco Packs\' quotation and attaches the completed Studio Apex dieline', 'Delta Eco Packs (illustrative, ₹17.20/box) quotation and attaches the completed Studio Apex dieline')
    text = text.replace('Demo Persona Names**: The database contains initial seed personas ("Brewed Cafe", "John", "The Dark Knight"). The narrative in this document uses "Bella Crust Pizzeria" and "Delta Eco Packs" as an illustrative scenario.',
                        'Demo Persona Names**: Fictional personas like "Bella Crust" (illustrative), "Studio Apex" (₹6,500 illustrative), "Delta Eco Packs" (₹17.20/box illustrative) are narrative illustrations. In the actual seed database, realistic production accounts are seeded with active catalogs and gigs (e.g. Meera Iyer, Kabir Sethi, PackCraft Industries, EcoWrap Solutions, Monsoon Bean Cafe).')

    # 5. Escrow and payment badges in Section 9
    text = text.replace('The escrow settlement badges (*"Instant Escrow Settlement Enabled"*, *"In Escrow"*, *"Settled & Paid"*)',
                        'The payment and status badges (*"Registered Converter"*, *"Payments not connected yet"*, *"Settled offline"* / *"Direct settlement"* / *"Pending Payment"*)')

    with open('docs/PROJECT_DOCUMENTATION.md', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Updated docs/PROJECT_DOCUMENTATION.md successfully.")

def update_docx():
    doc = docx.Document('docs/UNIFIEE_EUREKA_PROTOTYPE_DOCUMENTATION.docx')

    # Paragraph replacements
    for p in doc.paragraphs:
        if '6-stage lifecycle' in p.text:
            p.text = p.text.replace('6-stage lifecycle', '9-stage lifecycle')
        if 'The 6-Step Closed-Loop' in p.text:
            p.text = p.text.replace('The 6-Step Closed-Loop', 'The 9-Stage Closed-Loop')
        if 'Extract Specs with AI' in p.text:
            p.text = p.text.replace('Extract Specs with AI', 'Parse with AI')
        if '36 distinct database tables grouped into five functional categories' in p.text:
            p.text = p.text.replace('36 distinct database tables grouped into five functional categories', '35 distinct database tables grouped into six functional categories')
        if 'Bella Crust' in p.text and '(illustrative)' not in p.text:
            p.text = p.text.replace("named 'Bella Crust'", "named 'Bella Crust' (illustrative)")
            p.text = p.text.replace("Bella Crust inputs", "Bella Crust (illustrative) inputs")
            p.text = p.text.replace("Bella Crust browses", "Bella Crust (illustrative) browses")
            p.text = p.text.replace("Bella Crust accepts", "Bella Crust (illustrative) accepts")
        if 'Studio Apex' in p.text and '(illustrative)' not in p.text:
            p.text = p.text.replace("Studio Apex's Standard package (₹6,500", "Studio Apex's Standard package (₹6,500 [illustrative]")
        if '₹17.20/box' in p.text and '(illustrative)' not in p.text:
            p.text = p.text.replace('₹17.20/box', '₹17.20/box (illustrative)')
        if 'Demo Persona Names' in p.text:
            p.text = "Demo Persona Names: Narrative examples like 'Bella Crust', 'Studio Apex' (₹6,500), and 'Delta Eco Packs' (₹17.20/box) are illustrative figures for the walkthrough. In the active seeded database, all accounts use complete realistic personas (Meera Iyer, Kabir Sethi, PackCraft Industries, EcoWrap Solutions, Monsoon Bean Cafe) with active gigs, catalogs, and orders."
        if 'Instant Escrow Settlement Enabled' in p.text:
            p.text = p.text.replace("'Instant Escrow Settlement Enabled', 'In Escrow', 'Settled & Paid'", "'Registered Converter', 'Payments not connected yet', 'Settled offline'")

    # Table replacements (especially code blocks and tables)
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    if '6-stage' in p.text:
                        p.text = p.text.replace('6-stage', '9-stage')
                    if '36 distinct' in p.text:
                        p.text = p.text.replace('36 distinct', '35 distinct')

    doc.save('docs/UNIFIEE_EUREKA_PROTOTYPE_DOCUMENTATION.docx')
    print("Updated docs/UNIFIEE_EUREKA_PROTOTYPE_DOCUMENTATION.docx successfully.")

if __name__ == '__main__':
    update_markdown()
    update_docx()
