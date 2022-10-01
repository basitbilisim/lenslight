import Photo from "../models/photoModel.js";
import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const createPhoto = async (req,res) => {
    const result = await cloudinary.uploader.upload(
        req.files.image.tempFilePath,
        {
            use_filename:true,
            folder:"lenslight_tr"
        }
    )
    try{
        await Photo.create({
            name:req.body.name,
            description:req.body.description,
            user:res.locals.user._id,
            url:result.secure_url,
            image_id:result.public_id
        })
        fs.unlinkSync(req.files.image.tempFilePath)
        res.status(201).redirect("/users/dashboard")
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const getAllPhotos = async (req,res) => {
    try{
        const photos = res.locals.user
        ? await Photo.find({user:{$ne:res.locals.user._id}})
        : await Photo.find({})

        
        res.status(201).render("photos",{
            photos,
            link:"photos"
        })


        
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const getPhoto = async (req,res) => {
    try{
        const photo = await Photo.findById({_id: req.params.id}).populate('user')
        let isOwner = false

        if(res.locals.user){
            isOwner = photo.user.equals(res.locals.user._id)
        }
        res.status(201).render("photo",{
            photo,
            link:"photos",
            isOwner
        })
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const deletePhoto = async (req,res) => {
    try{
        const photo = await Photo.findById(req.params.id)
        const photoId = photo.image_id
        await cloudinary.uploader.destroy(photoId)
        await Photo.findOneAndRemove({_id : req.params.id})
        res.redirect("/users/dashboard")
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}


const updatePhoto = async (req,res) => {
    try{
        const photo = await Photo.findById(req.params.id)

        if(req.files){
            const photoId = photo.image_id
            await cloudinary.uploader.destroy(photoId)
            const result = await cloudinary.uploader.upload(
                req.files.image.tempFilePath,
                {
                    use_filename:true,
                    folder:"lenslight_tr"
                }
            )
            photo.url = result.secure_url
            photo.image_id = result.public_id

            fs.unlinkSync(req.files.image.tempFilePath)
        }
        photo.name = req.body.name
        photo.description = req.body.description

        photo.save()

        res.redirect('back')
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}


export {
    createPhoto,getAllPhotos,getPhoto,deletePhoto,updatePhoto
}