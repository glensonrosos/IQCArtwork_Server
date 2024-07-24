import Buyer from "../models/buyer.js";

export const getBuyers = async (req,res)=>{
    try{
        const buyers = await Buyer.find();
        res.status(200).json(buyers);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

