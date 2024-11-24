const express = require('express');
const app = express();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const formidable = require('express-formidable');
const fsPromises = require('fs').promises;

const users_login = {
    'test1': 'abc',
    'test2': 'def'
};

app.use(session({
    secret: "Group5SecretStr",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true })); // Middleware to parse form data

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new FacebookStrategy({
    clientID: '1585378616193751',
    clientSecret: '2d820434613624fb157711fda31a449f',
    callbackURL: 'http://localhost:8099/auth/facebook/callback'
},

//更改f-
function(token, refreshToken, profile, done) {
        console.log("Facebook Profile: " + JSON.stringify(profile));
        let user = {};
        user['id'] = profile.id;
        user['name'] = profile.displayName;
        user['type'] = profile.provider;
        console.log('user object: ' + JSON.stringify(user));
        return done(null, user);
    })
);

// Mongodb connect
var { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const mongourl = 'mongodb+srv://kyk123456:031216Kyk@cluster0.pter2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'Animals';
const collectionName = 'animal';

const client = new MongoClient(mongourl,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

var user = {};
passport.serializeUser(function(user,done){done(null,user);});
passport.deserializeUser(function(id,done){done(null,user);});
app.use(session({
    secret:"381GP Brave Rescues",
    resave:true,
    saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

const insertDocument = async (db,doc) => {
    var collection = db.collection(collectionName);
    let results = await collection.insertOne(doc);
    console.log("insert one document:" +JSON.stringify(results));
    return results;
}
const findAnimalDocument = async (db,criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.find(criteria).toArray();
    return results;
}
const updateDocument = async (db,criteria,updateData) => {
    var collection = db.collection(collectionName);
    let results = await collection.updateOne(
       	criteria,{ $set: updateData}
    );
    return results;
}
const deleteDocument = async (db,criteria) => {
    var collection = db.collection(collectionName);
    let results = await collection.deleteMany( criteria );
    return results;
}

const handle_Find = async (req,res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const docs = await findAnimalDocument(db);
    res.status(200).render('list',{nAnimal:docs.length,Animal:docs,user:req.user});
}

const handle_Create = async (req,res) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let newDoc = {
    userid: req.user.id,
    bookingid: req.fields.bookingid,
    mobile:req.fields.mobile};
	if (req.files.filetoupload && req.files.filetoupload.size > 0){
      	const data = await fsPromises.readFile(req.files.filetoupload.path);
      	newDoc.photo = Buffer.from(data).toString('base64');}
        await insertDocument(db,newDoc);
        res.redirect('/');
}

const handle_Details = async(req,res,criteria) =>{
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = {_id: ObjectId.createFromHexString(criteria._id)};
    const docs =await findDocument(db,DOCID);
    res.status(200).render('details',{ booking:docs[0],user:req.user});
}

const handle_Edit = async(req,res,criteria) => {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = {_id: ObjectId.createFromHexString(criteria._id)};
    const docs = await findDocument(db,DOCID);
    if (docs.length > 0 && docs[0].userid === req.user.id){
        res.status(200).render('edit',{booking:docs[0],user:req.user});
        }else{
        res.status(500).render('info',{message:'Unable to edit - you are not booking owner!',user:req.user});
	}
}

const handle_Update = async (req,res,criteria) =>{
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    let DOCID = {_id: ObjectId.createFromHexString(req.fields._id)};
    const docs = await findDocument(db,DOCID);
    if(docs.length > 0 && docs[0].userid === req.user.id){
        const updateData = {
        bookingid:req.fields.bookingid,
        mobile: req.fields.mobile};
        const results = await updateDocument(db,DOCID,updateData);
        res.status(200).render('info',{ message : `Updated ${results.modifiedCount} document(s)`,user:req.user});
    }else{
        res.status(500).render('info',{ message : 'Unable to update - you are not booking owner!',user:req.user});
    }
}

const handle_Delete = async(req,res) => {
    await client.connect();
    const db = client.db(dbName);
    let DOCID = {_id: ObjectId.createFromHexString(req.query._id)}; 
    const docs = await findDocument(db,DOCID);
    if (docs.length > 0 && docs[0].userid === req.user.id) {
        await deleteDocument(db,DOCID);
        res.status(200).render('info',{message : `Booking ID ${docs[0].bookingid} removed.`,user:req.user});
    }else{
        res.status(500).render('info',{message:'Unable to update - you are not booking owner!',user:req.user});
    }
}


app.set('view engine', 'ejs');
app.set('views', './views'); 

app.use(express.static('public'));

//app.use(formidable());

app.use((req, res, next) => {
    let d = new Date();
    console.log(`TRACE: ${req.path} was requested at ${d.toLocaleDateString()}`);
    next();
});

// Serve the login form
app.get("/login", (req, res) => {
    res.render('login', { message: null }); // Use 'login.ejs' for the form
});

app.post("/login", (req, res, next) => {
    const username = req.body.name;
    const password = req.body.password;
    if (users_login[username] && users_login[username] === password) {
        req.login({ username: username }, (err) => {
            if (err) {
                return res.render('login', { message: 'Login failed. Please try again.' });
            }
            return res.redirect('/content'); // Redirect to content after successful login
        });
    } else {
        res.render('login', { message: 'Invalid username or password' }); // Render 'login.ejs' with the message
    }
});

app.get("/auth/facebook", passport.authenticate("facebook", { scope: "email" }));
app.get("/auth/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect: "/content",
        failureRedirect: "/login"
    })
);

app.get('/', isLoggedIn, (req, res) => {
    res.redirect('/content');
});

app.get("/content", isLoggedIn, (req, res) => {
    res.render('loggedIn', { user: req.user }); // Use 'loggedIn.ejs' for logged-in view
});

app.get("/view", isLoggedIn, (req, res) => {
	res.render('view', {user: req.user});
});

app.get("/report", isLoggedIn, (req, res) => {
	res.render('report', {user:req.user});
});

//更改
app.get("/history", isLoggedIn, (req, res) => {
    handle_Find(res, req.query.docs);
	res.render('history', {user: req.user});
});

app.get("/help", isLoggedIn, (req, res) => {
	res.render('help', {user: req.user});
});

app.get("/information", isLoggedIn, (req, res) => {
	res.render('information', {user: req.user});
});

app.get('/*', (req, res) => {
    res.status(404).render('information', { message: `${req.path} - Unknown request!` });
});


const port = process.env.PORT || 8099;
app.listen(port, () => { console.log(`Listening at http://localhost:${port}`); });