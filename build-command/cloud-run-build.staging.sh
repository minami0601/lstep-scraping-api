# 一旦仮
export PROJECT_ID=buyma-tool-341513
export IMAGE_NAME=buyma-staging-backend-api
export SERVICE_NAME=buyma-staging-backend-api

# GCRにイメージをpush
gcloud builds submit --tag=asia.gcr.io/$PROJECT_ID/$IMAGE_NAME --project=$PROJECT_ID

gcloud run deploy $SERVICE_NAME \
    --image=asia.gcr.io/$PROJECT_ID/$IMAGE_NAME \
    --region=asia-northeast1
# --platform=managed \
