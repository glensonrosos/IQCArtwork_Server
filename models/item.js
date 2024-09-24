import mongoose, { Schema } from 'mongoose';

const itemSchema = mongoose.Schema({
    number: { type: Number, required: false },
    itemCode: { type: String, required: false},
    itemDescription:String,
    weight:Number,
    buyer:String,
    material:String,
});

const Item = mongoose.model('Item',itemSchema);

export default Item;