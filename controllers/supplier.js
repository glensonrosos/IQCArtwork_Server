import Supplier from "../models/supplier.js";

export const getSuppliers = async (req,res)=>{
    try{
        const suppliers = await Supplier.find();
        res.status(200).json(suppliers);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

