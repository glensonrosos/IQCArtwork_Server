import mongoose, { Schema } from 'mongoose';

const buyerSchema = mongoose.Schema({
    number:Number,
    name:String,
});

const Buyer = mongoose.model('Buyer',buyerSchema);

export default Buyer;