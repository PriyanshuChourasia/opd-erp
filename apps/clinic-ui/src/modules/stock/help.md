# Stock — Inventory & Purchases

The Stock module manages medicine inventory across two screens: **Stock Inquiry** (view what's on hand) and **Purchase Entry** (record new stock from suppliers). Every purchase updates the available quantity, tracks medicine batches, and posts journal entries to the accounting system.

## Stock Inquiry

View current stock levels and batch details for every medicine in the catalog.

**What you see:**
- **Summary cards** — medicines tracked, total units in stock, low stock items, and expired batches.
- **Medicine table** — each row shows the current stock quantity and total stock value. Search filters the list; pagination appears when there are many results.
- **Batch details** — expand a row to see every batch with its batch number, expiry date, purchase rate, MRP, remaining quantity, and value.

**Expiry status** is colour-coded:
- **Red "Expired"** — the batch has already passed its expiry date.
- **Amber / orange "N d left"** — expires within 30 / 90 days (reorder soon).
- **Outline "N d left" / "No expiry"** — valid or no expiry recorded.

## Purchase Entry

Record a stock purchase from a supplier. This creates a purchase voucher, adds/updates inventory batches, and posts the corresponding journal entries to accounting.

**How to record a purchase:**
1. **Add items** — type into a line's search box to find a medicine and click it to add. Set the **Qty**, **Purchase Rate** (in paise), **MRP** (in paise), **Batch No**, and **Expiry Date** for each line.
2. **Add more lines** — click **Add another item** for multiple medicines; remove a line with the trash icon.
3. **Purchase details** — enter the **Supplier Name**, **Purchase Date** (defaults to today), optional **Tax** (in paise), and **Notes**.
4. **Check the summary** — the right panel shows the item count, subtotal, tax, and total.
5. **Record** — click **Record Purchase** to save. A toast confirms the voucher number, item count, and total amount; the form then resets for the next entry.

> **Note:** Purchase Rate and MRP are entered in **paise** (₹1 = 100 paise). The medicine's catalog price is auto-filled when you select it, but you can adjust it. A line needs a medicine, a quantity > 0, and a purchase rate > 0 to be valid.
