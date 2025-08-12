const AllProducts = require('./Constant/Products');
const Products = require('./Models/ProductSchema');

const StoreData = async() =>{
    try {
        await Products.deleteMany({});

        const store = await Products.insertMany(AllProducts)
        
    } catch (error) {
        alert(error.message + 'Error');
        
    }
}

module.exports = StoreData