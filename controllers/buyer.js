import Buyer from "../models/buyer.js";

export const getBuyers = async (req,res)=>{
    try{
        const buyers = await Buyer.find();
        res.status(200).json(buyers);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const createBuyer = async (req,res)=>{
    const buyer = req.body;
    try{
        const newBuyer = await new Buyer(buyer);
        await newBuyer.save();
        res.status(201).json(buyer);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

