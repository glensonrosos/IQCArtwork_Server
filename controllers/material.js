import Material from "../models/material.js";

export const getMaterials = async (req,res)=>{
    try{
        const materials = await Material.find();
        res.status(200).json(materials);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const createMaterial = async (req,res)=>{
    const material = req.body;
    try{
        const newMaterial = await new Material(material);
        await newMaterial.save();
        res.status(201).json(material);
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

