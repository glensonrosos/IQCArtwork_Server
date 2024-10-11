import mongoose, { Schema } from 'mongoose';

const buyerSchema = mongoose.Schema({
    number:Number,
    name:{ type: String, required: false, unique: true },
});

const Buyer = mongoose.model('Buyer',buyerSchema);

export default Buyer;