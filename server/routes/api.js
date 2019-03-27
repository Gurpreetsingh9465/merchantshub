let debug = require('debug')('api:');
var express = require('express');
const csurf = require('csurf');
const csrfMiddleware = csurf({
  cookie: true
});
var router = express.Router();
const query = require('../db');
const multer = require("multer");
var uuidv4 = require('uuidv4');
const ejs = require("ejs");
var fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const verifyToken = require('../config/token');
var bcrypt = require('../config/bcrypt');
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      var dir = process.env.IMAGE_DEST;
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      cb(null, dir);
   },
   filename: (req, file, cb) => {
      cb(null,"IMAGE-" + Date.now() + path.extname(file.originalname));
   }
});

var ensureExists = (path, cb) => {
    fs.mkdir(path, (err) => {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

const upload = multer({
   storage: storage,
   limits:{fileSize: 1000000},
}).array("Images",10);

router.get('/verify', verifyToken ,(req, res, next) => {
  if(!res.locals.id) {
    return res.status(400).json({messages:"Unauthorized"});
  } else {
    var querytext = {
      name: 'verify-user',
      text: 'UPDATE users SET isVerified=true WHERE email = $1',
      values: [res.locals.id]
    }
    query(querytext).then((result)=>{
        return res.status(200).json({messages:"Now You can login email verified"});
    }).catch((err)=>{
      return res.status(400).json({messages:"Something Went Wrong"});
    })
  }
});

router.get('/resetpassword', verifyToken, (req,res) => {
  if(!res.locals.id) {
    return res.status(400).json({messages:"Unauthorized"});
  } else {
    var querytext = {
      name: 'find-user',
      text: 'SELECT * FROM users WHERE email = $1',
      values: [res.locals.id]
    }
    query(querytext).then((result)=>{
      if(!result.rows.length) {
        return res.status(400).json({messages:"Unauthorize Access"});
      } else {
        var user = result.rows[0];
        var payload = { _id: user.id };
        var token = jwt.sign(payload, process.env.SECRET, {
          expiresIn: '1h'
        });
        ejs.renderFile(path.resolve(__dirname,"../config/views/resetPassword.ejs"),{
          _token: req.csrfToken(),
          _id: token
        }).then((data) => {
          return res.send(data);
        }).catch((err) => {
          debug(err);
          return res.status(400).json({messages:"Something Went Wrong"});
        });
      }
    }).catch((err)=>{
      debug(err);
      return res.status(400).json({messages:"Something Went Wrong"});
    })
  }
});
router.post('/resetpassword',(req,res) => {
  const token = req.body.id; // query is for email cookie is for auth
  if (!token) {
    return res.status(401).json({Unauthorized: 'No token provided'});
  } else {
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({Unauthorized: 'Invalid token'});
      } else {
        if(!req.body.password) {
          return res.status(401).json({Unauthorized: `Password Can't be empty`});
        }
        if(req.body.password.length < 8) {
          return res.status(401).json({Unauthorized: `Password Can't be too short`});
        }
        var querytext = {
          name: 'update-user',
          text: 'UPDATE users SET password = $1 where id = $2',
          values: [bcrypt.encrypt(req.body.password), decoded._id]
        }
        query(querytext).then((result) => {
          return res.status(200).json({success: `Password changes now you can login with this password`});
        }).catch((err)=>{
          debug(err);
          return res.status(401).json({Unauthorized: `Something Went Wrong`});
        })
      }
    });
  }
})

var moveFile = (from, to) => {
    const source = fs.createReadStream(from);
    const dest = fs.createWriteStream(to);
    return new Promise((resolve, reject) => {
        source.on('end', resolve);
        source.on('error', reject);
        source.pipe(dest);
    });
}

router.post('/upload',verifyToken , upload, csrfMiddleware, (req,res,err) => {
    debug(res.locals.id);
    debug(req.files);
    var oldPath = req.files[0].path;
    var filePath = path.resolve(__dirname,"../../client/public/uploads/"+res.locals.id);
    ensureExists(filePath,(err) => {
      if(err) {
        debug(err);
        return res.status(500).json({messages:{
          danger:'something went wrong'
        }});
      } else {
        var newPath = filePath+"/"+req.files[0].filename;
        moveFile(oldPath, newPath).then((result)=>{
          var url = process.env.REACT_HOST+"/uploads/"+res.locals.id+"/"+req.files[0].filename;
          debug(url);
          var querytext = {
              name: 'update-user',
              text: 'UPDATE users SET profilepic = $1 WHERE id = $2',
              values: [url, res.locals.id]
            }
            query(querytext).then((result)=>{
              return res.status(200).json({messages:{
                success:'Image Uploaded'
              }});
            }).catch((err)=>{
              return res.status(500).json({messages:{
                danger:'something went wrong'
              }});
            })
        }).catch((err)=>{
          debug(err);
          return res.status(500).json({messages:{
            danger:'something went wrong'
          }});
        })
      }
    });
});

