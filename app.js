require('dotenv').config();
const express=require('express');
const bodyParser=require('body-parser');
const mongoose =require('mongoose');
const encrypt=require('mongoose-encryption');
const port=process.env.PORT||3000;
const app=express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/userDB',{useNewUrlParser: true});

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']});

const User=mongoose.model('User',userSchema);

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/submit',(req,res)=>{
    res.render('submit');
});

app.get('/logout',(req,res)=>{
    res.render('home');
});


app.post('/register',async(req,res)=>{

    const username=req.body.username;
    const password=req.body.password;

    const newUser=new User({
        username:username,
        password:password
    });

    await newUser.save();
    res.render('secrets');
});

app.post('/login',async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

   const user= await User.findOne({username:username});

   if(user)
   {
    if(user.password===password)
    {
        res.render('secrets');
    }
    else{
        res.send('Invalid Password');
    }
   }
else{
    res.send('User not found');
}
   
});

app.post('/submit',async (req,res)=>{
    res.render('secrets');
});

app.listen(port,()=>{
console.log(`server running at port ${port}`);
});