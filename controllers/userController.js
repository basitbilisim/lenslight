import User from '../models/userModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Photo from '../models/photoModel.js'

const createUser = async (req,res) => {
    try{
        const user = await User.create(req.body)
        res.status(201).json({
            user:user._id
        })
    }catch(error){
        let errors2 = {}
        if(error.code === 11000){
            errors2.email = "The Email is Alredy Register"
        }
        if(error.name === 'ValidationError'){
            Object.keys(error.errors).forEach(key => {
                errors2[key] = error.errors[key].message
            })
        }
        res.status(400).json(errors2)
    }
}



const loginUser = async (req,res) => {
    try{
        const {username,password} = req.body
        const user = await User.findOne({username})
        let same = false 
        if(user){
            same = await bcrypt.compare(password,user.password)
        }else {
            return res.status(401).json({
                success:false,
                error:'There is no such user'
            })
        }
        if(same){
            const token = createToken(user._id)
            res.cookie("jwt",token,{
                httpOnly:true,
                maxAge:1000*60*60*24
            })
            res.redirect('/users/dashboard')
        }else {
            res.status(500).json({
                success:false,
                error:'Password false entered'
            })
        }
        
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const getDashboard = async (req,res) => {
    const photos = await Photo.find({user:res.locals.user._id})
    const user = await User.findById({_id:res.locals.user._id}).populate(["followings","followers"])    
    res.render("dashboard",{
        link:"dashboard",
        photos,
        user
    })
}

const createToken = (userId) => {
    return jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:'1d',
    })
}


const getAllUsers = async (req,res) => {
    try{
        const users = await User.find({  _id:{$ne:res.locals.user._id}})
        res.status(201).render("users",{
            users,
            link:"users"
        })
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}


const getAUser = async (req,res) => {
    try{
        const user = await User.findById({_id: req.params.id})
        const inFollowers = user.followers.some((follower) => {
            return follower.equals(res.locals.user._id) 
        })

        const photos = await Photo.find({user: user._id})
        res.status(201).render("user",{
            user,
            photos,
            link:"users",
            inFollowers
        })
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const follow = async (req,res) => {
    try{
        let user = await User.findByIdAndUpdate({_id:req.params.id},
            {
                $push:{followers:res.locals.user._id}
            },
            {
                new:true
            })
        user = await User.findByIdAndUpdate(
            {_id:res.locals.user._id},
            {
                $push:{followings:req.params.id}
            },
            {
                new:true
            }
        )
        res.status(201).redirect(`/users/${req.params.id}`)
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

const unfollow = async (req,res) => {
    try{
        let user = await User.findByIdAndUpdate({_id:req.params.id},
            {
                $pull:{followers:res.locals.user._id}
            },
            {
                new:true
            })
        user = await User.findByIdAndUpdate(
            {_id:res.locals.user._id},
            {
                $pull:{followings:req.params.id}
            },
            {
                new:true
            }
        )
        res.status(201).redirect(`/users/${req.params.id}`)
    }catch(err){
        res.status(500).json({
            success:false,
            error:err
        })
    }
}

export {
    createUser,loginUser,getDashboard,getAllUsers,getAUser,follow,unfollow
}