const fs = require('fs');
const ss = require('stringstream');
const AWS = require('aws-sdk');
const exec = require('await-exec');
const s3 = new AWS.S3();
const os = require('os');
const path = require('path');

const Bucket = 's3convertpdf'

exports.handler = async (event) => {
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

    const operation = event.queryStringParameters ? event.queryStringParameters.operation : null;
    let s3data_pdf = {};
    let bucketObjs = [];
        s3data_pdf.customArgs = "";
        s3data_pdf.keys = JSON.parse(JSON.stringify(await listAllKeysPDF()));
        s3data_pdf.keys.Contents.forEach(item => {
          if(item.Key != "pdfs/")
          {
            bucketObjs.push(item.Key.replace("pdfs/", ""));
          }
        });
        
        await getBucketObjects(bucketObjs, s3data_pdf);
        return sendRes(200, 'Successfully executed');
};

async function getBucketObjects(bucketObjects, s3data_pdf) {
  for (obj of bucketObjects) {
    console.log(obj);
    s3data_pdf.base64Image = await getFileBase64(obj);
    s3data_pdf.base64Image = s3data_pdf.base64Image.replace("undefined", "");
    await operate(s3data_pdf, obj);
  }

  console.log('Finished!');
}

const sendRes = (status, body) => {
  var response = {
    statusCode: status,
    headers: {
      "Content-Type": "text/html"
    },
    body: body
  };
  return response;
}

async function listAllKeysPDF()
{
  var params = {
    Bucket: Bucket, /* required */
    Prefix: 'pdfs'
  };
  return await s3.listObjectsV2(params).promise();
}

async function getFileBase64(object)
{
    let params = {
        Bucket: 's3convertpdf/pdfs',
        Key: object
      };

    var file;
    var base64Str;

    file = s3.getObject(params).createReadStream()
        .pipe(ss('base64'));  

    file.on('data', data => base64Str += data);
      return new Promise(function(resolve) {
        file.on('end', () => resolve(base64Str));
    });
}

const operate = async (body, fileName) => {
    const customArgs = body.customArgs.split(',') || [];
    let outputExtension = 'png';
    let inputFile = null, outputFile = null;
    
    try {
      if (body.base64Image) {
        inputFile = '/tmp/inputFile.pdf';
        const buffer = new Buffer(body.base64Image, 'base64');
        fs.writeFileSync(inputFile, buffer);
        customArgs.unshift(inputFile); // customArgs should be like [inputFile, options, outputfile]
      }

      await ghostScriptPDF(fileName);
      console.log("done with ghostscript");

      // GET ALL IMAGES IN BUCKET
      return new Promise((resolve, reject) => 
      { 
          fs.readdir('/tmp/', async (err, files) => {
            for(const file of files)
            {
              console.log("OUTPUT FILE: " + file);
              if(path.extname(file) != "pdf")
              {
                let fileBuffer = new Buffer(fs.readFileSync('/tmp/' + file));
                fs.unlinkSync('/tmp/' + file);

                await putfile(fileBuffer, file);
              }
            }
          err ? reject(err) : resolve(files);
        });
      });

      // customArgs.push(outputFile);
      // await performConvert(customArgs);
    } catch (e) {
      console.log(`Error:${e}`);
      return sendRes(500, e);
    }
}

const ghostScriptPDF = async (fileName) => {
  // return await exec('gs -h');
  return await exec('gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=pnggray -r600 -dDownScaleFactor=3 -sOutputFile=/tmp/'+fileName+'-%03d.png /tmp/inputFile.pdf');
}

const putfile = async (buffer, fileName) => {
  let params = {
    Bucket: 's3convertpdf',
    Key: 'images/' + fileName,
    Body: buffer
  };
  return await s3.putObject(params).promise();
}