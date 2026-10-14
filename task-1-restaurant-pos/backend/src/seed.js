require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const connectDB = require('./db');

const initialUsers = [
  {
    name: 'Admin Manager',
    email: 'admin@urstechsolution.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Staff Cashier',
    email: 'staff@urstechsolution.com',
    password: 'staff123',
    role: 'staff'
  }
];

const initialMenuItems = [
  {
    name: 'Crispy Truffle Fries',
    category: 'Starters',
    price: 249,
    description: 'Golden fries tossed in white truffle oil with parmesan and fresh herbs',
    isAvailable: true,
    imageUrl: 'https://res.cloudinary.com/drpxqylq4/image/upload/v1791970208/restaurant_pos_menu/crispy_truffle_fries.jpg'
  },
  {
    name: 'Buffalo Chicken Wings',
    category: 'Starters',
    price: 349,
    description: 'Crispy glazed wings served with house blue cheese dip and celery sticks',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Garlic Herb Bruschetta',
    category: 'Starters',
    price: 229,
    description: 'Toasted artisan sourdough topped with vine tomatoes, garlic, basil, and balsamic glaze',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Classic Smash Burger',
    category: 'Mains',
    price: 429,
    description: 'Two smashed prime beef patties, aged cheddar, pickles, grilled onions, and secret sauce on brioche',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Woodfired Margherita Pizza',
    category: 'Mains',
    price: 499,
    description: 'San Marzano tomato base, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Creamy Fettuccine Alfredo',
    category: 'Mains',
    price: 399,
    description: 'Handmade pasta ribbons tossed in rich garlic butter and aged parmesan cream sauce',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Grilled Salmon Bowl',
    category: 'Mains',
    price: 649,
    description: 'Atlantic salmon fillet with quinoa, roasted greens, avocado, and sesame ginger glaze',
    isAvailable: false,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Warm Chocolate Lava Cake',
    category: 'Desserts',
    price: 249,
    description: 'Decadent dark chocolate molten center served warm with vanilla bean gelato',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'New York Cheesecake',
    category: 'Desserts',
    price: 279,
    description: 'Velvety classic cream cheese cake with strawberry berry compote',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Iced Caramel Macchiato',
    category: 'Beverages',
    price: 199,
    description: 'Espresso poured over chilled whole milk with vanilla and butter caramel drizzle',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Fresh Mint Lime Soda',
    category: 'Beverages',
    price: 129,
    description: 'Sparkling mineral water infused with crushed garden mint, key lime, and rock salt',
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Seasoned Onion Rings',
    category: 'Sides',
    price: 189,
    description: 'Beer-battered golden sweet onion rings with spicy chipotle mayo',
    isAvailable: true,
    imageUrl: 'https://res.cloudinary.com/drpxqylq4/image/upload/v1791970209/restaurant_pos_menu/seasoned_onion_rings.jpg'
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    for (const u of initialUsers) {
      await User.create(u);
    }

    await MenuItem.deleteMany({});
    await MenuItem.insertMany(initialMenuItems);

    await Order.deleteMany({});

    console.log('Task 1 Database seeded successfully (0 pre-orders, clean deployment state)');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
