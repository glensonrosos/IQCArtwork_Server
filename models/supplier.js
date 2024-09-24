import mongoose, { Schema } from 'mongoose';

const supplierSchema = mongoose.Schema({
    number:Number,
    supplierCode:String,
    name:String,
});

const Supplier = mongoose.model('Supplier',supplierSchema);

export default Supplier;