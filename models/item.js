import mongoose, { Schema } from 'mongoose';

const itemSchema = mongoose.Schema({
    number: { type: Number, required: true },
    itemCode: { type: String, required: true},
    itemDescription:{ type: String, required: true, unique: true },
    weight:Number,
    color:String,
    buyer:String,
    material:String,
});

const Item = mongoose.model('Item',itemSchema);

export default Item;