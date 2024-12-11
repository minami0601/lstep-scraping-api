# 一旦仮
export PROJECT_ID=buyma-tool-341513
export IMAGE_NAME=buyma-review-backend-api
export SERVICE_NAME=buyma-review-backend-api

# GCRにイメージをpush
gcloud builds submit --tag=asia.gcr.io/$PROJECT_ID/$IMAGE_NAME --project=$PROJECT_ID

gcloud run deploy $SERVICE_NAME \
    --image=asia.gcr.io/$PROJECT_ID/$IMAGE_NAME \
    --region=asia-northeast1
# --platform=managed \
# --port=8080 \
# --memory=1024Mi \
# --timeout=900

# --max-instances=MAX_INSTANCES
# --min-instances=MIN_INSTANCES
# 900
# cpu: 1000m
# memory: 1024Mi
# timeoutSeconds: 900
