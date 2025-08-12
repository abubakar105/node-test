const mongoose = require ('mongoose')

const ProductSchema = new mongoose.Schema({
    id : String,
    name : String,
    category : String,
    image : String,
    new_price : Number,
    old_price : Number,
    type : String,

})

const Products = new mongoose.model('product', ProductSchema)
module.exports = Products