import mongoose, { Schema } from 'mongoose';

const supplierSchema = mongoose.Schema({
    number:Number,
    supplierCode:{ type: String, required: true, unique: true },
    name:{ type: String, required: true, unique: true },
});

const Supplier = mongoose.model('Supplier',supplierSchema);

export default Supplier;