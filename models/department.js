import mongoose, { Schema } from 'mongoose';

const departmentSchema = mongoose.Schema({
    department:{ type: String, required: true, unique: true },
});

const Department = mongoose.model('Department',departmentSchema);

export default Department;