router.get('/addproduct', csrfMiddleware, (req,res)=>{
  res.status(200).json({_token:req.csrfToken()});
});

// ,verifyToken , upload
router.post('/addproduct',verifyToken , upload ,csrfMiddleware , (req,res) => {
    debug(req.files)
    var uuid = uuidv4();
    var querytext = {
        name: 'add-product',
        text: 'INSERT INTO product(id, name, warranty, original_price, discounted_price, uploaded_by) VALUES($1,$2,$3,$4,$5,$6);',
        values: [uuid, req.body.name, req.body.warranty, req.body.original_price, req.body.discounted_price, res.locals.id]
      }
    query(querytext).then((result)=>{
      var querytext = {
          name: 'add-product',
          text: 'INSERT INTO product_features(pid, heading, feature) VALUES',
          values: []
        }
      var i = 1
      for(var feature of JSON.parse(req.body.features)) {
        querytext.text +=  '($'+i+','+'$'+(i+1)+','+'$'+(i+2)+')'
        querytext.values.push(uuid);
        querytext.values.push(feature['heading']);
        querytext.values.push(feature['feature']);
        i+=3;
        if(!(i-1 == JSON.parse(req.body.features).length*3)) {
          querytext.text += ',';
        }
      }
      querytext.text += ';';
      query(querytext).then((result)=>{
        var querytext = {
            name: 'add-product-td',
            text: 'INSERT INTO product_tech_detail(pid, head, tail) VALUES',
            values: []
          }
        var i = 1
        for(var td of JSON.parse(req.body.techDetail)) {
          querytext.text += '($'+i+','+'$'+(i+1)+','+'$'+(i+2)+')'
          querytext.values.push(uuid);
          querytext.values.push(td['head']);
          querytext.values.push(td['tail']);
          i+=3;
          if(!(i-1 == JSON.parse(req.body.techDetail).length*3)) {
            querytext.text += ',';
          }
        }
        query(querytext).then((result)=>{
          var thumbOldPath = req.files[0].path;
          var oldPath = [];
          var urlThumb = process.env.REACT_HOST+"/uploads/"+res.locals.id+"/"+req.files[0].filename;;
          var urlImages = [];
          for(var i=1;i<req.files.length;i++) {
            oldPath.push(req.files[i].path);
            urlImages.push(process.env.REACT_HOST+"/uploads/"+res.locals.id+"/"+req.files[i].filename);
          }
          var filePath = path.resolve(__dirname,"../../client/public/uploads/"+res.locals.id);
          ensureExists(filePath,(err) => {
            if(err) {
              return res.status(500).json({messages:{
                danger:'Something went wrong'
              }});
            } else {
              var newPath = filePath+"/"+req.files[0].filename;
              moveFile(thumbOldPath,newPath).then(() => {
                for(var i in oldPath) {
                  debug(filePath+"/"+req.files[i].filename);
                  moveFile(oldPath[i],filePath+"/"+req.files[i].filename).then(()=>{
                    debug('Moved');
                  }).catch((err)=>{
                    debug(err);
                    return res.status(500).json({messages:{
                      danger:'Something went wrong'
                    }});
                  })
                }
                var querytext1 = {
                    name: 'add-images-thumb',
                    text: 'INSERT INTO product_thumb_image(pid,image_url) VALUES($1,$2);',
                    values: [uuid, urlThumb]
                  }
                var querytext2 = {
                  name: 'add-images',
                  text: 'INSERT INTO product_images(pid,image_url) VALUES',
                  values: []
                }
                var i = 1
                for(var url of urlImages) {
                  querytext2.text += '($'+i+','+'$'+(i+1)+')'
                  querytext2.values.push(uuid);
                  querytext2.values.push(url);
                  i+=2;
                  if(!(i-1 == (urlImages.length * 2))) {
                    querytext2.text += ',';
                  }
                }
                querytext2.text += ';';
                query(querytext1).then((result)=>{
                  debug(result);
                  query(querytext2).then((result)=>{
                    return res.status(200).json({messages:{
                      success:'Product added'
                    }});
                  }).catch((err)=>{
                    debug(err);
                    return res.status(500).json({messages:{
                      danger:'Something went wrong'
                    }});
                  })

                }).catch((err) => {
                  debug(err);
                  return res.status(500).json({messages:{
                    danger:'Something went wrong'
                  }});
                });
              }).catch((err)=>{
                debug(err);
                return res.status(500).json({messages:{
                  danger:'Something went wrong'
                }});
              })
            }
          })
        }).catch((err)=>{
          debug(err);
          return res.status(500).json({messages:{
            danger:'Something went wrong'
          }});
        })
      }).catch((err)=>{
        debug(err);
        return res.status(500).json({messages:{
          danger:'Use different name'
        }});
      })
    }).catch((err)=>{
      debug(err);
      return res.status(500).json({messages:{
        danger:'Use different name'
      }});
    })
});



module.exports = router;
