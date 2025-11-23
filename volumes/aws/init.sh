#/bin/sh

aws s3api create-bucket --bucket=$S3_BUCKET_NAME
aws s3api put-bucket-cors --bucket=$S3_BUCKET_NAME --cors-configuration='{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["GET","POST","PUT","DELETE","HEAD"],"AllowedHeaders":["*"]}]}'