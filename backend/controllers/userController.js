const User = require('../models/User');
const USER_ID = process.env.USER_ID;

exports.updateBalance = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance + amount < 0) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    user.balance += amount;
    await user.save();

    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const userId = USER_ID;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};