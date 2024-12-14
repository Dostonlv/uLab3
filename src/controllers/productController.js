const Product = require('../models/product');

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category } = req.query;
    const query = {
      ...(search && { name: new RegExp(search, 'i') }),
      ...(category && { category }),
    };

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (startDate && isNaN(Date.parse(startDate))) {
            return res.status(400).json({ message: 'Invalid startDate format' });
        }
        if (endDate && isNaN(Date.parse(endDate))) {
            return res.status(400).json({ message: 'Invalid endDate format' });
        }

        const matchStage = {};
        if (startDate || endDate) {
            matchStage.$match = {
                created_at: {}
            };
            if (startDate) {
                matchStage.$match.created_at.$gte = new Date(startDate);
            }
            if (endDate) {
                matchStage.$match.created_at.$lte = new Date(endDate);
            }
        }

        const pipeline = [
            ...(Object.keys(matchStage).length ? [matchStage] : []),
            {
                $group: {
                    _id: '$category',
                    totalProducts: { $sum: 1 },
                    averagePrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    products: {
                        $push: {
                            id: '$_id',
                            name: '$name',
                            price: '$price'
                        }
                    }
                }
            },
            {
                $sort: { totalProducts: -1 }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    totalProducts: 1,
                    averagePrice: { $round: ['$averagePrice', 2] },
                    priceRange: {
                        min: '$minPrice',
                        max: '$maxPrice'
                    },
                    products: { $slice: ['$products', 5] } 
                }
            }
        ];

        const report = await Product.aggregate(pipeline);

        const overallStats = await Product.aggregate([
            ...(Object.keys(matchStage).length ? [matchStage] : []),
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    averagePrice: { $avg: '$price' },
                    totalCategories: { $addToSet: '$category' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalProducts: 1,
                    averagePrice: { $round: ['$averagePrice', 2] },
                    totalCategories: { $size: '$totalCategories' }
                }
            }
        ]);

        res.status(200).json({
            summary: overallStats[0] || {
                totalProducts: 0,
                averagePrice: 0,
                totalCategories: 0
            },
            categoryBreakdown: report,
            timeRange: {
                from: startDate || 'all time',
                to: endDate || 'present'
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
