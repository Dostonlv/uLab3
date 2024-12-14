# E-commerce API

A RESTful API for managing products and orders with payment integration.

## Features

- Product management (CRUD operations)
- Order processing with multiple payment methods
- Advanced reporting for products and orders
- Search and pagination
- Swagger documentation


> [!CAUTION]
> Prerequisites
> - Node.js (v20 or higher)
> - MongoDB
> - npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your configuration:

```bash
MONGO_URI=<your-mongodb-uri>
PORT=<your-port>
```

4. Start the server:
```bash
npm start
```


## API Documentation

The API documentation is available at `/api-docs` when the server is running. You can test all endpoints directly from the Swagger UI.

### Products API

#### Create Product

```
POST /products
```
Request body:

```json
{
"name": "Product Name",
"price": 99.99,
"category": "Electronics"
}
```


#### Get Products

```
GET /api/products?page=1&limit=10&search=keyword&category=Electronics
```

#### Product Report

```
GET /api/products/report?startDate=2024-01-01&endDate=2024-01-31
```
Returns statistics about products grouped by category.

### Orders API

#### Create Order

```
POST /api/orders
```
Request body:

```json
{
"product_ids": ["product_id1", "product_id2"],
"total_price": 199.98,
"customer_name": "John Doe",
"payment_method": "Payme"
}
```


#### Get Orders Report
```
GET /api/orders/report?startDate=2024-01-01&endDate=2024-12-31
```
Returns order statistics grouped by payment method.

### Payment Methods

The API supports the following payment methods:
> [!IMPORTANT]
> - Payme
> - Click
> - Uzum 





## Error Handling

> [!Note]
> The API uses standard HTTP status codes:
> - 200: Success
> - 201: Created
> - 400: Bad Request
> - 404: Not Found
> - 500: Server Error

Error responses include a message explaining what went wrong:

```json
{
"message": "Error description"
}
```



## Data Models

you can see the data models swagger-jsdoc

```
GET /api-docs
```

>[!WARNING]
> MongoDB Aggregation Examples

### Product Report Aggregation

```
GET /api/products/report?startDate=2024-01-01&endDate=2024-01-31
```
Returns statistics about products grouped by category.


``` javascript
// Group products by category with statistics
const pipeline = [
// Match by date range (optional)
{
$match: {
created_at: {
$gte: new Date("2024-01-01"),
$lte: new Date("2024-12-31")
}
}
},
// Group by category
{
$group: {
id: '$category',
totalProducts: { $sum: 1 },
averagePrice: { $avg: '$price' },
minPrice: { $min: '$price' },
maxPrice: { $max: '$price' }
}
},
// Sort by total products
{
$sort: {
totalProducts: -1
}
},
// Format output
{
$project: {
id: 0,
category: '$id',
totalProducts: 1,
averagePrice: { $round: ['$averagePrice', 2] },
priceRange: {
min: '$minPrice',
max: '$maxPrice'
}
}
}
]
```


### Order Report Aggregation

``` javascript
javascript
// Group orders by payment method with product details
const pipeline = [
// Match by date range (optional)
{
$match: {
created_at: {
$gte: new Date("2024-01-01"),
$lte: new Date("2024-12-31")
}
}
},
// Join with products collection
{
$lookup: {
from: 'products',
localField: 'product_ids',
foreignField: 'id',
as: 'products'
}
},
// Group by payment method
{
$group: {
id: '$payment_method',
totalRevenue: { $sum: '$total_price' },
totalOrders: { $count: {} },
averageOrderValue: { $avg: '$total_price' }
}
},
// Sort by total revenue
{
$sort: {
totalRevenue: -1
}
}
]
```


> [!NOTE]
> These aggregation pipelines demonstrate:
> - `$match`: Filter documents by conditions
> - `$group`: Group documents by a field with aggregations
> - `$lookup`: Join with other collections
> - `$project`: Shape the output format
> - `$sort`: Sort the results