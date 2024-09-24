import Supplier from "../models/supplier.js";

export const getSuppliers = async (req,res)=>{
    try{
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const createSupplier = async (req,res)=>{
    const supplier = req.body;
    try{
        const newSupplier = await new Supplier(supplier);
        await newSupplier.save();
        res.status(201).json(supplier);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}


