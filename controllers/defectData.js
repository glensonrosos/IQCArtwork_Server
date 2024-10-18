import DefectData from "../models/defectData.js";
import Inspection from "../models/inspection.js";

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

export const checkEmptyDefect = async (req,res)=>{

    const {inspectionId} = req.body;

    
    
    let flag = false;

    try{
        const checkExist = await Inspection.findOne({_id:inspectionId});

        // console.log(` checkEmptyDefect called with ${JSON.stringify(checkExist)}`);

        if(checkExist){

            const defectFirstDefect = await DefectData.findOne({inspectionId,passType:'firstPassDefect'});
            const defectFirstPullOut = await DefectData.findOne({inspectionId,passType:'firstPassPullOut'});
            const defectSecondPullOut = await DefectData.findOne({inspectionId,passType:'secondPassPullOut'});
           
          
            let firstDefectFlag = parseInt(checkExist.firstPass.defectQty);
            let firstPullOutFlag = parseInt(checkExist.firstPass.totalPullOutQty);
            let secondPullOutFlag = parseInt(checkExist.secondPass.totalPullOutQty);


            switch (true) {
                case true:
                    if(firstDefectFlag > 0){
                        if(defectFirstDefect == null){
                            flag = true;
                            break;
                        }else if(defectFirstDefect.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                   
                case true:
                    if(firstPullOutFlag > 0){
                        if(defectFirstPullOut == null){
                            flag = true;
                            break;
                        }else if(defectFirstPullOut.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                   
                case true:
                    if(secondPullOutFlag > 0){
                        if(defectSecondPullOut == null){
                            flag = true;
                            break;
                        }else if(defectSecondPullOut.defectDetails[0])
                            flag = false;
                        else{
                            flag = true;
                            break;
                        }
                    }
                    
                default:
                    // Default case if no action matches
                    break;
            }

            await Inspection.findByIdAndUpdate(inspectionId,{emptyDefect:flag},{new:true});

            console.log(` flag => ${flag}
                \n ${firstDefectFlag} firstDefectFlag ${defectFirstDefect}
                \n ${firstPullOutFlag}  firstPullOutFlag ${defectFirstPullOut}
                 \n ${secondPullOutFlag} secondPullOutFlag ${defectSecondPullOut}
                `);

            return res.status(201).json({message: 'found'});
        }
        return res.status(201).json({message: 'no found',flag});
    }catch(error){
        res.status(404).json({message: error.message});
    }
}
