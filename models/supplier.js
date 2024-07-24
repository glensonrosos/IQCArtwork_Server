import mongoose, { Schema } from 'mongoose';

const supplierSchema = mongoose.Schema({
    name:String,
});

const Supplier = mongoose.model('Supplier',supplierSchema);

export default Supplier;