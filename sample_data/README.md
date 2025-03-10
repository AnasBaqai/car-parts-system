# Car Parts System - Sample Data

This directory contains sample data for the Car Parts System in JSON format. You can use these files to populate your MongoDB database with realistic test data.

## Files Included

1. **categories.json** - Contains 25 categories for car parts
2. **parts.json** - Contains 25 parts with references to categories
3. **orders.json** - Contains 25 orders with references to parts

## How to Import the Data

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the desired collection (categories, parts, or orders)
4. Click on "Add Data" and select "Import File"
5. Choose the corresponding JSON file
6. Select "JSON" as the file type
7. Click "Import"

### Using mongoimport Command Line Tool

```bash
# Import categories
mongoimport --db car-parts-system --collection categories --file categories.json --jsonArray

# Import parts
mongoimport --db car-parts-system --collection parts --file parts.json --jsonArray

# Import orders
mongoimport --db car-parts-system --collection orders --file orders.json --jsonArray
```

## Important Notes

The sample data includes MongoDB ObjectIDs and proper references between collections:

1. Each document has a unique `_id` field with an ObjectID.
2. In the parts collection, the `category` field references the corresponding category's `_id`.
3. In the orders collection, each item's `part` field references the corresponding part's `_id`.

This means you can import the data directly without needing to manually replace any IDs. The relationships between collections are already established.

## Data Structure

### Categories

```json
{
  "_id": { "$oid": "..." },
  "name": "Category Name",
  "description": "Category Description"
}
```

### Parts

```json
{
  "_id": { "$oid": "..." },
  "name": "Part Name",
  "description": "Part Description",
  "category": { "$oid": "..." }, // Reference to category ID
  "price": 0.0,
  "quantity": 0,
  "minQuantity": 0,
  "manufacturer": "Manufacturer Name",
  "partNumber": "Part Number",
  "barcode": "Barcode Number"
}
```

### Orders

```json
{
  "_id": { "$oid": "..." },
  "orderNumber": "ORD-XXXXX",
  "items": [
    {
      "part": { "$oid": "..." }, // Reference to part ID
      "quantity": 0,
      "price": 0.0
    }
  ],
  "totalAmount": 0.0,
  "paymentMethod": "CASH or CARD",
  "status": "PENDING, COMPLETED, or CANCELLED",
  "customerName": "Customer Name",
  "customerPhone": "Customer Phone",
  "createdAt": "ISO Date String"
}
```

## Modifying the Data

You can modify these files to suit your specific needs:

- Add more items
- Change prices, quantities, or descriptions
- Adjust the relationships between items

After making changes, simply re-import the data using the methods described above.
