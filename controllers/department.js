import Department from "../models/department.js";

export const getDepartments = async (req,res)=>{
    try{
        const department = await Department.find();
        res.status(200).json(department);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
export const createDepartment = async (req,res)=>{
    const department = req.body;
    try{
        const newDepartment = await new Department(department);
        await newDepartment.save();
        res.status(201).json(department);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

