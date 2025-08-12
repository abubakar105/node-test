const jwt = require('jsonwebtoken')
const Access_Token_Key = process.env.Access_Token_Key

const Authentication = (req, res, next) =>{
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({message : 'Unauthorized, token missing'});

   try {
    const user = jwt.verify(token, Access_Token_Key);
    req.token = token;
    req.user = {id : user.id};    
    next();

   } catch (error) {
    res.status(401).json({message : 'invalid or expire token', error})
   }
}
module.exports = Authentication;