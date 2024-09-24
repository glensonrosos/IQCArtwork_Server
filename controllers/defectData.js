import DefectData from "../models/defectData.js";
import mongoose from "mongoose";

export const getDefectDatas = async (req, res) => {
    const { inspectionId, passType } = req.params;
    
    try {

        // Find defect data based on inspectionId and passType
        const defectDatas = await DefectData.findOne({inspectionId,passType});
        
        if (!defectDatas) {
            return res.status(200).json({defectDetails:[] });
        }

        return res.status(200).json(defectDatas);   

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while retrieving defect data." });
    }
};

export const createDefectData = async (req,res)=>{
    const defectData = req.body;

    try{
        const checkExist = await DefectData.findOne({inspectionId:defectData.inspectionId,passType:defectData.passType});
        if(checkExist){
            const updatedDefectData = await DefectData.findByIdAndUpdate(checkExist._id,{defectDetails:defectData.defectDetails,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString(),
                deletedAt:null,
                editedBy:defectData.editedBy,
            },{new:true});
            return res.status(201).json(updatedDefectData);
        }else{
            const newDefectData = await new DefectData({...defectData,
                createdAt:new Date().toISOString(),
                updatedAt:new Date().toISOString(),
                deletedAt:null,
                editedBy:defectData.editedBy});
            await newDefectData.save();
            return res.status(201).json(defectData);
        }
    }catch(error){
        res.status(404).json({message: error.message});
    }
}

export const updateDefectData = async (req,res)=>{
    const defectData = req.body;
    const {_id} = req.params;

    try{
        const checkExist = await DefectData.findOne({inspectionId:_id});
        if(checkExist){
            const updatedDefectData = await DefectData.findByIdAndUpdate(checkExist._id,{defectDetails:defectData.defectDetails},{new:true});
            return res.status(201).json(updatedDefectData);
        }
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
