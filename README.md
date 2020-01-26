PDFImagine is a PDF to Image (any image) conversion tool written in NodeJS for speed, utilizing Ghostscript for conversion of PDF. This is a Lambda function, that works with S3 bucket public folders pdfs/ and images/ to extract and convert into images. Ghostscript is hosted in an AWS Layer as a compliment to the Lambda function.

For this code to work, you need to setup a Lambda Layer that points to a functioning verison of Ghostscript. You can create your own GS layer or you can use one already created here: https://github.com/shelfio/ghostscript-lambda-layer/blob/master/README.md


License:

Please include credit to creator in any reuse of application, as well as a link to this github link:

Rocco Castoro
roccavincent@gmail.com
GIT: https://github.com/rcastoro/PDFImagine

Credit to vladgolubev for a premade AWS layer containing Ghostscript 9.2.0, found here: https://github.com/shelfio/ghostscript-lambda-layer/blob/master/README.md

Thanks!!