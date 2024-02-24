'use strict'

import User from './student.model.js'
import { encrypt, checkPassword, checkUpdate} from '../utils/validator.js'
import { generateJwt } from '../utils/jwt.js'

export const test = (req, res)=>{
    return res.send('Hello World')
}

//REGISTRAR
export const registerUser = async(req, res) =>{
    try{
        let data = req.body
        //Verificamos que la password no sea meno que 8 caracteres
        /*if (data.password.length < 8) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long' });
        }
        //Verificamos si existe el mismo usuario
        const existingUser = await User.findOne({ username: data.username })
        if (existingUser) {
            return res.status(400).send({ message: 'Username already exists' })
        }*/

        data.password = await encrypt(data.password)

        let user = new User(data)
        await user.save()
        return res.send({message: 'Registered successfully'})
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Error registering user', err})
    }
}


//LOGIN 
export const login = async(req, res) =>{
    try{
        let { username, password } = req.body
        let user = await User.findOne({username})

        if(user && await checkPassword(password, user.password)){
            let loggedUser = {
                uid: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }
            let token = await generateJwt(loggedUser)
            //damos acceso
            return res.send({
                msg: `Welcome ${user.name}`,
                loggedUser,
                token
            })
        }
    }catch(err){
        console.error(err)
        return res.status(500).send({message: 'Failed to login', err})
    }
}

//UPDATE
export const update = async (req, res) => {
    try {
        let { id } = req.params
        let data = req.body
        let update = checkUpdate(data, id)
        if (!update) return res.status(400).send({ msg: 'Have submitted some data tahat cannot be updated or missing data' })

        //Actualizamos la base de datos
        let updateUser = await User.findOneAndUpdate(
            { _id: id },
            data,
            { new: true }
        )
        //Validamos si se actualizó
        if (!updateUser) return res.status(401).send({ msg: 'User not found not updated' })
        return res.send({ msg: 'Updated user', updateUser })
    } catch (err) {
        console.error(err)
        if (err.keyValue.username) return res.status(400).send({ msg: `Username ${err.keyValue.username} is already taken` })
        return res.status(500).send({ msg: 'Error updating account' })
    }
}

//DELETE
export const deleteUs = async (req, res) => {
    try {
        let { id } = req.params
        let deleteUser = await User.findOneAndDelete({ _id: id })
        if (!deleteUser) return res.status(404).send({ msg: 'Account not found and not deleted' })
        return res.send({ msg: `The account with username ${deleteUser.username} deleted seccessfully` })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ msg: 'Error deleting account' })
    }
}