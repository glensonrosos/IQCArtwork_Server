import mongoose, { Schema } from 'mongoose';

const buyerSchema = mongoose.Schema({
    name:String,
});

const Buyer = mongoose.model('Buyer',buyerSchema);

export default Buyer;