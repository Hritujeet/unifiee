import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs("docs/assets", exist_ok=True)

# 1. System Architecture Diagram
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")

# Title
ax.text(50, 96, "UNIFIÉE System Architecture & Request Lifecycle", ha="center", va="center", fontsize=14, fontweight="bold", color="#0F172A", family="sans-serif")

def draw_box(ax, x, y, w, h, bg, border, title, items, subtitle=""):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8,rounding_size=2", ec=border, fc=bg, lw=1.5)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h - 4, title, ha="center", va="top", fontsize=10, fontweight="bold", color=border, family="sans-serif")
    if subtitle:
        ax.text(x + w/2, y + h - 8, subtitle, ha="center", va="top", fontsize=7.5, fontstyle="italic", color="#64748B", family="sans-serif")
    start_y = y + h - (12 if subtitle else 8)
    for i, it in enumerate(items):
        ax.text(x + 3, start_y - i*4.2, f"• {it}", ha="left", va="top", fontsize=8, color="#334155", family="sans-serif")

# Client Layer
draw_box(ax, 3, 62, 28, 28, "#F8FAFC", "#2563EB", "1. Three-Sided Clients", 
         ["F&B Businesses (Buyers)", "Packaging Designers (Creators)", "Converters / Plants (Printers)"], "Browsers & Responsive UI")

# Edge & Gateway
draw_box(ax, 36, 62, 28, 28, "#F0FDF4", "#16A34A", "2. Edge & Security Gate", 
         ["Better Auth 1.7.5 (OAuth & Cookie)", "Sliding Rate Limiter (IP-scoped)", "Idempotency Engine (SHA-256)"], "Next.js 16 Middleware")

# App Router & Server Actions
draw_box(ax, 69, 62, 28, 28, "#EFF6FF", "#1D4ED8", "3. App Router & Actions", 
         ["Server Components (RSC)", "Server Actions (Drizzle Mutations)", "Zod Schema Validation Engine"], "Next.js Server Execution")

# AI & Hybrid Search
draw_box(ax, 10, 12, 38, 38, "#FAF5FF", "#9333EA", "4. AI Orchestration & Search", 
         ["PII Scrubbing Guardrail (stripPii)", "Gemini 2.5 Flash (Spec Extraction)", "Mistral Small (Automated Failover)", "Mistral Embed (1024-dim Vectors)", "Reciprocal Rank Fusion (RRF)"], "Vercel AI SDK 7.0 Pipeline")

# Storage & Neon Database
draw_box(ax, 52, 12, 38, 38, "#FFFBEB", "#D97706", "5. Neon PostgreSQL & pgvector", 
         ["26 Relational Tables (Drizzle ORM)", "pgvector Cosine Distance (<=>)", "Full-Text Lexical Search (tsvector)", "Transactional Orders & Idempotency", "Multi-tenant WHERE Isolation"], "ACID Serverless Database")

# Connecting Arrows
def draw_arrow(ax, x1, y1, x2, y2, label=""):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color="#475569", lw=1.5, mutation_scale=12))
    if label:
        ax.text((x1+x2)/2, (y1+y2)/2 + 1.5, label, ha="center", va="bottom", fontsize=7.5, fontweight="bold", color="#475569", family="sans-serif")

draw_arrow(ax, 31, 76, 36, 76, "HTTPS")
draw_arrow(ax, 64, 76, 69, 76, "Auth OK")
draw_arrow(ax, 83, 62, 71, 50, "SQL Mutate")
draw_arrow(ax, 45, 62, 29, 50, "AI Stream")
draw_arrow(ax, 48, 31, 52, 31, "Vector Query")

plt.tight_layout()
plt.savefig("docs/assets/architecture_diagram.png", bbox_inches="tight", dpi=300)
plt.close()

# 2. 6-Step Closed-Loop Flow Diagram
fig2, ax2 = plt.subplots(figsize=(10, 4.5), dpi=300)
ax2.set_xlim(0, 100)
ax2.set_ylim(0, 100)
ax2.axis("off")

ax2.text(50, 94, "The 6-Step Closed-Loop Procurement Lifecycle", ha="center", va="center", fontsize=13, fontweight="bold", color="#0F172A", family="sans-serif")

steps = [
    ("Step 1", "AI Spec\nExtraction", "Gemini converts\nnotes to specs", "#3B82F6"),
    ("Step 2", "Designer\nEngagement", "Hires designer\nfor dieline CAD", "#8B5CF6"),
    ("Step 3", "Hybrid RAG\nMatching", "RRF pairs specs\nwith converters", "#10B981"),
    ("Step 4", "B2B Quoting\n& Orders", "Accepts quote;\nidempotent order", "#F59E0B"),
    ("Step 5", "Prepress Proof\nSignoff", "Brand approves\ndieline proof", "#EC4899"),
    ("Step 6", "Production\n& Delivery", "Converter prints\n& logs stages", "#06B6D4"),
]

step_width = 13.5
step_gap = 2.8
start_x = 2

for idx, (s_num, s_title, s_desc, color) in enumerate(steps):
    x = start_x + idx * (step_width + step_gap)
    y = 20
    rect = patches.FancyBboxPatch((x, y), step_width, 58, boxstyle="round,pad=0.6,rounding_size=2", ec=color, fc="#F8FAFC", lw=1.8)
    ax2.add_patch(rect)
    
    # Header pill
    pill = patches.FancyBboxPatch((x + 1.5, y + 46), step_width - 3, 8, boxstyle="round,pad=0.3,rounding_size=1.5", ec=color, fc=color, lw=1)
    ax2.add_patch(pill)
    ax2.text(x + step_width/2, y + 50, s_num, ha="center", va="center", fontsize=8, fontweight="bold", color="#FFFFFF", family="sans-serif")
    
    ax2.text(x + step_width/2, y + 36, s_title, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E293B", family="sans-serif")
    ax2.text(x + step_width/2, y + 16, s_desc, ha="center", va="center", fontsize=7.5, color="#64748B", family="sans-serif")
    
    if idx < len(steps) - 1:
        ax2.annotate("", xy=(x + step_width + step_gap - 0.5, y + 29), xytext=(x + step_width + 0.5, y + 29),
                     arrowprops=dict(arrowstyle="-|>", color="#94A3B8", lw=1.5, mutation_scale=10))

plt.tight_layout()
plt.savefig("docs/assets/procurement_flow.png", bbox_inches="tight", dpi=300)
plt.close()

print("SUCCESS: Generated architecture_diagram.png and procurement_flow.png in docs/assets")
