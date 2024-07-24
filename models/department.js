import mongoose, { Schema } from 'mongoose';

const departmentSchema = mongoose.Schema({
    department:String,
});

const Department = mongoose.model('Department',departmentSchema);

export default Department;