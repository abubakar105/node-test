const mongoose = require ('mongoose')
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name : {
        required : true,
        type : String,
        trim : true
    },
    email : {
        required : true,
        type : String,
        trim : true,
        unique : true,
        match : /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password : {
        required : true,
        type : String,
        minlength : 6
    },
    token : {
        type : String
    },
    expireToken : {
        type : Date
    },
    cart : Array,
    forgetPasswordToken : String,
    forgetTokenExpire : Date
})

userSchema.pre('save', async function(next){
    if(this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

userSchema.methods.addCart = async function(product){
    this.cart = await this.cart.concat(product);
    await this.save();
    return this.cart
}
const USER = mongoose.model('User', userSchema);
module.exports = USER;