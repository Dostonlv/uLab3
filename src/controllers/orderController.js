const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');


const PaymentMethod = {
    PAYME: 'Payme',
    CLICK: 'Click',
    UZUM: 'Uzum',
}

exports.createOrder = async (req, res) => {
    try {
        const { product_ids, total_price, customer_name, payment_method } = req.body;

        if (!product_ids || !total_price || !customer_name || !payment_method) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

      
        console.log("BODY: ",product_ids, total_price, customer_name, payment_method);
        

        let objectIds;
        try {
            objectIds = product_ids.map((id) => new mongoose.Types.ObjectId(id.trim()));
        } catch (error) {
            return res.status(400).json({
                message: 'Invalid product ID format',
                error: error.message,
            });
        }
        const validProducts = await Product.find({ _id: { $in: objectIds } });

        const invalidIds = objectIds.filter(
            (id) => !validProducts.some((product) => product._id.equals(id))
        );

        if (invalidIds.length > 0) {
            return res.status(400).json({
                message: 'Some product IDs do not exist in the database',
                invalid_ids: invalidIds,
            });
        }
        

        if (!Object.values(PaymentMethod).includes(payment_method)) {
            return res.status(400).json({ message: `Unsupported payment method: ${payment_method}` });
        }


        const order = await Order.create({
            product_ids: objectIds,
            total_price,
            customer_name,
            payment_method,
        });

        res.status(201).json({
            message: 'Order created successfully',
            order,
        });
    } catch (error) {
        res.status(500).json({ message: 'Order creation failed', error: error.message });
    }
};


exports.getReport = async (req, res) => {
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
        $lookup: {
          from: 'products',
          localField: 'product_ids',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $group: {
          _id: '$payment_method',
          totalRevenue: { $sum: '$total_price' },
          totalOrders: { $count: {} },
          averageOrderValue: { $avg: '$total_price' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];

    const report = await Order.aggregate(pipeline);

    res.status(200).json({
      data: report,
      timeRange: {
        from: startDate || 'all time',
        to: endDate || 'present'
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, payment_method } = req.query;
        const query = {
            ...(payment_method && { payment_method }),
        };

        const orders = await Order.find(query)
            .populate('product_ids', 'name price category')
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ created_at: -1 });

        const total = await Order.countDocuments(query);

        res.status(200).json({
            data: orders,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('product_ids', 'name price category');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { product_ids, total_price, customer_name, payment_method } = req.body;
        
        if (payment_method && !Object.values(PaymentMethod).includes(payment_method)) {
            return res.status(400).json({ message: `Unsupported payment method: ${payment_method}` });
        }

        let objectIds;
        if (product_ids) {
            try {
                objectIds = product_ids.map((id) => new mongoose.Types.ObjectId(id.trim()));
                const validProducts = await Product.find({ _id: { $in: objectIds } });
                
                const invalidIds = objectIds.filter(
                    (id) => !validProducts.some((product) => product._id.equals(id))
                );

                if (invalidIds.length > 0) {
                    return res.status(400).json({
                        message: 'Some product IDs do not exist in the database',
                        invalid_ids: invalidIds,
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    message: 'Invalid product ID format',
                    error: error.message,
                });
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                ...(objectIds && { product_ids: objectIds }),
                ...(total_price && { total_price }),
                ...(customer_name && { customer_name }),
                ...(payment_method && { payment_method }),
            },
            { new: true }
        ).populate('product_ids', 'name price category');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({
            message: 'Order updated successfully',
            order: updatedOrder
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.status(200).json({ 
            message: 'Order deleted successfully',
            order: deletedOrder
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


